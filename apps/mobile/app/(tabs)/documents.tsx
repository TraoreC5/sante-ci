/**
 * Écran Documents — Santé CI
 *
 * Liste des documents médicaux avec filtrage par type.
 * Le détail + Interprète IA s'affiche dans un Modal plein écran
 * pour éviter les problèmes de routes dynamiques sur Expo Web.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { mockAnalysisResults, mockPrescriptions } from '../../data/mockData';
import { MobileContainer } from '../../components/ui/MobileContainer';
import type { AIInterpretationResult, AISection } from '../../services/api';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type DocFilter = 'ALL' | 'ORDONNANCE' | 'RESULTAT_EXAMEN' | 'SCAN_PERSONNEL';

interface DocItem {
  id: string;
  titre: string;
  type: string;
  medecinNom: string | null;
  date: Date;
  isNew: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}

const filters: { key: DocFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'ALL', label: 'Tous', icon: 'grid' },
  { key: 'ORDONNANCE', label: 'Ordonnances', icon: 'medical' },
  { key: 'RESULTAT_EXAMEN', label: 'Résultats', icon: 'document-text' },
  { key: 'SCAN_PERSONNEL', label: 'Scans', icon: 'camera' },
];

const allDocuments: DocItem[] = [
  ...mockAnalysisResults.map((d) => ({
    id: d.id,
    titre: d.titre,
    type: d.type as string,
    medecinNom: d.medecinNom,
    date: d.date,
    isNew: d.isNew,
    icon: d.icon as keyof typeof Ionicons.glyphMap,
  })),
  ...mockPrescriptions.map((p) => ({
    id: p.id,
    titre: p.titre,
    type: 'ORDONNANCE',
    medecinNom: p.medecinNom,
    date: p.dateEmission,
    isNew: false,
    icon: 'medical' as keyof typeof Ionicons.glyphMap,
  })),
  {
    id: 'scan-001',
    titre: 'Carte de vaccination COVID-19',
    type: 'SCAN_PERSONNEL',
    medecinNom: null,
    date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    isNew: false,
    icon: 'camera' as keyof typeof Ionicons.glyphMap,
  },
];

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'ORDONNANCE': return 'Ordonnance';
    case 'RESULTAT_EXAMEN': return 'Résultat';
    case 'SCAN_PERSONNEL': return 'Scan';
    default: return type;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'ORDONNANCE': return Colors.primary.green;
    case 'RESULTAT_EXAMEN': return Colors.accent.teal;
    case 'SCAN_PERSONNEL': return Colors.accent.purple;
    default: return Colors.text.tertiary;
  }
};

// ─────────────────────────────────────────────
// Interprète IA — Sous-composants
// ─────────────────────────────────────────────

const StatutColors: Record<AISection['statut'], string> = {
  normal: Colors.status.success,
  attention: Colors.status.warning,
  info: Colors.status.info,
};

const AISectionCard = ({ section, index }: { section: AISection; index: number }) => {
  const color = StatutColors[section.statut];
  const Icon = section.statut === 'normal'
    ? 'checkmark-circle'
    : section.statut === 'attention' ? 'warning' : 'information-circle';

  return (
    <View style={[detailStyles.sectionCard, { borderLeftColor: color }]}>
      <View style={detailStyles.sectionCardHeader}>
        <Ionicons name={Icon} size={18} color={color} />
        <Text style={[Typography.bodyBold, { color: Colors.text.primary, flex: 1, marginLeft: 8 }]}>
          {section.titre}
        </Text>
        {section.valeur && (
          <View style={[detailStyles.valeurBadge, { backgroundColor: color + '15' }]}>
            <Text style={[detailStyles.valeurText, { color }]} numberOfLines={1}>
              {section.valeur.split('(')[0].trim()}
            </Text>
          </View>
        )}
      </View>
      <Text style={[Typography.body, detailStyles.sectionExplication]}>{section.explication}</Text>
      {section.note && (
        <View style={detailStyles.noteContainer}>
          <Ionicons name="bulb-outline" size={14} color={Colors.accent.gold} />
          <Text style={detailStyles.noteText}>{section.note}</Text>
        </View>
      )}
    </View>
  );
};

// Skeleton de chargement IA
const AISkeleton = () => (
  <View style={detailStyles.skeletonContainer}>
    <View style={detailStyles.analyzingBadge}>
      <ActivityIndicator size="small" color={Colors.primary.orange} />
      <Text style={detailStyles.analyzingText}>L'IA analyse votre document...</Text>
    </View>
    {[0.9, 0.7, 1.0, 0.6, 0.85].map((w, i) => (
      <View key={i} style={[detailStyles.skeletonLine, { width: `${w * 100}%` as any }]} />
    ))}
    <View style={detailStyles.skeletonCard}>
      {[0.5, 0.8, 0.7].map((w, i) => (
        <View key={i} style={[detailStyles.skeletonLine, { width: `${w * 100}%` as any, height: 14, marginBottom: 8 }]} />
      ))}
    </View>
  </View>
);

// Modal de consentement légal
const ConsentModal = ({
  visible,
  onAccept,
  onDecline,
  documentTitle,
}: {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
  documentTitle: string;
}) => (
  <Modal transparent visible={visible} animationType="slide" statusBarTranslucent>
    <View style={detailStyles.consentOverlay}>
      <View style={detailStyles.consentSheet}>
        <View style={detailStyles.modalHandle} />
        <LinearGradient
          colors={['#FF6B35', '#FF8C5A']}
          style={detailStyles.modalIconBg}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={{ fontSize: 26 }}>✨</Text>
        </LinearGradient>
        <Text style={detailStyles.consentTitle}>Interprète IA Médical</Text>
        <Text style={detailStyles.consentDocTitle}>« {documentTitle} »</Text>

        <View style={detailStyles.warningBox}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.status.warning} />
          <View style={{ flex: 1 }}>
            <Text style={detailStyles.warningTitle}>Avertissement important</Text>
            <Text style={detailStyles.warningText}>
              Cette IA vous aide à{' '}
              <Text style={{ fontWeight: '700' }}>comprendre les termes médicaux</Text>
              {' '}de votre document.{'\n\n'}
              Elle{' '}
              <Text style={{ fontWeight: '700', color: Colors.status.error }}>
                ne remplace en aucun cas l'avis d'un médecin
              </Text>
              . Ne prenez aucune décision médicale sur la base de cette analyse.
            </Text>
          </View>
        </View>

        <View style={detailStyles.privacyBox}>
          <Ionicons name="lock-closed" size={16} color={Colors.primary.green} />
          <Text style={detailStyles.privacyText}>
            Vos données personnelles sont supprimées avant l'envoi à l'IA.
          </Text>
        </View>

        <TouchableOpacity style={detailStyles.acceptButton} onPress={onAccept} activeOpacity={0.85}>
          <LinearGradient
            colors={Colors.gradients.header}
            style={detailStyles.acceptGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={detailStyles.acceptText}>J'ai compris — Analyser ✨</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={detailStyles.declineButton} onPress={onDecline}>
          <Text style={detailStyles.declineText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// ─────────────────────────────────────────────
// Modal de détail du document
// ─────────────────────────────────────────────

const DocumentDetailModal = ({
  doc,
  visible,
  onClose,
}: {
  doc: DocItem | null;
  visible: boolean;
  onClose: () => void;
}) => {
  const [consentVisible, setConsentVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [interpretation, setInterpretation] = useState<AIInterpretationResult | null>(null);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (!visible) {
      setConsentVisible(false);
      setIsLoading(false);
      setInterpretation(null);
    }
  }, [visible]);

  if (!doc) return null;

  const color = getTypeColor(doc.type);
  const typeLabel = getTypeLabel(doc.type);

  const handleConsentAccepted = async () => {
    setConsentVisible(false);
    setIsLoading(true);
    // Simulation d'un appel IA (1.5s de délai réaliste)
    await new Promise((r) => setTimeout(r, 1500));
    setInterpretation(getMockInterpretation(doc.type));
    setIsLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <MobileContainer>
      <View style={detailStyles.detailContainer}>
        {/* Header coloré */}
        <LinearGradient
          colors={[color, color + 'CC']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[detailStyles.detailHeader, { paddingTop: (Platform.OS === 'web' ? 16 : insets.top) + 12 }]}
        >
          <View style={detailStyles.detailHeaderNav}>
            <TouchableOpacity onPress={onClose} style={detailStyles.backButton}>
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            <Text style={detailStyles.detailHeaderNavTitle}>Détail document</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={detailStyles.detailHeaderDocInfo}>
            <View style={detailStyles.detailHeaderIconBg}>
              <Ionicons name={doc.icon} size={28} color={color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={detailStyles.detailHeaderDocTitle}>{doc.titre}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                <View style={detailStyles.typePill}>
                  <Text style={detailStyles.typePillText}>{typeLabel}</Text>
                </View>
                {doc.isNew && (
                  <View style={[detailStyles.typePill, { backgroundColor: Colors.status.new }]}>
                    <Text style={detailStyles.typePillText}>NOUVEAU</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={detailStyles.detailScrollContent}>
          {/* Infos */}
          <View style={detailStyles.infoCard}>
            {doc.medecinNom && (
              <View style={detailStyles.infoRow}>
                <Ionicons name="person" size={15} color={color} />
                <Text style={detailStyles.infoLabel}>Prescrit par</Text>
                <Text style={detailStyles.infoValue}>{doc.medecinNom}</Text>
              </View>
            )}
            <View style={[detailStyles.infoRow, { borderBottomWidth: 0 }]}>
              <Ionicons name="calendar" size={15} color={color} />
              <Text style={detailStyles.infoLabel}>Date</Text>
              <Text style={detailStyles.infoValue}>
                {doc.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          </View>

          {/* Aperçu (simulé) */}
          <View style={detailStyles.previewCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="eye-outline" size={18} color={Colors.text.secondary} />
              <Text style={[Typography.captionBold, { color: Colors.text.secondary, marginLeft: 6 }]}>
                Aperçu du document
              </Text>
            </View>
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Ionicons name="document-lock-outline" size={48} color={Colors.text.tertiary} />
              <Text style={[Typography.body, { color: Colors.text.tertiary, marginTop: 12, textAlign: 'center' }]}>
                Fichier stocké de manière chiffrée
              </Text>
              <TouchableOpacity style={[detailStyles.viewFileButton, { borderColor: color }]}>
                <Ionicons name="open-outline" size={16} color={color} />
                <Text style={[detailStyles.viewFileText, { color }]}>Ouvrir le fichier</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bouton IA */}
          {!interpretation && !isLoading && (
            <TouchableOpacity
              style={detailStyles.aiButton}
              onPress={() => setConsentVisible(true)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={Colors.gradients.header}
                style={detailStyles.aiButtonGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <Text style={{ fontSize: 30 }}>✨</Text>
                    <View>
                      <Text style={detailStyles.aiButtonTitle}>Comprendre avec l'IA</Text>
                      <Text style={detailStyles.aiButtonSubtitle}>Vulgarisation en langage simple</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.8)" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Skeleton */}
          {isLoading && <AISkeleton />}

          {/* Résultat IA */}
          {interpretation && !isLoading && (
            <View style={{ marginBottom: 14 }}>
              {/* Header résultat */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <LinearGradient colors={Colors.gradients.header} style={detailStyles.aiResultIconBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={{ fontSize: 18 }}>✨</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={detailStyles.aiResultTitle}>Analyse de l'IA</Text>
                  <Text style={[Typography.caption, { color: Colors.text.tertiary }]}>Résultat de vulgarisation médicale</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setInterpretation(null)}
                  style={{ padding: 8, borderRadius: 10, backgroundColor: Colors.surface.card }}
                >
                  <Ionicons name="refresh" size={18} color={Colors.text.tertiary} />
                </TouchableOpacity>
              </View>

              {/* Résumé */}
              <View style={[detailStyles.infoCard, { borderLeftWidth: 4, borderLeftColor: Colors.primary.orange }]}>
                <Text style={[Typography.bodyBold, { color: Colors.text.primary, marginBottom: 8 }]}>En résumé</Text>
                <Text style={[Typography.body, { color: Colors.text.secondary, lineHeight: 22 }]}>
                  {interpretation.resume}
                </Text>
              </View>

              <Text style={[Typography.h3, { color: Colors.text.primary, marginBottom: 12, marginTop: 8 }]}>
                Détail des résultats
              </Text>

              {interpretation.sections.map((section, index) => (
                <AISectionCard key={index} section={section} index={index} />
              ))}

              {/* Disclaimer figé */}
              <View style={detailStyles.disclaimerCard}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.status.warning} />
                <Text style={detailStyles.disclaimerText}>{interpretation.disclaimer}</Text>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* Modal consentement */}
      <ConsentModal
        visible={consentVisible}
        onAccept={handleConsentAccepted}
        onDecline={() => setConsentVisible(false)}
        documentTitle={doc.titre}
      />
      </MobileContainer>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// ÉCRAN PRINCIPAL DOCUMENTS
// ─────────────────────────────────────────────

export default function DocumentsScreen() {
  const [activeFilter, setActiveFilter] = useState<DocFilter>('ALL');
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const insets = useSafeAreaInsets();

  const filteredDocs = activeFilter === 'ALL'
    ? allDocuments
    : allDocuments.filter((d) => d.type === activeFilter);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradients.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: (Platform.OS === 'web' ? 16 : insets.top) + 16 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Documents</Text>
            <Text style={styles.headerSubtitle}>
              {allDocuments.length} document{allDocuments.length > 1 ? 's' : ''} médicaux
            </Text>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Filtres */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(filter.key)}
            activeOpacity={0.7}
          >
            <Ionicons name={filter.icon} size={15} color={activeFilter === filter.key ? 'white' : Colors.text.secondary} />
            <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste */}
      <FlatList
        data={filteredDocs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.docCard}
            activeOpacity={0.7}
            onPress={() => setSelectedDoc(item)}
          >
            <View style={[styles.docIconBg, { backgroundColor: getTypeColor(item.type) + '12' }]}>
              <Ionicons name={item.icon} size={22} color={getTypeColor(item.type)} />
            </View>
            <View style={styles.docInfo}>
              <View style={styles.docTitleRow}>
                <Text style={[Typography.bodyBold, styles.docTitle]} numberOfLines={1}>
                  {item.titre}
                </Text>
                {item.isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
              </View>
              <View style={styles.docMeta}>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + '15' }]}>
                  <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>
                    {getTypeLabel(item.type)}
                  </Text>
                </View>
                <Text style={[Typography.caption, { color: Colors.text.tertiary }]}>
                  {formatDate(item.date)}
                </Text>
              </View>
              {item.medecinNom && (
                <Text style={[Typography.caption, { color: Colors.text.secondary, marginTop: 3 }]}>
                  {item.medecinNom}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="document-outline" size={48} color={Colors.text.tertiary} />
            </View>
            <Text style={[Typography.h3, { color: Colors.text.secondary, marginTop: 16 }]}>
              Aucun document
            </Text>
            <Text style={[Typography.body, { color: Colors.text.tertiary, textAlign: 'center' }]}>
              Vos documents médicaux apparaîtront ici
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <LinearGradient
          colors={Colors.gradients.header}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Modal de détail (remplace la navigation dynamique) */}
      <DocumentDetailModal
        doc={selectedDoc}
        visible={selectedDoc !== null}
        onClose={() => setSelectedDoc(null)}
      />
    </View>
  );
}

// ─────────────────────────────────────────────
// Mock IA (même que dans [id].tsx)
// ─────────────────────────────────────────────

function getMockInterpretation(documentType: string): AIInterpretationResult {
  if (documentType === 'ORDONNANCE') {
    return {
      resume: "Votre ordonnance contient plusieurs médicaments prescrits pour traiter votre hypertension artérielle et réguler votre taux de graisses dans le sang.",
      sections: [
        { titre: "Amlodipine 5mg — Antihypertenseur", explication: "Ce médicament aide à détendre vos vaisseaux sanguins, ce qui facilite la circulation du sang et réduit la pression sur le cœur.", valeur: "1 comprimé/jour le matin", statut: 'info', note: "À prendre chaque matin, même les jours où vous vous sentez bien." },
        { titre: "Atorvastatine 20mg — Régulateur de graisses", explication: "Ce médicament (une statine) agit sur le foie pour réduire la production de cholestérol, protégeant vos artères sur le long terme.", valeur: "1 comprimé le soir", statut: 'info', note: "Recommandé le soir, car le corps produit plus de cholestérol la nuit." },
        { titre: "Aspirine 75mg — Protecteur cardiovasculaire", explication: "À petite dose, l'aspirine rend le sang légèrement plus fluide pour protéger les artères et le cœur contre les caillots.", valeur: "1 comprimé/jour avec repas", statut: 'info', note: "Toujours prendre avec un repas pour protéger l'estomac." },
      ],
      disclaimer: "Cette explication est fournie à titre informatif uniquement. Ne modifiez, ne réduisez et n'arrêtez jamais un traitement sans l'accord de votre médecin.",
      processedAt: new Date().toISOString(),
    };
  }
  return {
    resume: "Votre bilan sanguin évalue plusieurs indicateurs de votre santé. Certaines valeurs méritent d'être discutées avec votre médecin lors de votre prochain rendez-vous.",
    sections: [
      { titre: "Hémoglobine — Transport d'oxygène", explication: "L'hémoglobine transporte l'oxygène de vos poumons vers tous vos organes. Une valeur basse peut indiquer une anémie, mais seul votre médecin peut confirmer cela.", valeur: "11.8 g/dL (Norme : 13.0-17.5)", statut: 'attention', note: "Légèrement en dessous de la norme. Votre médecin évaluera si un suivi est nécessaire." },
      { titre: "Glycémie à jeun — Taux de sucre", explication: "La glycémie mesure la quantité de sucre (glucose) dans votre sang à jeun. C'est un indicateur clé pour surveiller le métabolisme.", valeur: "1.15 g/L (Norme : 0.70-1.10)", statut: 'attention', note: "Légèrement au-dessus de la normale. Votre médecin déterminera si un suivi est nécessaire." },
      { titre: "Cholestérol total — Graisses dans le sang", explication: "Le cholestérol est une graisse essentielle. Un taux trop élevé peut, sur plusieurs années, favoriser des dépôts dans les artères.", valeur: "2.1 g/L (Norme : < 2.0)", statut: 'attention', note: "Un régime équilibré et l'activité physique peuvent aider à réduire ce taux." },
      { titre: "Globules blancs — Défenses immunitaires", explication: "Les globules blancs combattent les infections. Un taux normal indique que votre système immunitaire fonctionne correctement.", valeur: "8.5 × 10³/μL (Norme : 4.0-10.0)", statut: 'normal' },
      { titre: "Plaquettes — Coagulation", explication: "Les plaquettes forment des bouchons pour arrêter les saignements. Votre taux est dans la norme.", valeur: "230 × 10³/μL (Norme : 150-400)", statut: 'normal' },
    ],
    disclaimer: "Cette explication est fournie uniquement pour vous aider à comprendre les termes de votre document médical. Elle ne constitue pas un diagnostic et ne remplace pas l'interprétation de votre médecin. Consultez-le pour toute question.",
    processedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.background },
  header: { paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: '800' },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 3 },
  searchButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  filtersContainer: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: Colors.surface.card, borderWidth: 1, borderColor: '#E8ECF0', marginRight: 8 },
  filterChipActive: { backgroundColor: Colors.primary.orange, borderColor: Colors.primary.orange },
  filterText: { color: Colors.text.secondary, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: 'white' },
  listContent: { padding: 16, paddingTop: 4, paddingBottom: 90 },
  docCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface.card, borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  docIconBg: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  docInfo: { flex: 1 },
  docTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  docTitle: { color: Colors.text.primary, flex: 1 },
  newBadge: { backgroundColor: Colors.status.new, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  newBadgeText: { color: 'white', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  docMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeText: { fontSize: 11, fontWeight: '700' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 40, gap: 8 },
  emptyIconBg: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.primary.orange + '10', justifyContent: 'center', alignItems: 'center' },
  fab: { position: 'absolute', bottom: 20, right: 20, borderRadius: 28, shadowColor: Colors.primary.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  fabGradient: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
});

const detailStyles = StyleSheet.create({
  detailContainer: { flex: 1, backgroundColor: Colors.surface.background },
  detailHeader: { paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  detailHeaderNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  detailHeaderNavTitle: { color: 'white', fontSize: 16, fontWeight: '700' },
  detailHeaderDocInfo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 14 },
  detailHeaderIconBg: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  detailHeaderDocTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  typePill: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  typePillText: { color: 'white', fontSize: 11, fontWeight: '700' },
  detailScrollContent: { padding: 16, paddingTop: 20 },
  infoCard: { backgroundColor: Colors.surface.card, borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 10 },
  infoLabel: { color: Colors.text.tertiary, fontSize: 13, flex: 1 },
  infoValue: { color: Colors.text.primary, fontSize: 13, fontWeight: '600', flex: 2, textAlign: 'right' },
  previewCard: { backgroundColor: Colors.surface.card, borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  viewFileButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  viewFileText: { fontSize: 14, fontWeight: '600' },
  aiButton: { borderRadius: 18, marginBottom: 14, overflow: 'hidden', shadowColor: Colors.primary.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  aiButtonGradient: { padding: 18 },
  aiButtonTitle: { color: 'white', fontSize: 17, fontWeight: '800' },
  aiButtonSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  skeletonContainer: { backgroundColor: Colors.surface.card, borderRadius: 18, padding: 20, marginBottom: 14 },
  analyzingBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, padding: 12, backgroundColor: Colors.primary.orange + '10', borderRadius: 12 },
  analyzingText: { color: Colors.primary.orange, fontWeight: '700', fontSize: 14 },
  skeletonLine: { height: 12, backgroundColor: '#E8ECF0', borderRadius: 6, marginBottom: 10 },
  skeletonCard: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, marginTop: 10 },
  aiResultIconBg: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  aiResultTitle: { color: Colors.text.primary, fontSize: 18, fontWeight: '800' },
  sectionCard: { backgroundColor: Colors.surface.card, borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  sectionCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  valeurBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 8, flexShrink: 0 },
  valeurText: { fontSize: 11, fontWeight: '800' },
  sectionExplication: { color: Colors.text.secondary, lineHeight: 22, fontSize: 14 },
  noteContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 10, backgroundColor: Colors.accent.gold + '10', borderRadius: 8, padding: 10 },
  noteText: { flex: 1, color: Colors.text.secondary, fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  disclaimerCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: Colors.status.warning + '10', borderRadius: 14, padding: 14, marginTop: 16, borderWidth: 1, borderColor: Colors.status.warning + '25' },
  disclaimerText: { flex: 1, color: Colors.text.secondary, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  // Consent Modal
  consentOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  consentSheet: { backgroundColor: Colors.surface.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#DDE1E7', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalIconBg: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 14 },
  consentTitle: { color: Colors.text.primary, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  consentDocTitle: { color: Colors.text.tertiary, fontSize: 14, textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },
  warningBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: Colors.status.warning + '12', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.status.warning + '30' },
  warningTitle: { color: Colors.text.primary, fontSize: 14, fontWeight: '800', marginBottom: 6 },
  warningText: { color: Colors.text.secondary, fontSize: 13, lineHeight: 20 },
  privacyBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary.green + '10', borderRadius: 10, padding: 10, marginBottom: 20 },
  privacyText: { flex: 1, color: Colors.primary.green, fontSize: 12, fontWeight: '600' },
  acceptButton: { borderRadius: 16, overflow: 'hidden', marginBottom: 12, shadowColor: Colors.primary.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
  acceptGradient: { paddingVertical: 16, alignItems: 'center' },
  acceptText: { color: 'white', fontSize: 17, fontWeight: '800' },
  declineButton: { paddingVertical: 14, alignItems: 'center' },
  declineText: { color: Colors.text.tertiary, fontSize: 15, fontWeight: '600' },
});
