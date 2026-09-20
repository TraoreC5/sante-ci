// Types d'énumération partagés pour l'application Santé CI

export enum DocumentType {
  ORDONNANCE = 'ORDONNANCE',
  RESULTAT_EXAMEN = 'RESULTAT_EXAMEN',
  SCAN_PERSONNEL = 'SCAN_PERSONNEL',
}

export enum StatutRendezVous {
  PLANIFIE = 'PLANIFIE',
  ANNULE = 'ANNULE',
  TERMINE = 'TERMINE',
}

export enum StatutPaiement {
  EN_ATTENTE = 'EN_ATTENTE',
  PAYE_MOBILE_MONEY = 'PAYE_MOBILE_MONEY',
  GRATUIT = 'GRATUIT',
}

export enum UserRole {
  PATIENT = 'PATIENT',
  MEDECIN = 'MEDECIN',
  ADMIN_CLINIQUE = 'ADMIN_CLINIQUE',
  SUPER_ADMIN = 'SUPER_ADMIN',
}
