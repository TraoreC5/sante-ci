import { DocumentType, StatutPaiement, StatutRendezVous } from '../enums';

// === ENTITÉS DE BASE ===

export interface Patient {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  passwordHash: string;
  pinHash?: string | null;
  isBiometricEnabled: boolean;
  numeroCmu?: string | null;
  dateNaissance?: Date | null;
  iceGroupeSanguin?: string | null;
  iceAllergies?: string | null;
  pushToken?: string | null;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Clinique {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  telephoneContact: string;
  adminUserId: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Medecin {
  id: string;
  nom: string;
  prenom: string;
  specialite: string;
  numeroOrdre: string;
  cliniqueId: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface DocumentMedical {
  id: string;
  patientId: string;
  medecinId?: string | null;
  type: DocumentType;
  titre: string;
  encryptedFileUrl: string;
  uploadDate: Date;
}

export interface PartageEphemere {
  id: string;
  patientId: string;
  medecinId?: string | null;
  codePinEphemere: string;
  qrCodeToken: string;
  expiresAt: Date;
  isUsed: boolean;
}

export interface RendezVous {
  id: string;
  patientId: string;
  medecinId: string;
  dateHeure: Date;
  motif: string;
  statut: StatutRendezVous;
  statutPaiement: StatutPaiement;
  transactionId?: string | null;
}

export interface RefreshToken {
  id: string;
  token: string;
  patientId: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
}

// === VUES / PROJECTIONS (sans données sensibles) ===

export interface PatientProfile {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  numeroCmu?: string | null;
  dateNaissance?: string | null;
  iceGroupeSanguin?: string | null;
  iceAllergies?: string | null;
  isBiometricEnabled: boolean;
  hasPinSetup: boolean;
  createdAt: string;
}

export interface MedecinPublic {
  id: string;
  nom: string;
  prenom: string;
  specialite: string;
  clinique: CliniquePublic;
}

export interface CliniquePublic {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  telephoneContact: string;
}

export interface AppointmentDetail {
  id: string;
  dateHeure: string;
  motif: string;
  statut: StatutRendezVous;
  statutPaiement: StatutPaiement;
  transactionId?: string | null;
  medecin: MedecinPublic;
}

export interface DocumentWithMeta {
  id: string;
  type: DocumentType;
  titre: string;
  uploadDate: string;
  medecin?: {
    id: string;
    nom: string;
    prenom: string;
    specialite: string;
  } | null;
}

export interface FamilyMember {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateNaissance?: string | null;
}

// === AUTH ===

export interface AuthTokenPayload {
  sub: string;        // Patient ID
  email: string;
  role: 'PATIENT' | 'MEDECIN' | 'ADMIN_CLINIQUE' | 'SUPER_ADMIN';
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: PatientProfile;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  password: string;
  numeroCmu?: string;
  dateNaissance?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// === REQUESTS ===

export interface CreatePatientRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  password?: string;
  numeroCmu?: string;
}

export interface CreateRendezVousRequest {
  cliniqueId?: string;
  medecinId: string;
  dateHeure: string;
  motif: string;
}

export interface GenerateEphemeralAccessResponse {
  id: string;
  codePinEphemere: string;
  qrCodeToken: string;
  expiresAt: string;
}

export interface ValidateEphemeralAccessRequest {
  codePinEphemere: string;
}

// === RESPONSES GÉNÉRIQUES ===

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// === WEBHOOK PAIEMENT ===

export interface MockPaymentWebhook {
  rendezVousId: string;
  transactionId: string;
  status: 'SUCCESS' | 'FAILED';
}
