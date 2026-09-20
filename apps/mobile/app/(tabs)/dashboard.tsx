import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { mockUser, mockAppointments, mockAnalysisResults, mockPrescriptions } from '../../data/mockData';

const SectionHeader = ({ title, icon, onSeeAll }: { title: string; icon: keyof typeof Ionicons.glyphMap; onSeeAll: () => void }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionTitleContainer}>
      <View style={[styles.sectionIconBg, { backgroundColor: Colors.primary.orange + '15' }]}>
        <Ionicons name={icon} size={16} color={Colors.primary.orange} />
      </View>
      <Text style={[Typography.h3, styles.sectionTitle]}>{title}</Text>
    </View>
    <TouchableOpacity onPress={onSeeAll}>
      <Text style={[Typography.captionBold, { color: Colors.primary.orange }]}>Voir tout</Text>
    </TouchableOpacity>
  </View>
);

// Quick action grid
const QuickActionGrid = () => {
  const actions = [
    { icon: 'calendar', label: 'Prendre RDV', color: Colors.primary.green, gradient: Colors.gradients.greenCard },
    { icon: 'camera', label: 'Scanner doc', color: Colors.accent.teal, gradient: Colors.gradients.tealCard },
    { icon: 'medical', label: 'Constantes', color: Colors.accent.purple, gradient: Colors.gradients.purpleCard },
    { icon: 'qr-code', label: 'QR Urgence', color: Colors.status.error, gradient: Colors.gradients.emergency },
  ];

  return (
    <View style={styles.quickGrid}>
      {actions.map((action, i) => (
        <TouchableOpacity key={i} style={styles.quickItem} activeOpacity={0.7}>
          <LinearGradient colors={action.gradient} style={styles.quickIconBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name={action.icon as any} size={22} color="white" />
          </LinearGradient>
          <Text style={[Typography.caption, styles.quickLabel]}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <LinearGradient
          colors={Colors.gradients.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: (Platform.OS === 'web' ? 16 : insets.top) + 16 }]}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>Bonjour, {mockUser.prenom} 👋</Text>
              <Text style={styles.subtitle}>Comment allez-vous aujourd'hui ?</Text>
            </View>
            <TouchableOpacity style={styles.bellButton}>
              <Ionicons name="notifications-outline" size={22} color="white" />
              {mockUser.notificationsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{mockUser.notificationsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Search bar inside header */}
          <TouchableOpacity style={styles.searchBar}>
            <Ionicons name="search" size={18} color={Colors.text.tertiary} />
            <Text style={styles.searchText}>Rechercher un médecin, document...</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.content}>
          {/* Quick Actions */}
          <QuickActionGrid />

          {/* Prochains RDV */}
          <SectionHeader title="Prochains rendez-vous" icon="calendar" onSeeAll={() => {}} />
          {mockAppointments.map((apt) => (
            <TouchableOpacity key={apt.id} style={styles.appointmentCard} activeOpacity={0.7}>
              <View style={styles.aptDateBadge}>
                <Text style={styles.aptDateDay}>
                  {apt.dateHeure.toLocaleDateString('fr-FR', { weekday: 'short' }).substring(0, 3)}
                </Text>
                <Text style={styles.aptDateNum}>{apt.dateHeure.getDate()}</Text>
                <Text style={styles.aptDateMonth}>
                  {apt.dateHeure.toLocaleDateString('fr-FR', { month: 'short' })}
                </Text>
              </View>
              <View style={styles.aptInfo}>
                <Text style={[Typography.bodyBold, { color: Colors.text.primary }]}>{apt.medecinNom}</Text>
                <Text style={[Typography.caption, { color: Colors.primary.orange, marginTop: 2 }]}>{apt.specialite}</Text>
                <View style={styles.aptMeta}>
                  <Ionicons name="location-outline" size={12} color={Colors.text.tertiary} />
                  <Text style={[Typography.caption, { color: Colors.text.tertiary, flex: 1 }]} numberOfLines={1}>
                    {apt.clinique}
                  </Text>
                </View>
                <View style={styles.aptMeta}>
                  <Ionicons name="time-outline" size={12} color={Colors.text.tertiary} />
                  <Text style={[Typography.caption, { color: Colors.text.tertiary }]}>{formatTime(apt.dateHeure)}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
            </TouchableOpacity>
          ))}

          <View style={styles.spacer} />

          {/* Derniers résultats */}
          <SectionHeader title="Derniers résultats" icon="document-text" onSeeAll={() => {}} />
          {mockAnalysisResults.map((res) => (
            <TouchableOpacity key={res.id} style={styles.resultCard} activeOpacity={0.7}>
              <View style={[styles.resultIconBg, { backgroundColor: Colors.accent.teal + '15' }]}>
                <Ionicons name={res.icon as any} size={22} color={Colors.accent.teal} />
              </View>
              <View style={styles.resultInfo}>
                <View style={styles.resultTitleRow}>
                  <Text style={[Typography.bodyBold, { color: Colors.text.primary, flex: 1 }]} numberOfLines={1}>
                    {res.titre}
                  </Text>
                  {res.isNew && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                  )}
                </View>
                <Text style={[Typography.caption, { color: Colors.text.secondary, marginTop: 2 }]}>{res.medecinNom}</Text>
                <Text style={[Typography.caption, { color: Colors.text.tertiary, marginTop: 2 }]}>{formatDate(res.date)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
            </TouchableOpacity>
          ))}

          <View style={styles.spacer} />

          {/* Ordonnances */}
          <SectionHeader title="Ordonnances en cours" icon="medical" onSeeAll={() => {}} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {mockPrescriptions.map((pres) => (
              <TouchableOpacity key={pres.id} style={styles.prescriptionCard} activeOpacity={0.7}>
                <LinearGradient colors={Colors.gradients.greenCard} style={styles.prescriptionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <View style={styles.prescTopRow}>
                    <Ionicons name="medical" size={20} color="white" />
                    <View style={styles.prescBadge}>
                      <Text style={styles.prescBadgeText}>{pres.nbMedicaments} méd.</Text>
                    </View>
                  </View>
                  <Text style={styles.prescTitle} numberOfLines={2}>{pres.titre}</Text>
                  <Text style={styles.prescDoctor}>{pres.medecinNom}</Text>
                  <View style={styles.prescFooter}>
                    <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.prescExpiry}>
                      Expire le {pres.dateExpiration.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.spacer} />

          {/* Profil d'urgence */}
          <View style={styles.emergencyCard}>
            <LinearGradient colors={Colors.gradients.emergency} style={styles.emergencyGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.emergencyContent}>
                <Ionicons name="medical" size={28} color="white" />
                <View style={styles.emergencyInfo}>
                  <Text style={styles.emergencyTitle}>Profil d'urgence</Text>
                  <Text style={styles.emergencySubtitle}>
                    Groupe : {mockUser.iceGroupeSanguin} • Allergies : {mockUser.iceAllergies.join(', ')}
                  </Text>
                </View>
                <TouchableOpacity style={styles.qrButton}>
                  <Ionicons name="qr-code" size={22} color={Colors.status.error} />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginTop: 4,
  },
  bellButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    marginLeft: 16,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.status.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary.orange,
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchText: {
    color: Colors.text.tertiary,
    fontSize: 14,
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  // Quick Actions Grid
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    gap: 10,
  },
  quickItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickIconBg: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLabel: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  spacer: {
    height: 24,
  },
  bottomSpacer: {
    height: 20,
  },
  // Appointments
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  aptDateBadge: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.orange + '10',
    borderRadius: 14,
    paddingVertical: 8,
    marginRight: 12,
  },
  aptDateDay: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary.orange,
    textTransform: 'uppercase',
  },
  aptDateNum: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text.primary,
    lineHeight: 26,
  },
  aptDateMonth: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
  },
  aptInfo: {
    flex: 1,
  },
  aptMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  // Results
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  resultIconBg: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newBadge: {
    backgroundColor: Colors.status.new,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // Prescriptions
  horizontalScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  prescriptionCard: {
    width: 180,
    marginRight: 12,
    borderRadius: 18,
    overflow: 'hidden',
  },
  prescriptionGradient: {
    padding: 16,
    minHeight: 150,
    justifyContent: 'space-between',
  },
  prescTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prescBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  prescBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  prescTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  prescDoctor: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 4,
  },
  prescFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  prescExpiry: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  // Emergency Card
  emergencyCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  emergencyGradient: {
    padding: 18,
  },
  emergencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  emergencySubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 4,
  },
  qrButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
