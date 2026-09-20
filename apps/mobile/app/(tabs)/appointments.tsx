/**
 * Écran Rendez-vous — Santé CI
 * 
 * Liste des rendez-vous (à venir et passés) avec filtrage,
 * cards détaillées et bouton de prise de RDV.
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { mockAppointments } from '../../data/mockData';

type TabFilter = 'upcoming' | 'past';

// Extended mock data
const allAppointments = [
  ...mockAppointments.map((a) => ({
    ...a,
    statutPaiement: 'PAYE_MOBILE_MONEY' as string,
  })),
  {
    id: 'rdv-003',
    medecinNom: 'Dr. Ibrahim Diallo',
    specialite: 'Dermatologie',
    clinique: 'Polyclinique Internationale Ste Anne-Marie',
    dateHeure: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    motif: 'Consultation dermatologique',
    statut: 'TERMINE',
    statutPaiement: 'PAYE_MOBILE_MONEY',
  },
  {
    id: 'rdv-004',
    medecinNom: 'Dr. Fatou Bamba',
    specialite: 'Ophtalmologie',
    clinique: 'Centre Hospitalier de Cocody',
    dateHeure: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    motif: 'Examen de la vue',
    statut: 'TERMINE',
    statutPaiement: 'PAYE_MOBILE_MONEY',
  },
];

const getStatusConfig = (statut: string) => {
  switch (statut) {
    case 'PLANIFIE':
      return { label: 'Planifié', color: Colors.status.info, icon: 'time' as const };
    case 'TERMINE':
      return { label: 'Terminé', color: Colors.status.success, icon: 'checkmark-circle' as const };
    case 'ANNULE':
      return { label: 'Annulé', color: Colors.status.error, icon: 'close-circle' as const };
    default:
      return { label: statut, color: Colors.text.tertiary, icon: 'help-circle' as const };
  }
};

export default function AppointmentsScreen() {
  const [activeTab, setActiveTab] = useState<TabFilter>('upcoming');
  const insets = useSafeAreaInsets();

  const now = new Date();
  const filteredAppointments = allAppointments.filter((a) => {
    if (activeTab === 'upcoming') {
      return a.dateHeure >= now && a.statut === 'PLANIFIE';
    }
    return a.dateHeure < now || a.statut !== 'PLANIFIE';
  });

  const formatDate = (date: Date) => {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return {
      day: dayNames[date.getDay()],
      date: date.getDate(),
      month: monthNames[date.getMonth()],
      time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
    };
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradients.greenCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: (Platform.OS === 'web' ? 16 : insets.top) + 16 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={[Typography.h2, styles.headerTitle]}>Rendez-vous</Text>
            <Text style={[Typography.caption, styles.headerSubtitle]}>
              {filteredAppointments.length} rendez-vous
            </Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={24} color={Colors.primary.green} />
          </TouchableOpacity>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text
              style={[
                Typography.captionBold,
                styles.tabText,
                activeTab === 'upcoming' && styles.tabTextActive,
              ]}
            >
              À venir
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'past' && styles.tabActive]}
            onPress={() => setActiveTab('past')}
          >
            <Text
              style={[
                Typography.captionBold,
                styles.tabText,
                activeTab === 'past' && styles.tabTextActive,
              ]}
            >
              Passés
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Appointments list */}
      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const dateInfo = formatDate(item.dateHeure);
          const statusConfig = getStatusConfig(item.statut);

          return (
            <TouchableOpacity style={styles.appointmentCard} activeOpacity={0.7}>
              {/* Date badge */}
              <View style={styles.dateBadge}>
                <Text style={styles.dateDay}>{dateInfo.day}</Text>
                <Text style={styles.dateNumber}>{dateInfo.date}</Text>
                <Text style={styles.dateMonth}>{dateInfo.month}</Text>
              </View>

              {/* Info */}
              <View style={styles.appointmentInfo}>
                <Text style={[Typography.bodyBold, { color: Colors.text.primary }]}>
                  {item.medecinNom}
                </Text>
                <Text style={[Typography.caption, { color: Colors.text.secondary, marginTop: 2 }]}>
                  {item.specialite}
                </Text>
                <View style={styles.appointmentMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="location" size={12} color={Colors.text.tertiary} />
                    <Text style={[Typography.caption, { color: Colors.text.tertiary }]} numberOfLines={1}>
                      {item.clinique}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time" size={12} color={Colors.text.tertiary} />
                    <Text style={[Typography.caption, { color: Colors.text.tertiary }]}>
                      {dateInfo.time}
                    </Text>
                  </View>
                </View>
                <View style={styles.statusRow}>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '15' }]}>
                    <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </Text>
                  </View>
                  {item.statut === 'PLANIFIE' && (
                    <TouchableOpacity style={styles.cancelButton}>
                      <Text style={[Typography.caption, { color: Colors.status.error, fontWeight: '700' }]}>
                        Annuler
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={56} color={Colors.text.tertiary} />
            </View>
            <Text style={[Typography.h3, { color: Colors.text.secondary }]}>
              {activeTab === 'upcoming' ? 'Aucun rendez-vous à venir' : 'Aucun rendez-vous passé'}
            </Text>
            <Text style={[Typography.body, { color: Colors.text.tertiary, textAlign: 'center' }]}>
              {activeTab === 'upcoming'
                ? 'Prenez un rendez-vous avec un médecin'
                : 'Vos rendez-vous passés apparaîtront ici'}
            </Text>
          </View>
        }
      />

      {/* FAB for new appointment */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <LinearGradient
          colors={Colors.gradients.greenCard}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  header: {
    paddingBottom: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerTitle: {
    color: 'white',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 0,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: 'white',
  },
  tabText: {
    color: 'rgba(255,255,255,0.8)',
  },
  tabTextActive: {
    color: Colors.primary.green,
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Colors.shadow.light,
  },
  dateBadge: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.green + '10',
    borderRadius: 14,
    paddingVertical: 8,
    marginRight: 14,
  },
  dateDay: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary.green,
    textTransform: 'uppercase',
  },
  dateNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text.primary,
    lineHeight: 28,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentMeta: {
    marginTop: 6,
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.status.error + '30',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary.green + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 28,
    shadowColor: Colors.primary.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
