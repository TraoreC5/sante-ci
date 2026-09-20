/**
 * Routes rendez-vous — /api/v1/appointments
 * 
 * GET    /                — Liste des RDV (passés, à venir)
 * POST   /                — Créer un RDV
 * PUT    /:id/cancel      — Annuler un RDV
 * GET    /available-slots — Créneaux disponibles d'un médecin
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@sante-ci/database';
import { createAppointmentSchema } from '@sante-ci/shared';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

export const appointmentRoutes = Router();

// Toutes les routes RDV nécessitent une authentification
appointmentRoutes.use(authenticate);

// GET /api/v1/appointments?status=upcoming|past&page=1&limit=10
appointmentRoutes.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
      const status = req.query.status as string | undefined;

      const now = new Date();
      const where: Record<string, unknown> = { patientId: req.user!.sub };

      if (status === 'upcoming') {
        where.dateHeure = { gte: now };
        where.statut = 'PLANIFIE';
      } else if (status === 'past') {
        where.OR = [
          { dateHeure: { lt: now } },
          { statut: { in: ['TERMINE', 'ANNULE'] } },
        ];
      }

      const [appointments, total] = await Promise.all([
        prisma.rendezVous.findMany({
          where,
          include: {
            medecin: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                specialite: true,
                clinique: {
                  select: {
                    id: true,
                    nom: true,
                    adresse: true,
                    ville: true,
                    telephoneContact: true,
                  },
                },
              },
            },
          },
          orderBy: { dateHeure: status === 'past' ? 'desc' : 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.rendezVous.count({ where }),
      ]);

      res.json({
        success: true,
        data: appointments.map((apt) => ({
          id: apt.id,
          dateHeure: apt.dateHeure.toISOString(),
          motif: apt.motif,
          statut: apt.statut,
          statutPaiement: apt.statutPaiement,
          transactionId: apt.transactionId,
          medecin: {
            id: apt.medecin.id,
            nom: apt.medecin.nom,
            prenom: apt.medecin.prenom,
            specialite: apt.medecin.specialite,
            clinique: apt.medecin.clinique,
          },
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/appointments
appointmentRoutes.post(
  '/',
  validate(createAppointmentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { medecinId, dateHeure, motif } = req.body;

      // Vérifier que le médecin existe
      const medecin = await prisma.medecin.findUnique({
        where: { id: medecinId },
        include: { clinique: true },
      });

      if (!medecin) {
        throw new AppError(404, 'DOCTOR_NOT_FOUND', 'Médecin non trouvé.');
      }

      // Vérifier que le créneau est dans le futur
      const appointmentDate = new Date(dateHeure);
      if (appointmentDate <= new Date()) {
        throw new AppError(400, 'INVALID_DATE', 'Le rendez-vous doit être dans le futur.');
      }

      // Vérifier qu'il n'y a pas de conflit (créneau de 30 min)
      const slotStart = new Date(appointmentDate.getTime() - 30 * 60 * 1000);
      const slotEnd = new Date(appointmentDate.getTime() + 30 * 60 * 1000);

      const conflict = await prisma.rendezVous.findFirst({
        where: {
          medecinId,
          statut: 'PLANIFIE',
          dateHeure: {
            gte: slotStart,
            lte: slotEnd,
          },
        },
      });

      if (conflict) {
        throw new AppError(409, 'SLOT_TAKEN', 'Ce créneau est déjà pris. Veuillez en choisir un autre.');
      }

      const appointment = await prisma.rendezVous.create({
        data: {
          patientId: req.user!.sub,
          medecinId,
          dateHeure: appointmentDate,
          motif,
          statut: 'PLANIFIE',
          statutPaiement: 'EN_ATTENTE',
        },
        include: {
          medecin: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              specialite: true,
              clinique: {
                select: {
                  id: true,
                  nom: true,
                  adresse: true,
                  ville: true,
                  telephoneContact: true,
                },
              },
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: appointment.id,
          dateHeure: appointment.dateHeure.toISOString(),
          motif: appointment.motif,
          statut: appointment.statut,
          statutPaiement: appointment.statutPaiement,
          medecin: {
            id: appointment.medecin.id,
            nom: appointment.medecin.nom,
            prenom: appointment.medecin.prenom,
            specialite: appointment.medecin.specialite,
            clinique: appointment.medecin.clinique,
          },
        },
        message: 'Rendez-vous créé avec succès.',
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/appointments/:id/cancel
appointmentRoutes.put(
  '/:id/cancel',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appointment = await prisma.rendezVous.findFirst({
        where: {
          id: req.params.id,
          patientId: req.user!.sub,
        },
      });

      if (!appointment) {
        throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Rendez-vous non trouvé.');
      }

      if (appointment.statut !== 'PLANIFIE') {
        throw new AppError(400, 'CANNOT_CANCEL', 'Ce rendez-vous ne peut pas être annulé.');
      }

      // Vérifier que le RDV est dans le futur (pas d'annulation le jour même)
      const hoursUntil = (appointment.dateHeure.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntil < 2) {
        throw new AppError(
          400,
          'TOO_LATE_TO_CANCEL',
          'Impossible d\'annuler un rendez-vous moins de 2 heures avant l\'heure prévue.'
        );
      }

      const updated = await prisma.rendezVous.update({
        where: { id: req.params.id },
        data: { statut: 'ANNULE' },
      });

      res.json({
        success: true,
        data: {
          id: updated.id,
          statut: updated.statut,
        },
        message: 'Rendez-vous annulé.',
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/appointments/available-slots?medecinId=xxx&date=2024-03-15
appointmentRoutes.get(
  '/available-slots',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { medecinId, date } = req.query;

      if (!medecinId || !date) {
        throw new AppError(400, 'MISSING_PARAMS', 'medecinId et date sont requis.');
      }

      // Vérifier que le médecin existe
      const medecin = await prisma.medecin.findUnique({ where: { id: medecinId as string } });
      if (!medecin) {
        throw new AppError(404, 'DOCTOR_NOT_FOUND', 'Médecin non trouvé.');
      }

      // Générer les créneaux pour la journée (8h-17h, toutes les 30min)
      const targetDate = new Date(date as string);
      const slots: string[] = [];

      for (let hour = 8; hour < 17; hour++) {
        for (const min of [0, 30]) {
          const slotDate = new Date(targetDate);
          slotDate.setHours(hour, min, 0, 0);
          
          // Pas de créneau dans le passé
          if (slotDate > new Date()) {
            slots.push(slotDate.toISOString());
          }
        }
      }

      // Trouver les créneaux déjà pris
      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      const bookedAppointments = await prisma.rendezVous.findMany({
        where: {
          medecinId: medecinId as string,
          statut: 'PLANIFIE',
          dateHeure: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        select: { dateHeure: true },
      });

      const bookedTimes = new Set(
        bookedAppointments.map((apt) => apt.dateHeure.toISOString())
      );

      const availableSlots = slots.filter((slot) => !bookedTimes.has(slot));

      res.json({
        success: true,
        data: {
          medecinId,
          date: date as string,
          slots: availableSlots,
          totalSlots: slots.length,
          availableCount: availableSlots.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);
