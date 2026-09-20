export const mockUser = {
  id: 'usr-001',
  prenom: 'Amadou',
  nom: 'Koné',
  iceGroupeSanguin: 'O+',
  iceAllergies: ['Pénicilline', 'Arachides'],
  numeroCmu: 'CMU-2024-ABJ-00342',
  notificationsCount: 3,
};

export const mockAppointments = [
  {
    id: 'rdv-001',
    medecinNom: 'Dr. Yao Kouamé',
    specialite: 'Cardiologie',
    clinique: 'Clinique Sainte Félicité',
    dateHeure: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
    motif: 'Contrôle tension artérielle',
    statut: 'PLANIFIE',
  },
  {
    id: 'rdv-002',
    medecinNom: 'Dr. Awa Traoré',
    specialite: 'Médecine Générale',
    clinique: 'Centre Médical Les Palmiers',
    dateHeure: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // In 7 days
    motif: 'Bilan de santé annuel',
    statut: 'PLANIFIE',
  },
];

export const mockAnalysisResults = [
  {
    id: 'doc-001',
    titre: 'Bilan sanguin complet',
    medecinNom: 'Dr. Yao Kouamé',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
    type: 'RESULTAT_EXAMEN',
    isNew: true,
    icon: 'water',
  },
  {
    id: 'doc-002',
    titre: 'Radiographie thoracique',
    medecinNom: 'Dr. Awa Traoré',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
    type: 'RESULTAT_EXAMEN',
    isNew: false,
    icon: 'scan',
  },
];

export const mockPrescriptions = [
  {
    id: 'ord-001',
    titre: 'Traitement Hypertension',
    medecinNom: 'Dr. Yao Kouamé',
    dateEmission: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    dateExpiration: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    nbMedicaments: 3,
  },
];
