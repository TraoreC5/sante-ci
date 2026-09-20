/**
 * Écran Détail Document + Interprète IA — Santé CI
 *
 * Affiche le détail d'un document médical et permet de
 * l'interpréter via l'IA Gemini avec consentement explicite.
 *
 * Flux UX :
 *   Détail → Clic "Comprendre avec l'IA" → Modal Consentement
 *   → Chargement → Affichage résultat IA → Disclaimer figé
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';
import {
  documentsApi,
  type AIInterpretationResult,
  type AISection,
} from '../../../services/api';

// ─────────────────────────────────────────────
// Types locaux
// ─────────────────────────────────────────────

interface MockDocument {
  id: string;
  titre: string;
  type: string;
  medecinNom: string | null;
  date: Date;
  isNew?: boolean;
  icon: string;
}

// Données mock pour la démonstration (remplacées par l'API en Phase 3)
const MOCK_DOCUMENTS: MockDocument[] = [
  {
    id: 'doc-001',
    titre: 'Bilan sanguin complet',
    type: 'RESULTAT_EXAMEN',
    medecinNom: 'Dr. Yao Kouamé',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    isNew: true,
    icon: 'water',
  },
  {
    id: 'doc-002',
    titre: 'Radiographie thoracique',
    type: 'RESULTAT_EXAMEN',
    medecinNom: 'Dr. Awa Traoré',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    isNew: false,
    icon: 'scan',
  },
  {
    id: 'ord-001',
    titre: 'Traitement Hypertension',
    type: 'ORDONNANCE',
    medecinNom: 'Dr. Yao Kouamé',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    isNew: false,
    icon: 'medical',
  },
  {
    id: 'scan-001',
    titre: 'Carte de vaccination COVID-19',
    type: 'SCAN_PERSONNEL',
    medecinNom: null,
    date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    isNew: false,
    icon: 'camera',
  },
];

// ─────────────────────────────────────────────
// Composant : Section du résultat IA
// ─────────────────────────────────────────────

const StatutIcon = ({ statut }: { statut: AISection['statut'] }) => {
  if (statut === 'normal') return <Ionicons name="checkmark-circle" size={18} color={Colors.status.success} />;
  if (statut === 'attention') return <Ionicons name="warning" size={18} color={Colors.status.warning} />;
  return <Ionicons name="information-circle" size={18} color={Colors.status.info} />;
};

const StatutColors: Record<AISection['statut'], string> = {
  normal: Colors.status.success,
  attention: Colors.status.warning,
  info: Colors.status.info,
};

const AISectionCard = ({ section, index }: { section: AISection; index: number }) => {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const color = StatutColors[section.statut];

  return (
    <Animated.View
      style={[
        styles.sectionCard,
        { borderLeftColor: color, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.sectionCardHeader}>
        <StatutIcon statut={section.statut} />
        <Text style={[Typography.bodyBold, { color: Colors.text.primary, flex: 1, marginLeft: 8 }]}>
          {section.titre}
        </Text>
        {section.valeur && (
          <View style={[styles.valeurBadge, { backgroundColor: color + '15' }]}>
            <Text style={[styles.valeurText, { color }]}>{section.valeur.split('(')[0].trim()}</Text>
          </View>
        )}
      </View>
      <Text style={[Typography.body, styles.sectionExplication]}>{section.explication}</Text>
      {section.note && (
        <View style={styles.noteContainer}>
          <Ionicons name="bulb-outline" size={14} color={Colors.accent.gold} />
          <Text style={styles.noteText}>{section.note}</Text>
        </View>
      )}
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// Composant : Skeleton de chargement IA
// ─────────────────────────────────────────────

const AISkeleton = () => {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.skeletonContainer}>
      {/* Analyse en cours */}
      <View style={styles.analyzingBadge}>
        <ActivityIndicator size="small" color={Colors.primary.orange} />
        <Text style={styles.analyzingText}>L'IA analyse votre document...</Text>
      </View>

      {/* Lignes skeleton */}
      {[0.9, 0.7, 1.0, 0.6, 0.85].map((w, i) => (
        <Animated.View
          key={i}
          style={[styles.skeletonLine, { width: `${w * 100}%`, opacity: pulse }]}
        />
      ))}
      <View style={styles.skeletonCard}>
        {[0.5, 0.8, 0.7].map((w, i) => (
          <Animated.View
            key={i}
            style={[styles.skeletonLine, { width: `${w * 100}%`, height: 14, marginBottom: 8, opacity: pulse }]}
          />
        ))}
      </View>
      <View style={styles.skeletonCard}>
        {[0.6, 0.75].map((w, i) => (
          <Animated.View
            key={i}
            style={[styles.skeletonLine, { width: `${w * 100}%`, height: 14, marginBottom: 8, opacity: pulse }]}
          />
        ))}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// Composant : Modal de consentement légal
