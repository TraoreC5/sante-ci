/**
 * Routes documents — /api/v1/documents
 * 
 * GET    /         — Liste des documents (filtrable par type, paginée)
 * GET    /:id      — Détail d'un document
 * POST   /         — Upload d'un document (scan personnel)
 * DELETE /:id      — Supprimer un document personnel
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@sante-ci/database';
import { uploadDocumentSchema } from '@sante-ci/shared';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { interpretDocument } from '../services/ai.service';

export const documentRoutes = Router();

// Toutes les routes documents nécessitent une authentification
documentRoutes.use(authenticate);

// GET /api/v1/documents?type=ORDONNANCE&page=1&limit=10
documentRoutes.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
      const type = req.query.type as string | undefined;

      const where: Record<string, unknown> = { patientId: req.user!.sub };
      if (type && ['ORDONNANCE', 'RESULTAT_EXAMEN', 'SCAN_PERSONNEL'].includes(type)) {
        where.type = type;
      }

      const [documents, total] = await Promise.all([
        prisma.documentMedical.findMany({
          where,
          include: {
            medecin: {
              select: { id: true, nom: true, prenom: true, specialite: true },
            },
          },
          orderBy: { uploadDate: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.documentMedical.count({ where }),
      ]);

      res.json({
        success: true,
        data: documents.map((doc) => ({
          id: doc.id,
          type: doc.type,
          titre: doc.titre,
          uploadDate: doc.uploadDate.toISOString(),
          medecin: doc.medecin
            ? {
                id: doc.medecin.id,
                nom: doc.medecin.nom,
                prenom: doc.medecin.prenom,
                specialite: doc.medecin.specialite,
              }
            : null,
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

// GET /api/v1/documents/:id
documentRoutes.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const document = await prisma.documentMedical.findFirst({
        where: {
          id: req.params.id,
          patientId: req.user!.sub,
        },
        include: {
          medecin: {
            select: { id: true, nom: true, prenom: true, specialite: true },
          },
        },
      });

      if (!document) {
        throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document non trouvé.');
      }

      res.json({
        success: true,
        data: {
          id: document.id,
          type: document.type,
          titre: document.titre,
          encryptedFileUrl: document.encryptedFileUrl,
          uploadDate: document.uploadDate.toISOString(),
          medecin: document.medecin
            ? {
                id: document.medecin.id,
                nom: document.medecin.nom,
                prenom: document.medecin.prenom,
                specialite: document.medecin.specialite,
              }
            : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/documents
documentRoutes.post(
  '/',
  validate(uploadDocumentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // En Phase 2, on stocke une URL placeholder pour le fichier chiffré
      // L'upload réel de fichiers sera implémenté avec un service de stockage
      const document = await prisma.documentMedical.create({
        data: {
          patientId: req.user!.sub,
          type: req.body.type,
          titre: req.body.titre,
          encryptedFileUrl: `enc://patient/${req.user!.sub}/doc-${Date.now()}`,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: document.id,
          type: document.type,
          titre: document.titre,
          uploadDate: document.uploadDate.toISOString(),
        },
        message: 'Document ajouté avec succès.',
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/documents/:id
documentRoutes.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Vérifier que le document appartient au patient et est un SCAN_PERSONNEL
      const document = await prisma.documentMedical.findFirst({
        where: {
          id: req.params.id,
          patientId: req.user!.sub,
        },
      });

      if (!document) {
        throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document non trouvé.');
      }

      if (document.type !== 'SCAN_PERSONNEL') {
        throw new AppError(
          403,
          'CANNOT_DELETE',
          'Seuls les documents personnels (scans) peuvent être supprimés.'
        );
      }

      await prisma.documentMedical.delete({ where: { id: req.params.id } });

      res.json({
        success: true,
        data: { id: req.params.id },
        message: 'Document supprimé.',
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/documents/:id/interpret
// Interprète un document médical via l'IA (Gemini)
// Nécessite le consentement explicite de l'utilisateur (géré côté mobile)
documentRoutes.post(
  '/:id/interpret',
  async (req: Request, res: Response, next: NextFunction) => {
    // Timeout de 30 secondes pour l'appel IA
    const TIMEOUT_MS = 30_000;
    const timeoutId = setTimeout(() => {
      next(new AppError(504, 'AI_TIMEOUT', 'Le service d\'interprétation IA a mis trop de temps à répondre. Veuillez réessayer.'));
    }, TIMEOUT_MS);

    try {
      // 1. Vérifier que le document appartient au patient authentifié
      const document = await prisma.documentMedical.findFirst({
        where: {
          id: req.params.id,
          patientId: req.user!.sub,
        },
        include: {
          medecin: {
            select: { nom: true, prenom: true, specialite: true },
          },
        },
      });

      if (!document) {
        clearTimeout(timeoutId);
        throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document non trouvé.');
      }

      // 2. Log d'audit (RGPD / conformité légale)
      console.log(`[AI-Audit] Patient ${req.user!.sub} demande interprétation doc ${document.id} (${document.type}) à ${new Date().toISOString()}`);

      // 3. Appel au service IA avec le texte brut optionnel du body
      const rawText = req.body?.rawText as string | undefined;
      const interpretation = await interpretDocument(document.type, document.titre, rawText);

      clearTimeout(timeoutId);

      res.json({
        success: true,
        data: {
          documentId: document.id,
          documentTitre: document.titre,
          documentType: document.type,
          medecin: document.medecin
            ? `${document.medecin.prenom} ${document.medecin.nom}${document.medecin.specialite ? ` — ${document.medecin.specialite}` : ''}`
            : null,
          interpretation,
        },
      });

    } catch (error) {
      clearTimeout(timeoutId);
      next(error);
    }
  }
);
