import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('Début du seed...');

  // Hash pour les mots de passe et les codes PIN
  const passwordHash = await bcrypt.hash('password123', 10);
  const pinHash = await bcrypt.hash('1234', 10);

  // 1. Création des Cliniques
  const clinique1 = await prisma.clinique.create({
    data: {
      id: uuidv4(),
      nom: 'Clinique Sainte Félicité',
      adresse: 'Cocody Danga',
      ville: 'Abidjan',
      telephoneContact: '+2250102030405',
      adminUserId: uuidv4(),
    },
  });

  const clinique2 = await prisma.clinique.create({
    data: {
      id: uuidv4(),
      nom: 'Centre Médical Les Palmiers',
      adresse: 'Zone 4',
      ville: 'Abidjan',
      telephoneContact: '+2250506070809',
      adminUserId: uuidv4(),
    },
  });

  // 2. Création des Médecins
  const medecin1 = await prisma.medecin.create({
    data: {
      id: uuidv4(),
      nom: 'Bamba',
      prenom: 'Moussa',
      specialite: 'Cardiologie',
      numeroOrdre: 'MED-1001',
      cliniqueId: clinique1.id,
      email: 'm.bamba@sainte-felicite.ci',
      passwordHash,
    },
  });

  const medecin2 = await prisma.medecin.create({
    data: {
      id: uuidv4(),
      nom: 'Yao',
      prenom: 'Akissi',
      specialite: 'Pédiatrie',
      numeroOrdre: 'MED-1002',
      cliniqueId: clinique1.id,
      email: 'a.yao@sainte-felicite.ci',
      passwordHash,
    },
  });

  const medecin3 = await prisma.medecin.create({
    data: {
      id: uuidv4(),
      nom: 'Diallo',
      prenom: 'Amadou',
      specialite: 'Médecine Générale',
      numeroOrdre: 'MED-1003',
      cliniqueId: clinique2.id,
      email: 'a.diallo@les-palmiers.ci',
      passwordHash,
    },
  });

  const medecin4 = await prisma.medecin.create({
    data: {
      id: uuidv4(),
      nom: 'Touré',
      prenom: 'Fatou',
      specialite: 'Gynécologie',
      numeroOrdre: 'MED-1004',
      cliniqueId: clinique2.id,
      email: 'f.toure@les-palmiers.ci',
      passwordHash,
    },
  });

  // 3. Création des Patients
  const patient1 = await prisma.patient.create({
    data: {
      id: uuidv4(),
      nom: 'Kouadio',
      prenom: 'Koffi',
      email: 'koffi.kouadio@email.ci',
      telephone: '+2250707070707',
      passwordHash,
      pinHash,
      isBiometricEnabled: true,
      numeroCmu: 'CMU-123456',
      iceGroupeSanguin: 'O+',
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      id: uuidv4(),
      nom: 'Traoré',
      prenom: 'Awa',
      email: 'awa.traore@email.ci',
      telephone: '+2250808080808',
      passwordHash,
      pinHash,
      isBiometricEnabled: false,
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      id: uuidv4(),
      nom: 'Koné',
      prenom: 'Seydou',
      email: 'seydou.kone@email.ci',
      telephone: '+2250909090909',
      passwordHash,
      pinHash,
      isBiometricEnabled: true,
    },
  });

  // Patient Enfant
  await prisma.patient.create({
    data: {
      id: uuidv4(),
      nom: 'Kouadio',
      prenom: 'Aya',
      email: 'aya.kouadio@email.ci',
      telephone: '+2250101010101',
      passwordHash,
      parentId: patient1.id,
    },
  });

  // 4. Création des Documents
  await prisma.documentMedical.create({
    data: {
      id: uuidv4(),
      patientId: patient1.id,
      medecinId: medecin1.id,
      type: 'ORDONNANCE',
      titre: 'Ordonnance - Traitement Hypertension',
      encryptedFileUrl: 'enc://docs/12345',
    },
  });

  // 5. Création d'un Rendez-vous
  await prisma.rendezVous.create({
    data: {
      id: uuidv4(),
      patientId: patient1.id,
      medecinId: medecin1.id,
      dateHeure: new Date(Date.now() + 86400000), // Demain
      motif: 'Contrôle annuel',
      statut: 'PLANIFIE',
      statutPaiement: 'EN_ATTENTE',
    },
  });

  // 6. Création d'un Partage Éphémère
  await prisma.partageEphemere.create({
    data: {
      id: uuidv4(),
      patientId: patient1.id,
      codePinEphemere: '123456',
      qrCodeToken: uuidv4(),
      expiresAt: new Date(Date.now() + 7200000), // Expire dans 2 heures
    },
  });

  console.log('Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('Erreur pendant le seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
