import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

interface PrescriptionCardProps {
  title: string;
  doctorName: string;
  expiryDate: Date;
  medicationCount: number;
  onPress?: () => void;
}

export const PrescriptionCard: React.FC<PrescriptionCardProps> = ({
  title,
  doctorName,
  expiryDate,
  medicationCount,
  onPress,
}) => {
  const formattedExpiry = expiryDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name="medical" size={24} color={Colors.accent.purple} />
      </View>
      <View style={styles.content}>
        <Text style={[Typography.bodyBold, styles.title]} numberOfLines={1}>{title}</Text>
        <Text style={[Typography.caption, styles.subtitle]}>Dr. {doctorName}</Text>
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={Colors.text.tertiary} />
            <Text style={[Typography.caption, styles.metaText]}>Jusqu'au {formattedExpiry}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="flask-outline" size={14} color={Colors.text.tertiary} />
            <Text style={[Typography.caption, styles.metaText]}>{medicationCount} meds</Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    width: 280, // Fixed width for horizontal scrolling
    marginRight: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.purple + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: Colors.text.tertiary,
  },
});
