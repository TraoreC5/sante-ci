import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

interface EmergencyProfileCardProps {
  bloodType: string;
  allergies: string[];
  onShowQR?: () => void;
}

export const EmergencyProfileCard: React.FC<EmergencyProfileCardProps> = ({
  bloodType,
  allergies,
  onShowQR,
}) => {
  return (
    <Card gradient={Colors.gradients.emergency} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="heart" size={24} color={Colors.text.inverse} />
          <Text style={[Typography.h3, styles.title]}>Profil d'Urgence (ICE)</Text>
        </View>
        <TouchableOpacity style={styles.qrButton} onPress={onShowQR}>
          <Ionicons name="qr-code" size={20} color={Colors.status.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.bloodTypeContainer}>
          <Text style={[Typography.caption, styles.label]}>Groupe Sanguin</Text>
          <Text style={[Typography.h1, styles.bloodType]}>{bloodType}</Text>
        </View>

        <View style={styles.allergiesContainer}>
          <Text style={[Typography.caption, styles.label]}>Allergies Connues</Text>
          <View style={styles.badgesWrapper}>
            {allergies.length > 0 ? (
              allergies.map((allergy, index) => (
                <View key={index} style={styles.allergyBadge}>
                  <Text style={[Typography.captionBold, styles.allergyText]}>{allergy}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noAllergies}>Aucune allergie connue</Text>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 16,
    ...Colors.shadow.colored(Colors.status.error),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: Colors.text.inverse,
  },
  qrButton: {
    backgroundColor: Colors.text.inverse,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bloodTypeContainer: {
    flex: 1,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  bloodType: {
    color: Colors.text.inverse,
    fontSize: 36,
  },
  allergiesContainer: {
    flex: 2,
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  allergyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  allergyText: {
    color: Colors.text.inverse,
  },
  noAllergies: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
});
