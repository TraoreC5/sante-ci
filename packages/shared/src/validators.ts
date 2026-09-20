import { z } from 'zod';

// === AUTH ===

export const loginSchema = z.object({
  email: z.string().email({ message: 'Email invalide' }),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' }),
});

export const registerPatientSchema = z.object({
  nom: z.string().min(2, { message: 'Nom trop court' }).max(100),
  prenom: z.string().min(2, { message: 'Prénom trop court' }).max(100),
  email: z.string().email({ message: 'Email invalide' }),
  telephone: z
    .string()
    .min(8, { message: 'Numéro de téléphone invalide' })
    .regex(/^\+?225?\d{8,10}$/, { message: 'Format de téléphone ivoirien invalide (ex: +2250101020304)' }),
  password: z
    .string()
    .min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
    .max(128),
  confirmPassword: z.string(),
  numeroCmu: z.string().optional(),
  dateNaissance: z.string().datetime().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export const createPatientSchema = z.object({
  nom: z.string().min(2, { message: 'Nom trop court' }),
  prenom: z.string().min(2, { message: 'Prénom trop court' }),
  email: z.string().email({ message: 'Email invalide' }),
  telephone: z.string().min(8, { message: 'Numéro de téléphone invalide' }),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' }),
  numeroCmu: z.string().optional(),
});

export const updateProfileSchema = z.object({
  nom: z.string().min(2).max(100).optional(),
  prenom: z.string().min(2).max(100).optional(),
  telephone: z.string().min(8).optional(),
  numeroCmu: z.string().optional(),
  dateNaissance: z.string().datetime().optional(),
  iceGroupeSanguin: z.string().max(10).optional(),
  iceAllergies: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, { message: 'Mot de passe actuel requis' }),
  newPassword: z.string().min(6, { message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' }),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Les nouveaux mots de passe ne correspondent pas',
  path: ['confirmNewPassword'],
});

// === PIN ===

export const setupPinSchema = z.object({
  pin: z.string().regex(/^\d{4}$|^\d{6}$/, { message: 'Le PIN doit contenir 4 ou 6 chiffres' }),
  confirmPin: z.string(),
}).refine((data) => data.pin === data.confirmPin, {
  message: 'Les codes PIN ne correspondent pas',
  path: ['confirmPin'],
});

export const verifyPinSchema = z.object({
  pin: z.string().regex(/^\d{4}$|^\d{6}$/, { message: 'Le PIN doit contenir 4 ou 6 chiffres' }),
});

export const pinSchema = z.object({
  pin: z.string().regex(/^\d{4}|\d{6}$/, { message: 'Le PIN doit contenir 4 ou 6 chiffres' }),
});

// === RENDEZ-VOUS ===

export const createRendezVousSchema = z.object({
  medecinId: z.string().uuid({ message: 'ID du médecin invalide' }),
  dateHeure: z.string().datetime({ message: 'Date et heure invalides' }),
  motif: z.string().min(3, { message: 'Motif trop court' }).max(500),
});

export const createAppointmentSchema = z.object({
  cliniqueId: z.string().uuid({ message: 'ID de la clinique invalide' }),
  medecinId: z.string().uuid({ message: 'ID du médecin invalide' }),
  dateHeure: z.string().datetime({ message: 'Date et heure invalides' }),
  motif: z.string().min(3, { message: 'Motif trop court' }).max(500),
});

// === ACCÈS ÉPHÉMÈRE ===

export const ephemeralAccessSchema = z.object({
  codePinEphemere: z.string().regex(/^\d{4,6}$/, { message: 'Le code PIN doit contenir entre 4 et 6 chiffres' }),
});

// === DOCUMENTS ===

export const uploadDocumentSchema = z.object({
  titre: z.string().min(3, { message: 'Titre trop court' }).max(300),
  type: z.enum(['ORDONNANCE', 'RESULTAT_EXAMEN', 'SCAN_PERSONNEL'], {
    errorMap: () => ({ message: 'Type de document invalide' }),
  }),
});

// === PROFILS FAMILIAUX ===

export const addFamilyMemberSchema = z.object({
  nom: z.string().min(2, { message: 'Nom trop court' }).max(100),
  prenom: z.string().min(2, { message: 'Prénom trop court' }).max(100),
  email: z.string().email({ message: 'Email invalide' }),
  telephone: z.string().min(8, { message: 'Numéro de téléphone invalide' }),
  dateNaissance: z.string().datetime().optional(),
});

// === PROFIL ICE ===

export const updateEmergencyProfileSchema = z.object({
  iceGroupeSanguin: z.string().max(10).optional(),
  iceAllergies: z.string().optional(),
});

// === WEBHOOK PAIEMENT ===

export const mockPaymentWebhookSchema = z.object({
  rendezVousId: z.string().uuid({ message: 'ID du rendez-vous invalide' }),
  transactionId: z.string().min(1, { message: 'ID de transaction requis' }),
  status: z.enum(['SUCCESS', 'FAILED'], {
    errorMap: () => ({ message: 'Statut de paiement invalide' }),
  }),
});
