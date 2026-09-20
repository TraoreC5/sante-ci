/**
 * Routes accès éphémère — /api/v1/ephemeral
 * 
 * POST /generate  — Générer un accès éphémère (PIN + QR)
 * POST /validate  — Valider un accès via code PIN
 * POST /validate-qr — Valider un accès via QR code
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ephemeralAccessSchema } from '@sante-ci/shared';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import * as ephemeralService from '../services/ephemeral-access.service';

export const ephemeralRoutes = Router();

// POST /api/v1/ephemeral/generate — Patient authentifié génère un accès
ephemeralRoutes.post(
  '/generate',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await ephemeralService.generateEphemeralAccess(req.user!.sub);

      res.status(201).json({
        success: true,
        data: {
          id: result.id,
          codePinEphemere: result.codePinEphemere,
          qrCodeToken: result.qrCodeToken,
          expiresAt: result.expiresAt.toISOString(),
        },
        message: 'Code d\'accès éphémère généré. Valide pendant 2 heures.',
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/ephemeral/validate — Médecin valide via code PIN
ephemeralRoutes.post(
  '/validate',
  authenticate,
  validate(ephemeralAccessSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await ephemeralService.validateEphemeralAccess(
        req.body.codePinEphemere,
        req.user!.sub
      );

      if (!result) {
        res.status(404).json({
          success: false,
          error: {
            code: 'INVALID_ACCESS_CODE',
            message: 'Code d\'accès invalide, expiré ou déjà utilisé.',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: { patientId: result.patientId },
        message: 'Accès validé. Vous pouvez consulter le dossier du patient.',
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/ephemeral/validate-qr — Médecin valide via QR code token
ephemeralRoutes.post(
  '/validate-qr',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { qrCodeToken } = req.body;

      if (!qrCodeToken) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'Token QR code requis.',
          },
        });
        return;
      }

      const result = await ephemeralService.validateEphemeralAccessByQR(
        qrCodeToken,
        req.user!.sub
      );

      if (!result) {
        res.status(404).json({
          success: false,
          error: {
            code: 'INVALID_QR_TOKEN',
            message: 'QR code invalide, expiré ou déjà utilisé.',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: { patientId: result.patientId },
        message: 'Accès QR validé.',
      });
    } catch (error) {
      next(error);
    }
  }
);