// ─────────────────────────────────────────────

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
}) => {
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(600);
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Poignée */}
          <View style={styles.modalHandle} />

          {/* Icône IA */}
          <LinearGradient
            colors={['#FF6B35', '#FF8C5A']}
            style={styles.modalIconBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.modalIconText}>✨</Text>
          </LinearGradient>

          <Text style={styles.modalTitle}>Interprète IA Médical</Text>
          <Text style={styles.modalDocTitle}>« {documentTitle} »</Text>

          {/* Avertissement légal */}
          <View style={styles.warningBox}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.status.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Avertissement important</Text>
              <Text style={styles.warningText}>
                Cette IA vous aide à <Text style={{ fontWeight: '700' }}>comprendre les termes médicaux</Text> de votre document.
                {'\n\n'}
                Elle <Text style={{ fontWeight: '700', color: Colors.status.error }}>ne remplace en aucun cas l'avis d'un médecin</Text>.
                Ne prenez aucune décision médicale sur la base de cette analyse.
              </Text>
            </View>
          </View>

          {/* Engagement de confidentialité */}
          <View style={styles.privacyBox}>
            <Ionicons name="lock-closed" size={16} color={Colors.primary.green} />
            <Text style={styles.privacyText}>
              Vos données personnelles sont supprimées automatiquement avant l'envoi à l'IA.
            </Text>
          </View>

          {/* Boutons */}
          <TouchableOpacity style={styles.acceptButton} onPress={onAccept} activeOpacity={0.85}>
            <LinearGradient
              colors={Colors.gradients.header}
              style={styles.acceptGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.acceptText}>J'ai compris — Analyser ✨</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
            <Text style={styles.declineText}>Annuler</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// ÉCRAN PRINCIPAL
