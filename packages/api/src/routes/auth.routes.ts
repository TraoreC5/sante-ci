/**
 * Routes d'authentification — /api/v1/auth
 * 
 * POST /register   — Inscription patient
 * POST /login      — Connexion
 * POST /pin/setup  — Configuration PIN
 * POST /pin/verify — Vérification PIN
 * POST /refresh    — Rafraîchissement token
 * POST /logout     — Déconnexion
 * POST /change-password — Changement de mot de passe
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  loginSchema,
  registerPatientSchema,
  setupPinSchema,
  verifyPinSchema,
  changePasswordSchema,
} from '@sante-ci/shared';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import * as authService from '../services/auth.service';

export const authRoutes = Router();

// POST /api/v1/auth/register
authRoutes.post(
  '/register',
  validate(registerPatientSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { confirmPassword, ...data } = req.body;
      const result = await authService.registerPatient(data);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/auth/login
authRoutes.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await authService.loginPatient(email, password);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/auth/pin/setup — nécessite authentification
authRoutes.post(
  '/pin/setup',
  authenticate,
  validate(setupPinSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.setupPin(req.user!.sub, req.body.pin);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/auth/pin/verify — nécessite authentification
authRoutes.post(
  '/pin/verify',
  authenticate,
  validate(verifyPinSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.verifyPin(req.user!.sub, req.body.pin);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/auth/refresh
authRoutes.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_TOKEN', message: 'Refresh token requis.' },
        });
        return;
      }
      const result = await authService.refreshAccessToken(refreshToken);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/auth/logout
authRoutes.post(
  '/logout',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      res.json({ success: true, data: { message: 'Déconnexion réussie.' } });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/auth/change-password — nécessite authentification
authRoutes.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user!.sub, currentPassword, newPassword);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);
