/**
 * Routes webhooks — /api/v1/webhooks
 * 
 * POST /mock-payment — Webhook simulé de paiement Mobile Money
 * 
 * Simule le flux asynchrone réel des paiements Orange Money / Djamo :
 * 1. Le patient crée un RDV → statutPaiement = 'EN_ATTENTE'
 * 2. Le patient initie le paiement via l'app mobile → redirection vers opérateur
 * 3. L'opérateur traite le paiement et envoie un webhook → statutPaiement = 'PAYE_MOBILE_MONEY'
 * 
 * En Phase 2 (sandbox), cet endpoint est appelé manuellement ou par le client mobile
 * pour simuler la confirmation de paiement.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@sante-ci/database';
import { mockPaymentWebhookSchema } from '@sante-ci/shared';
import { validate } from '../middleware/validation.middleware';
import { AppError } from '../middleware/error.middleware';

export const webhookRoutes = Router();

// POST /api/v1/webhooks/mock-payment
webhookRoutes.post(
  '/mock-payment',
  validate(mockPaymentWebhookSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rendezVousId, transactionId, status } = req.body;

      // Trouver le rendez-vous
      const appointment = await prisma.rendezVous.findUnique({
        where: { id: rendezVousId },
      });

      if (!appointment) {
        throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Rendez-vous non trouvé.');
      }

      if (appointment.statutPaiement !== 'EN_ATTENTE') {
        throw new AppError(
          400,
          'PAYMENT_ALREADY_PROCESSED',
          `Le paiement a déjà été traité (statut: ${appointment.statutPaiement}).`
        );
      }

      if (status === 'SUCCESS') {
        // Paiement réussi — mettre à jour le statut
        const updated = await prisma.rendezVous.update({
          where: { id: rendezVousId },
          data: {
            statutPaiement: 'PAYE_MOBILE_MONEY',
            transactionId,
          },
        });

        console.log(
          `✅ [WEBHOOK] Paiement confirmé pour RDV ${rendezVousId} — Transaction: ${transactionId}`
        );

        res.json({
          success: true,
          data: {
            rendezVousId: updated.id,
            statutPaiement: updated.statutPaiement,
            transactionId: updated.transactionId,
          },
          message: 'Paiement confirmé avec succès.',
        });
      } else {
        // Paiement échoué — le statut reste EN_ATTENTE
        console.log(
          `❌ [WEBHOOK] Paiement échoué pour RDV ${rendezVousId} — Transaction: ${transactionId}`
        );

        res.json({
          success: true,
          data: {
            rendezVousId: appointment.id,
            statutPaiement: appointment.statutPaiement,
            transactionId: null,
          },
          message: 'Le paiement a échoué. Le patient peut réessayer.',
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/webhooks/payment-status/:rendezVousId — Vérifier le statut du paiement
webhookRoutes.get(
  '/payment-status/:rendezVousId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appointment = await prisma.rendezVous.findUnique({
        where: { id: req.params.rendezVousId },
        select: {
          id: true,
          statutPaiement: true,
          transactionId: true,
        },
      });

      if (!appointment) {
        throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Rendez-vous non trouvé.');
      }

      res.json({
        success: true,
        data: {
          rendezVousId: appointment.id,
          statutPaiement: appointment.statutPaiement,
          transactionId: appointment.transactionId,
          isPaid: appointment.statutPaiement === 'PAYE_MOBILE_MONEY',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);