// ─────────────────────────────────────────────

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [consentVisible, setConsentVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [interpretation, setInterpretation] = useState<AIInterpretationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Trouver le document mock (remplacer par appel API réel en Phase 3)
  const document = MOCK_DOCUMENTS.find((d) => d.id === id) || MOCK_DOCUMENTS[0];

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ORDONNANCE': return 'Ordonnance';
      case 'RESULTAT_EXAMEN': return 'Résultat d\'examen';
      case 'SCAN_PERSONNEL': return 'Scan personnel';
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

  const handleConsentAccepted = async () => {
    setConsentVisible(false);
    setIsLoading(true);
    setError(null);
    setInterpretation(null);

    try {
      // En mode démo : appel à l'API backend (utilise le mode simulation si pas de BDD)
      // Le service backend retourne une simulation si GEMINI_API_KEY n'est pas définie
      const result = await documentsApi.interpret(document.id);

      if (result.success && result.data) {
        setInterpretation(result.data.interpretation);
      } else {
        // Fallback : utiliser une simulation locale pour la démo
        setInterpretation(getMockInterpretation(document.type));
      }
    } catch (e) {
      // En cas d'erreur réseau (mode démo), utiliser la simulation locale
      setInterpretation(getMockInterpretation(document.type));
    } finally {
      setIsLoading(false);
    }
  };

  const color = getTypeColor(document.type);
  const typeLabel = getTypeLabel(document.type);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[color, color + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: (Platform.OS === 'web' ? 16 : insets.top) + 12 }]}
      >
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerNavTitle}>Détail document</Text>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerDocInfo}>
          <View style={styles.headerIconBg}>
            <Ionicons name={document.icon as any} size={28} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerDocTitle}>{document.titre}</Text>
            <View style={styles.headerMeta}>
              <View style={styles.typePill}>
                <Text style={styles.typePillText}>{typeLabel}</Text>
              </View>
              {document.isNew && (
                <View style={styles.newPill}>
                  <Text style={styles.newPillText}>NOUVEAU</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Infos document */}
        <View style={styles.infoCard}>
          {document.medecinNom && (
            <View style={styles.infoRow}>
              <Ionicons name="person" size={16} color={color} />
              <Text style={styles.infoLabel}>Prescrit par</Text>
              <Text style={styles.infoValue}>{document.medecinNom}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color={color} />
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>
              {document.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="document-text" size={16} color={color} />
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{typeLabel}</Text>
          </View>
        </View>

        {/* Aperçu document (simulé) */}
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Ionicons name="eye-outline" size={18} color={Colors.text.secondary} />
            <Text style={[Typography.captionBold, { color: Colors.text.secondary, marginLeft: 6 }]}>
              Aperçu du document
            </Text>
          </View>
          <View style={styles.previewContent}>
            <Ionicons name="document-lock-outline" size={48} color={Colors.text.tertiary} />
            <Text style={[Typography.body, { color: Colors.text.tertiary, marginTop: 12, textAlign: 'center' }]}>
              Le fichier est stocké de manière chiffrée.
            </Text>
            <TouchableOpacity style={[styles.viewFileButton, { borderColor: color }]}>
              <Ionicons name="open-outline" size={16} color={color} />
              <Text style={[styles.viewFileText, { color }]}>Ouvrir le fichier</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── BOUTON INTERPRÈTE IA ─── */}
        {!interpretation && !isLoading && (
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => setConsentVisible(true)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Colors.gradients.header}
              style={styles.aiButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.aiButtonContent}>
                <View style={styles.aiButtonLeft}>
                  <Text style={styles.aiButtonEmoji}>✨</Text>
                  <View>
                    <Text style={styles.aiButtonTitle}>Comprendre avec l'IA</Text>
                    <Text style={styles.aiButtonSubtitle}>Vulgarisation en langage simple</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.8)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ─── SKELETON DE CHARGEMENT ─── */}
        {isLoading && <AISkeleton />}

        {/* ─── RÉSULTAT IA ─── */}
        {interpretation && !isLoading && (
          <View style={styles.aiResult}>
            {/* En-tête résultat */}
            <View style={styles.aiResultHeader}>
              <LinearGradient
                colors={Colors.gradients.header}
                style={styles.aiResultIconBg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={{ fontSize: 18 }}>✨</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiResultTitle}>Analyse de l'IA</Text>
                <Text style={styles.aiResultTime}>
                  Généré le {new Date(interpretation.processedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => { setInterpretation(null); setError(null); }}
                style={styles.resetButton}
              >
                <Ionicons name="refresh" size={18} color={Colors.text.tertiary} />
              </TouchableOpacity>
            </View>

            {/* Résumé */}
            <View style={styles.resumeCard}>
              <Text style={[Typography.bodyBold, { color: Colors.text.primary, marginBottom: 8 }]}>
                En résumé
              </Text>
              <Text style={[Typography.body, { color: Colors.text.secondary, lineHeight: 22 }]}>
                {interpretation.resume}
              </Text>
            </View>

            {/* Sections */}
            <Text style={[Typography.h3, styles.sectionsTitle]}>Détail des résultats</Text>
            {interpretation.sections.map((section, index) => (
              <AISectionCard key={index} section={section} index={index} />
            ))}

            {/* Disclaimer médical (figé en bas) */}
            <View style={styles.disclaimerCard}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.status.warning} />
              <Text style={styles.disclaimerText}>{interpretation.disclaimer}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de consentement */}
      <ConsentModal
        visible={consentVisible}
        onAccept={handleConsentAccepted}
        onDecline={() => setConsentVisible(false)}
        documentTitle={document.titre}
      />
    </View>
  );
}

// ─────────────────────────────────────────────
// Simulation locale pour la démo (sans backend)
// ─────────────────────────────────────────────

function getMockInterpretation(documentType: string): AIInterpretationResult {
  if (documentType === 'ORDONNANCE') {
    return {
      resume: "Votre ordonnance contient plusieurs médicaments prescrits pour traiter votre hypertension artérielle et réguler votre taux de graisses dans le sang.",
      sections: [
        {
          titre: "Amlodipine 5mg — Antihypertenseur",
          explication: "Ce médicament appartient à la famille des inhibiteurs calciques. Il aide à détendre et élargir vos vaisseaux sanguins, ce qui facilite la circulation du sang et réduit la pression sur le cœur.",
          valeur: "1 comprimé/jour le matin",
          statut: 'info',
          note: "À prendre chaque matin, même les jours où vous vous sentez bien. Ne pas arrêter sans l'accord de votre médecin."
        },
        {
          titre: "Atorvastatine 20mg — Régulateur de graisses",
          explication: "Ce médicament (une statine) agit sur le foie pour réduire la production de cholestérol. Il aide à protéger vos artères sur le long terme.",
          valeur: "1 comprimé le soir",
          statut: 'info',
          note: "Il est recommandé de le prendre le soir, car le corps produit plus de cholestérol la nuit."
        },
        {
          titre: "Aspirine 75mg — Protecteur cardiovasculaire",
          explication: "À cette petite dose, l'aspirine rend le sang légèrement plus fluide pour protéger les artères et le cœur contre les caillots.",
          valeur: "1 comprimé/jour avec repas",
          statut: 'info',
          note: "Toujours prendre avec un repas pour protéger l'estomac."
        }
      ],
      disclaimer: "Cette explication est fournie à titre informatif uniquement. Elle ne remplace pas l'avis de votre médecin. Ne modifiez, ne réduisez et n'arrêtez jamais un traitement sans en parler à votre médecin.",
      processedAt: new Date().toISOString(),
    };
  }

  return {
    resume: "Votre bilan sanguin évalue plusieurs indicateurs de votre santé. Certaines valeurs méritent d'être discutées avec votre médecin.",
    sections: [
      {
        titre: "Hémoglobine — Transport d'oxygène",
        explication: "L'hémoglobine est la protéine dans vos globules rouges qui transporte l'oxygène de vos poumons vers tous vos organes.",
        valeur: "11.8 g/dL (Norme : 13.0-17.5)",
        statut: 'attention',
        note: "Cette valeur est légèrement sous la norme. Votre médecin évaluera si un suivi ou un traitement est nécessaire."
      },
      {
        titre: "Glycémie à jeun — Taux de sucre",
        explication: "La glycémie mesure la quantité de sucre (glucose) dans votre sang. Ce test est réalisé après une période sans manger.",
        valeur: "1.15 g/L (Norme : 0.70-1.10)",
        statut: 'attention',
        note: "Légèrement au-dessus de la normale. Votre médecin déterminera si un suivi est nécessaire."
      },
      {
        titre: "Cholestérol total — Graisses dans le sang",
        explication: "Le cholestérol est une graisse essentielle produite par le foie. Un taux trop élevé peut, sur plusieurs années, favoriser des dépôts dans les artères.",
        valeur: "2.1 g/L (Norme : < 2.0)",
        statut: 'attention',
        note: "Légèrement élevé. Un régime équilibré et l'activité physique peuvent aider."
      },
      {
        titre: "Globules blancs — Défenses immunitaires",
        explication: "Les globules blancs (leucocytes) sont les soldats de votre système immunitaire. Ils combattent les infections et les corps étrangers.",
        valeur: "8.5 × 10³/μL (Norme : 4.0-10.0)",
        statut: 'normal',
      },
      {
        titre: "Plaquettes — Coagulation",
        explication: "Les plaquettes sont de minuscules éléments du sang qui forment des bouchons pour arrêter les saignements lorsque vous vous blessez.",
        valeur: "230 × 10³/μL (Norme : 150-400)",
        statut: 'normal',
      }
    ],
    disclaimer: "Cette explication est fournie uniquement pour vous aider à comprendre les termes de votre document médical. Elle ne constitue pas un diagnostic et ne remplace pas l'interprétation clinique de votre médecin. Consultez-le pour toute question sur votre santé.",
    processedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  header: {
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerNavTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerDocInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 14,
  },
  headerIconBg: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerDocTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  headerMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  typePill: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  typePillText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  newPill: {
    backgroundColor: Colors.status.new,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  newPillText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 20,
  },
  // Info card
  infoCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  infoLabel: {
    color: Colors.text.tertiary,
    fontSize: 13,
    flex: 1,
  },
  infoValue: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  // Preview
  previewCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  viewFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  viewFileText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // AI Button
  aiButton: {
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: Colors.primary.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  aiButtonGradient: {
    padding: 18,
  },
  aiButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  aiButtonEmoji: {
    fontSize: 32,
  },
  aiButtonTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
  },
  aiButtonSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  // Skeleton
  skeletonContainer: {
    backgroundColor: Colors.surface.card,
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
  },
  analyzingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    padding: 12,
    backgroundColor: Colors.primary.orange + '10',
    borderRadius: 12,
  },
  analyzingText: {
    color: Colors.primary.orange,
    fontWeight: '700',
    fontSize: 14,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: '#E8ECF0',
    borderRadius: 6,
    marginBottom: 10,
  },
  skeletonCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  // AI Result
  aiResult: {
    marginBottom: 14,
  },
  aiResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  aiResultIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiResultTitle: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  aiResultTime: {
    color: Colors.text.tertiary,
    fontSize: 12,
    marginTop: 2,
  },
  resetButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: Colors.surface.card,
  },
  resumeCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.orange,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionsTitle: {
    color: Colors.text.primary,
    marginBottom: 12,
    marginLeft: 4,
  },
  // Section Card
  sectionCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  valeurBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
    flexShrink: 0,
  },
  valeurText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sectionExplication: {
    color: Colors.text.secondary,
    lineHeight: 22,
    fontSize: 14,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
    backgroundColor: Colors.accent.gold + '10',
    borderRadius: 8,
    padding: 10,
  },
  noteText: {
    flex: 1,
    color: Colors.text.secondary,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  // Disclaimer
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.status.warning + '10',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.status.warning + '25',
  },
  disclaimerText: {
    flex: 1,
    color: Colors.text.secondary,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDE1E7',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalIconBg: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalIconText: {
    fontSize: 28,
  },
  modalTitle: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalDocTitle: {
    color: Colors.text.tertiary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.status.warning + '12',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.status.warning + '30',
  },
  warningTitle: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  warningText: {
    color: Colors.text.secondary,
    fontSize: 13,
    lineHeight: 20,
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary.green + '10',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  privacyText: {
    flex: 1,
    color: Colors.primary.green,
    fontSize: 12,
    fontWeight: '600',
  },
  acceptButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: Colors.primary.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  acceptGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  acceptText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
  },
  declineButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  declineText: {
    color: Colors.text.tertiary,
    fontSize: 15,
    fontWeight: '600',
  },
});
