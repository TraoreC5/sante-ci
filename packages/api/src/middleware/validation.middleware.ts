/**
 * Middleware de validation Zod
 * 
 * Valide req.body, req.query ou req.params contre un schéma Zod.
 * Retourne 400 avec les détails d'erreur formatés si la validation échoue.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Crée un middleware de validation pour une cible donnée.
 * 
 * Utilisation:
 *   router.post('/register', validate(registerPatientSchema), handler)
 *   router.get('/search', validate(searchSchema, 'query'), handler)
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const formattedErrors = formatZodErrors(result.error);
      
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Données invalides',
          details: formattedErrors,
        },
      });
      return;
    }

    // Remplacer les données par les données validées (avec coercion Zod)
    req[target] = result.data;
    next();
  };
}

/**
 * Formate les erreurs Zod en un objet { champ: [messages] }
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}
