/**
 * Écran Profil — Santé CI
 * 
 * Informations personnelles, profil ICE, paramètres,
 * et gestion du compte.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
import { mockUser } from '../../data/mockData';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  iconColor?: string;
  onPress?: () => void;
  danger?: boolean;
}

const MenuItem = ({ icon, label, value, iconColor, onPress, danger }: MenuItemProps) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIconBg, { backgroundColor: (iconColor || Colors.primary.orange) + '15' }]}>
      <Ionicons name={icon} size={20} color={iconColor || Colors.primary.orange} />
    </View>
    <View style={styles.menuContent}>
      <Text style={[Typography.body, { color: danger ? Colors.status.error : Colors.text.primary }]}>
        {label}
      </Text>
      {value && (
        <Text style={[Typography.caption, { color: Colors.text.tertiary }]} numberOfLines={1}>
          {value}
        </Text>
      )}
    </View>
    <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
  </TouchableOpacity>
);

const SectionTitle = ({ title }: { title: string }) => (
  <Text style={[Typography.label, styles.sectionTitle]}>{title}</Text>
);

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, isOfflineMode } = useAuth();

  const displayUser = user || {
    nom: mockUser.nom,
    prenom: mockUser.prenom,
    email: 'amadou.kone@email.ci',
    telephone: '+2250101020304',
    numeroCmu: mockUser.numeroCmu,
    iceGroupeSanguin: mockUser.iceGroupeSanguin,
    iceAllergies: (mockUser.iceAllergies as string[]).join(', '),
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with profile */}
        <LinearGradient
          colors={Colors.gradients.tealCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: (Platform.OS === 'web' ? 16 : insets.top) + 16 }]}
        >
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(displayUser.prenom?.[0] || 'A')}{(displayUser.nom?.[0] || 'K')}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[Typography.h2, { color: 'white' }]}>
                {displayUser.prenom} {displayUser.nom}
              </Text>
              <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.8)' }]}>
                {displayUser.email}
              </Text>
              {isOfflineMode && (
                <View style={styles.offlineBadge}>
                  <Ionicons name="cloud-offline" size={12} color={Colors.status.warning} />
                  <Text style={styles.offlineBadgeText}>Mode démo</Text>
                </View>
              )}
            </View>
          </View>

          {/* Quick stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>RDV à venir</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4</Text>
              <Text style={styles.statLabel}>Documents</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>O+</Text>
              <Text style={styles.statLabel}>Groupe</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Profil ICE */}
          <View style={styles.iceCard}>
            <View style={styles.iceHeader}>
              <LinearGradient
                colors={Colors.gradients.emergency}
                style={styles.iceIconBg}
              >
                <Ionicons name="medical" size={20} color="white" />
              </LinearGradient>
              <View>
                <Text style={[Typography.bodyBold, { color: Colors.text.primary }]}>
                  Profil d'urgence (ICE)
                </Text>
                <Text style={[Typography.caption, { color: Colors.text.tertiary }]}>
                  Accessible sans authentification
                </Text>
              </View>
            </View>
            <View style={styles.iceDetails}>
              <View style={styles.iceRow}>
                <Text style={[Typography.caption, { color: Colors.text.tertiary }]}>Groupe sanguin</Text>
                <Text style={[Typography.bodyBold, { color: Colors.text.primary }]}>
                  {displayUser.iceGroupeSanguin || 'Non renseigné'}
                </Text>
              </View>
              <View style={styles.iceDivider} />
              <View style={styles.iceRow}>
                <Text style={[Typography.caption, { color: Colors.text.tertiary }]}>Allergies</Text>
                <Text style={[Typography.bodyBold, { color: Colors.status.error }]}>
                  {displayUser.iceAllergies || 'Aucune'}
                </Text>
              </View>
            </View>
          </View>

          {/* Informations personnelles */}
          <SectionTitle title="Informations personnelles" />
          <View style={styles.menuSection}>
            <MenuItem icon="person" label="Nom complet" value={`${displayUser.prenom} ${displayUser.nom}`} iconColor={Colors.accent.teal} />
            <MenuItem icon="mail" label="Email" value={displayUser.email} iconColor={Colors.accent.teal} />
            <MenuItem icon="call" label="Téléphone" value={displayUser.telephone} iconColor={Colors.accent.teal} />
            <MenuItem icon="card" label="N° CMU" value={displayUser.numeroCmu || 'Non renseigné'} iconColor={Colors.accent.teal} />
          </View>

          {/* Sécurité */}
          <SectionTitle title="Sécurité" />
          <View style={styles.menuSection}>
            <MenuItem icon="lock-closed" label="Changer le mot de passe" iconColor={Colors.accent.purple} />
            <MenuItem icon="keypad" label="Code PIN" value="Configuré" iconColor={Colors.accent.purple} />
            <MenuItem icon="finger-print" label="Biométrie" value="Désactivée" iconColor={Colors.accent.purple} />
          </View>

          {/* Famille */}
          <SectionTitle title="Profils familiaux" />
          <View style={styles.menuSection}>
            <MenuItem icon="people" label="Gérer les profils" value="0 profil" iconColor={Colors.primary.green} />
            <MenuItem icon="person-add" label="Ajouter un membre" iconColor={Colors.primary.green} />
          </View>

          {/* Partage éphémère */}
          <SectionTitle title="Partage éphémère" />
          <View style={styles.menuSection}>
            <MenuItem icon="qr-code" label="Générer un accès" iconColor={Colors.accent.gold} />
            <MenuItem icon="time" label="Historique des partages" iconColor={Colors.accent.gold} />
          </View>

          {/* Déconnexion */}
          <View style={[styles.menuSection, { marginTop: 24 }]}>
            <MenuItem
              icon="log-out"
              label="Se déconnecter"
              iconColor={Colors.status.error}
              danger
              onPress={handleLogout}
            />
          </View>

          <Text style={[Typography.caption, styles.version]}>Santé CI v1.0.0</Text>

          <View style={{ height: 100 }} />
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
  header: {
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  offlineBadgeText: {
    color: Colors.status.warning,
    fontSize: 10,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    padding: 16,
    paddingTop: 20,
  },
  iceCard: {
    backgroundColor: Colors.surface.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.status.error + '20',
    ...Colors.shadow.light,
  },
  iceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iceIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iceDetails: {
    backgroundColor: Colors.surface.background,
    borderRadius: 12,
    padding: 14,
  },
  iceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iceDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  sectionTitle: {
    color: Colors.text.tertiary,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuSection: {
    backgroundColor: Colors.surface.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    ...Colors.shadow.light,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
  },
  version: {
    textAlign: 'center',
    color: Colors.text.tertiary,
    marginTop: 16,
  },
});
