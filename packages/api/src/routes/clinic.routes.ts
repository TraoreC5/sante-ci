/**
 * Routes cliniques — /api/v1/clinics
 * 
 * GET /           — Lister les cliniques (filtrage par ville)
 * GET /:id        — Détail d'une clinique
 * GET /:id/doctors — Médecins d'une clinique
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@sante-ci/database';
import { AppError } from '../middleware/error.middleware';

export const clinicRoutes = Router();

// GET /api/v1/clinics?ville=Abidjan&search=palmier
clinicRoutes.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ville = req.query.ville as string | undefined;
      const search = req.query.search as string | undefined;

      const where: Record<string, unknown> = { isActive: true };

      if (ville) {
        where.ville = { contains: ville, mode: 'insensitive' };
      }

      if (search) {
        where.nom = { contains: search, mode: 'insensitive' };
      }

      const cliniques = await prisma.clinique.findMany({
        where,
        select: {
          id: true,
          nom: true,
          adresse: true,
          ville: true,
          telephoneContact: true,
          _count: { select: { medecins: true } },
        },
        orderBy: { nom: 'asc' },
      });

      res.json({
        success: true,
        data: cliniques.map((c) => ({
          id: c.id,
          nom: c.nom,
          adresse: c.adresse,
          ville: c.ville,
          telephoneContact: c.telephoneContact,
          medecinCount: c._count.medecins,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/clinics/:id
clinicRoutes.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clinique = await prisma.clinique.findUnique({
        where: { id: req.params.id },
        include: {
          medecins: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              specialite: true,
            },
          },
        },
      });

      if (!clinique) {
        throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinique non trouvée.');
      }

      res.json({
        success: true,
        data: {
          id: clinique.id,
          nom: clinique.nom,
          adresse: clinique.adresse,
          ville: clinique.ville,
          telephoneContact: clinique.telephoneContact,
          medecins: clinique.medecins,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/clinics/:id/doctors?specialite=Cardiologie
clinicRoutes.get(
  '/:id/doctors',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const specialite = req.query.specialite as string | undefined;

      // Vérifier que la clinique existe
      const clinique = await prisma.clinique.findUnique({
        where: { id: req.params.id },
        select: { id: true, nom: true },
      });

      if (!clinique) {
        throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinique non trouvée.');
      }

      const where: Record<string, unknown> = { cliniqueId: req.params.id };
      if (specialite) {
        where.specialite = { contains: specialite, mode: 'insensitive' };
      }

      const medecins = await prisma.medecin.findMany({
        where,
        select: {
          id: true,
          nom: true,
          prenom: true,
          specialite: true,
        },
        orderBy: [{ specialite: 'asc' }, { nom: 'asc' }],
      });

      res.json({
        success: true,
        data: medecins.map((m) => ({
          id: m.id,
          nom: m.nom,
          prenom: m.prenom,
          specialite: m.specialite,
          clinique: { id: clinique.id, nom: clinique.nom },
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);
