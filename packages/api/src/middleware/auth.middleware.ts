/**
 * Middleware d'authentification JWT
 * 
 * - Extrait le Bearer token du header Authorization
 * - Vérifie et décode le JWT
 * - Injecte les données utilisateur dans req.user
 * - Middleware de vérification de rôle
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload } from '@sante-ci/shared';
import { AppError } from './error.middleware';

// Étendre le type Express Request pour inclure l'utilisateur authentifié
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production-sante-ci-2024';

/**
 * Middleware d'authentification — vérifie le JWT et injecte req.user
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Token d\'authentification manquant'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError(401, 'TOKEN_EXPIRED', 'Token expiré. Veuillez vous reconnecter.'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError(401, 'INVALID_TOKEN', 'Token invalide.'));
    }
    return next(new AppError(401, 'AUTH_ERROR', 'Erreur d\'authentification.'));
  }
}

/**
 * Middleware de vérification de rôle
 * Utilisation: authorize('PATIENT', 'MEDECIN')
 */
export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Non authentifié.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'Vous n\'avez pas les permissions nécessaires.'));
    }

    next();
  };
}

/**
 * Middleware optionnel — extrait l'utilisateur s'il est présent, mais ne bloque pas
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
      req.user = decoded;
    } catch {
      // Token invalide ou expiré — on continue sans user
    }
  }

  next();
}
