import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

interface AnalysisResultCardProps {
  title: string;
  doctorName: string;
  date: Date;
  isNew?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}

export const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({
  title,
  doctorName,
  date,
  isNew = false,
  icon = 'document-text',
  onPress,
}) => {
  const formattedDate = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color={Colors.accent.teal} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[Typography.bodyBold, styles.title]} numberOfLines={1}>{title}</Text>
          {isNew && (
            <Badge label="Nouveau" color={Colors.accent.purple + '20'} textColor={Colors.accent.purple} />
          )}
        </View>
        <Text style={[Typography.caption, styles.subtitle]}>Prescrit par {doctorName}</Text>
        <Text style={[Typography.caption, styles.date]}>{formattedDate}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.teal + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    marginRight: 8,
  },
  subtitle: {
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  date: {
    color: Colors.text.tertiary,
  },
});
