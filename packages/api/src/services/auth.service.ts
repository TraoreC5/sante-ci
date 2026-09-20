/**
 * Service d'authentification — Santé CI
 * 
 * Gère l'inscription, la connexion, les tokens JWT (access + refresh),
 * le setup/vérification du PIN, et la déconnexion.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { prisma } from '@sante-ci/database';
import { AuthTokenPayload, PatientProfile } from '@sante-ci/shared';
import { AppError } from '../middleware/error.middleware';

// === CONFIGURATION ===

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production-sante-ci-2024';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
const BCRYPT_ROUNDS = 10;

// === HELPERS ===

/**
 * Génère un access token JWT
 */
function generateAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });
}

/**
 * Génère un refresh token opaque (stocké en base)
 */
function generateRefreshTokenValue(): string {
  return randomBytes(40).toString('hex');
}

/**
 * Projette un patient Prisma vers un PatientProfile (sans données sensibles)
 */
function toPatientProfile(patient: {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  numeroCmu: string | null;
  dateNaissance: Date | null;
  iceGroupeSanguin: string | null;
  iceAllergies: string | null;
  isBiometricEnabled: boolean;
  pinHash: string | null;
  createdAt: Date;
}): PatientProfile {
  return {
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
  };
}

// === SERVICES ===

/**
 * Inscription d'un nouveau patient
 */
export async function registerPatient(data: {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  password: string;
  numeroCmu?: string;
  dateNaissance?: string;
}) {
  // Vérifier si l'email existe déjà
  const existingEmail = await prisma.patient.findUnique({ where: { email: data.email } });
  if (existingEmail) {
    throw new AppError(409, 'EMAIL_EXISTS', 'Cet email est déjà utilisé.');
  }

  // Vérifier si le téléphone existe déjà
  const existingPhone = await prisma.patient.findUnique({ where: { telephone: data.telephone } });
  if (existingPhone) {
    throw new AppError(409, 'PHONE_EXISTS', 'Ce numéro de téléphone est déjà utilisé.');
  }

  // Hash du mot de passe
  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  // Création du patient
  const patient = await prisma.patient.create({
    data: {
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone,
      passwordHash,
      numeroCmu: data.numeroCmu || null,
      dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : null,
    },
  });

  // Générer les tokens
  const tokenPayload: AuthTokenPayload = {
    sub: patient.id,
    email: patient.email,
    role: 'PATIENT',
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshTokenValue = generateRefreshTokenValue();

  // Stocker le refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshTokenValue,
      patientId: patient.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
    },
  });

  return {
    accessToken,
    refreshToken: refreshTokenValue,
    user: toPatientProfile(patient),
  };
}

/**
 * Connexion d'un patient
 */
export async function loginPatient(email: string, password: string) {
  // Rechercher le patient
  const patient = await prisma.patient.findUnique({ where: { email } });
  if (!patient) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email ou mot de passe incorrect.');
  }

  // Vérifier le mot de passe
  const isPasswordValid = await bcrypt.compare(password, patient.passwordHash);
  if (!isPasswordValid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email ou mot de passe incorrect.');
  }

  // Générer les tokens
  const tokenPayload: AuthTokenPayload = {
    sub: patient.id,
    email: patient.email,
    role: 'PATIENT',
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshTokenValue = generateRefreshTokenValue();

  // Stocker le refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshTokenValue,
      patientId: patient.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken,
    refreshToken: refreshTokenValue,
    user: toPatientProfile(patient),
  };
}

/**
 * Configuration du code PIN
 */
export async function setupPin(patientId: string, pin: string) {
  const pinHash = await bcrypt.hash(pin, BCRYPT_ROUNDS);

  await prisma.patient.update({
    where: { id: patientId },
    data: { pinHash },
  });

  return { success: true, message: 'Code PIN configuré avec succès.' };
}

/**
 * Vérification du code PIN (unlock rapide)
 */
export async function verifyPin(patientId: string, pin: string) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { pinHash: true },
  });

  if (!patient?.pinHash) {
    throw new AppError(400, 'PIN_NOT_SET', 'Aucun code PIN configuré.');
  }

  const isPinValid = await bcrypt.compare(pin, patient.pinHash);
  if (!isPinValid) {
    throw new AppError(401, 'INVALID_PIN', 'Code PIN incorrect.');
  }

  return { success: true, message: 'Code PIN vérifié.' };
}

/**
 * Rafraîchissement du token d'accès via refresh token
 * Implémente la rotation des refresh tokens (le vieux est révoqué)
 */
export async function refreshAccessToken(refreshTokenValue: string) {
  // Trouver le refresh token en base
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshTokenValue },
    include: { patient: true },
  });

  if (!storedToken) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token invalide.');
  }

  if (storedToken.revoked) {
    // Token déjà utilisé — potentielle attaque par rejeu
    // Révoquer tous les tokens du patient par sécurité
    await prisma.refreshToken.updateMany({
      where: { patientId: storedToken.patientId },
      data: { revoked: true },
    });
    throw new AppError(401, 'TOKEN_REUSE_DETECTED', 'Activité suspecte détectée. Veuillez vous reconnecter.');
  }

  if (storedToken.expiresAt < new Date()) {
    throw new AppError(401, 'REFRESH_TOKEN_EXPIRED', 'Session expirée. Veuillez vous reconnecter.');
  }

  // Révoquer l'ancien refresh token
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked: true },
  });

  // Générer de nouveaux tokens
  const tokenPayload: AuthTokenPayload = {
    sub: storedToken.patient.id,
    email: storedToken.patient.email,
    role: 'PATIENT',
  };

  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshTokenValue = generateRefreshTokenValue();

  await prisma.refreshToken.create({
    data: {
      token: newRefreshTokenValue,
      patientId: storedToken.patientId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshTokenValue,
  };
}

/**
 * Déconnexion — révoquer le refresh token
 */
export async function logout(refreshTokenValue: string) {
  await prisma.refreshToken.updateMany({
    where: { token: refreshTokenValue },
    data: { revoked: true },
  });

  return { success: true, message: 'Déconnexion réussie.' };
}

/**
 * Déconnexion de toutes les sessions (révoquer tous les refresh tokens)
 */
export async function logoutAll(patientId: string) {
  await prisma.refreshToken.updateMany({
    where: { patientId, revoked: false },
    data: { revoked: true },
  });

  return { success: true, message: 'Toutes les sessions ont été fermées.' };
}

/**
 * Changement de mot de passe
 */
export async function changePassword(
  patientId: string,
  currentPassword: string,
  newPassword: string
) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { passwordHash: true },
  });

  if (!patient) {
    throw new AppError(404, 'PATIENT_NOT_FOUND', 'Patient non trouvé.');
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, patient.passwordHash);
  if (!isCurrentValid) {
    throw new AppError(401, 'INVALID_PASSWORD', 'Mot de passe actuel incorrect.');
  }

  const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.patient.update({
    where: { id: patientId },
    data: { passwordHash: newPasswordHash },
  });

  // Révoquer tous les refresh tokens (forcer la reconnexion)
  await prisma.refreshToken.updateMany({
    where: { patientId, revoked: false },
    data: { revoked: true },
  });

  return { success: true, message: 'Mot de passe modifié avec succès. Veuillez vous reconnecter.' };
}
