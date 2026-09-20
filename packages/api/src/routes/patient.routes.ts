/**
 * Routes patient — /api/v1/patient
 * 
 * GET    /profile    — Récupérer le profil
 * PUT    /profile    — Modifier le profil
 * PUT    /emergency  — Modifier le profil ICE
 * GET    /family     — Lister les enfants
 * POST   /family     — Ajouter un enfant
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@sante-ci/database';
import {
  updateProfileSchema,
  updateEmergencyProfileSchema,
  addFamilyMemberSchema,
} from '@sante-ci/shared';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import bcrypt from 'bcryptjs';

export const patientRoutes = Router();

// Toutes les routes patient nécessitent une authentification
patientRoutes.use(authenticate);

// GET /api/v1/patient/profile
patientRoutes.get(
  '/profile',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id: req.user!.sub },
      });

      if (!patient) {
        throw new AppError(404, 'PATIENT_NOT_FOUND', 'Patient non trouvé.');
      }

      res.json({
        success: true,
        data: {
          id: patient.id,
          nom: patient.nom,
          prenom: patient.prenom,
          email: patient.email,
          telephone: patient.telephone,
          numeroCmu: patient.numeroCmu,
          dateNaissance: patient.dateNaissance?.toISOString() ?? null,
          iceGroupeSanguin: patient.iceGroupeSanguin,
          iceAllergies: patient.iceAllergies,
          isBiometricEnabled: patient.isBiometricEnabled,
          hasPinSetup: !!patient.pinHash,
          createdAt: patient.createdAt.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/patient/profile
patientRoutes.put(
  '/profile',
  validate(updateProfileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updateData: Record<string, unknown> = {};
      const allowed = ['nom', 'prenom', 'telephone', 'numeroCmu', 'iceGroupeSanguin', 'iceAllergies'];

      for (const key of allowed) {
        if (req.body[key] !== undefined) {
          updateData[key] = req.body[key];
        }
      }

      if (req.body.dateNaissance) {
        updateData.dateNaissance = new Date(req.body.dateNaissance);
      }

      const patient = await prisma.patient.update({
        where: { id: req.user!.sub },
        data: updateData,
      });

      res.json({
        success: true,
        data: {
          id: patient.id,
          nom: patient.nom,
          prenom: patient.prenom,
          email: patient.email,
          telephone: patient.telephone,
          numeroCmu: patient.numeroCmu,
          dateNaissance: patient.dateNaissance?.toISOString() ?? null,
          iceGroupeSanguin: patient.iceGroupeSanguin,
          iceAllergies: patient.iceAllergies,
          isBiometricEnabled: patient.isBiometricEnabled,
          hasPinSetup: !!patient.pinHash,
          createdAt: patient.createdAt.toISOString(),
        },
        message: 'Profil mis à jour avec succès.',
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/patient/emergency
patientRoutes.put(
  '/emergency',
  validate(updateEmergencyProfileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patient = await prisma.patient.update({
        where: { id: req.user!.sub },
        data: {
          iceGroupeSanguin: req.body.iceGroupeSanguin,
          iceAllergies: req.body.iceAllergies,
        },
      });

      res.json({
        success: true,
        data: {
          iceGroupeSanguin: patient.iceGroupeSanguin,
          iceAllergies: patient.iceAllergies,
        },
        message: 'Profil d\'urgence mis à jour.',
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/patient/family
patientRoutes.get(
  '/family',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const children = await prisma.patient.findMany({
        where: { parentId: req.user!.sub },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          dateNaissance: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      res.json({
        success: true,
        data: children.map((child) => ({
          ...child,
          dateNaissance: child.dateNaissance?.toISOString() ?? null,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/patient/family
patientRoutes.post(
  '/family',
  validate(addFamilyMemberSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Générer un mot de passe temporaire pour le profil enfant
      const tempPassword = await bcrypt.hash('temp-' + Date.now(), 10);

      const child = await prisma.patient.create({
        data: {
          nom: req.body.nom,
          prenom: req.body.prenom,
          email: req.body.email,
          telephone: req.body.telephone,
          passwordHash: tempPassword,
          dateNaissance: req.body.dateNaissance ? new Date(req.body.dateNaissance) : null,
          parentId: req.user!.sub,
        },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          dateNaissance: true,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          ...child,
          dateNaissance: child.dateNaissance?.toISOString() ?? null,
        },
        message: 'Profil familial ajouté.',
      });
    } catch (error) {
      next(error);
    }
  }
);
