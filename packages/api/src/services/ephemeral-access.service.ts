/**
 * Service de gestion des accès éphémères
 * Permet aux patients de générer un code PIN ou QR code temporaire
 * pour autoriser un médecin à consulter leur dossier.
 */

import { randomBytes, randomInt } from 'crypto';
import { prisma } from '@sante-ci/database';

// Durée de validité d'un accès éphémère: 2 heures
const EPHEMERAL_ACCESS_DURATION_MS = 2 * 60 * 60 * 1000;

export interface EphemeralAccessResult {
  id: string;
  codePinEphemere: string;
  qrCodeToken: string;
  expiresAt: Date;
}

/**
 * Génère un accès éphémère pour un patient.
 * Crée un code PIN à 6 chiffres et un token QR unique, valides pendant 2 heures.
 */
export async function generateEphemeralAccess(patientId: string): Promise<EphemeralAccessResult> {
  // Generate a cryptographically secure 6-digit PIN
  const codePinEphemere = String(randomInt(100000, 999999));
  
  // Generate a unique token for QR code (32 bytes hex = 64 chars)
  const qrCodeToken = randomBytes(32).toString('hex');
  
  // Calculate expiration (2 hours from now)
  const expiresAt = new Date(Date.now() + EPHEMERAL_ACCESS_DURATION_MS);
  
  // Invalidate any previous active shares for this patient
  await prisma.partageEphemere.updateMany({
    where: {
      patientId,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    data: { isUsed: true },
  });
  
  // Create the new ephemeral access
  const partage = await prisma.partageEphemere.create({
    data: {
      patientId,
      codePinEphemere,
      qrCodeToken,
      expiresAt,
    },
  });
  
  return {
    id: partage.id,
    codePinEphemere,
    qrCodeToken,
    expiresAt,
  };
}

/**
 * Valide un accès éphémère via code PIN.
 * Vérifie que le code est valide, non expiré et non utilisé.
 * Lie le médecin à l'accès et le marque comme utilisé.
 */
export async function validateEphemeralAccess(
  codePinEphemere: string,
  medecinId: string
): Promise<{ patientId: string } | null> {
  const partage = await prisma.partageEphemere.findFirst({
    where: {
      codePinEphemere,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
  });
  
  if (!partage) return null;
  
  // Mark as used and bind the doctor
  await prisma.partageEphemere.update({
    where: { id: partage.id },
    data: {
      isUsed: true,
      medecinId,
    },
  });
  
  return { patientId: partage.patientId };
}

/**
 * Valide un accès éphémère via token QR code.
 */
export async function validateEphemeralAccessByQR(
  qrCodeToken: string,
  medecinId: string
): Promise<{ patientId: string } | null> {
  const partage = await prisma.partageEphemere.findUnique({
    where: { qrCodeToken },
  });
  
  if (!partage || partage.isUsed || partage.expiresAt < new Date()) {
    return null;
  }
  
  await prisma.partageEphemere.update({
    where: { id: partage.id },
    data: {
      isUsed: true,
      medecinId,
    },
  });
  
  return { patientId: partage.patientId };
}

/**
 * Nettoie les accès éphémères expirés (à exécuter via cron job).
 */
export async function cleanupExpiredAccess(): Promise<number> {
  const result = await prisma.partageEphemere.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  return result.count;
}
