/**
 * Middleware de gestion d'erreurs centralisé
 * 
 * - Classe AppError pour les erreurs applicatives
 * - Gestionnaire d'erreurs Express (4 args)
 * - Handler 404 pour les routes non trouvées
 * - Logging structuré des erreurs
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Erreur applicative avec code HTTP et code d'erreur machine-readable.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Preserve correct prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Gestionnaire d'erreurs centralisé Express.
 * Doit avoir 4 paramètres pour qu'Express le reconnaisse comme error handler.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Logging structuré
  const timestamp = new Date().toISOString();
  
  if (err instanceof AppError) {
    // Erreur applicative connue
    console.error(`[${timestamp}] ❌ ${err.code} (${err.statusCode}): ${err.message}`);
    
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
    return;
  }

  // Erreur inattendue — ne pas exposer les détails en production
  console.error(`[${timestamp}] 💥 UNHANDLED ERROR:`, err);

  const isProduction = process.env.NODE_ENV === 'production';

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction
        ? 'Une erreur interne est survenue. Veuillez réessayer.'
        : err.message,
      ...(! isProduction && { stack: err.stack }),
    },
  });
}

/**
 * Handler pour les routes non trouvées (404).
 * À placer après toutes les routes.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.path} non trouvée`));
}
