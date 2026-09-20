import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

interface AppointmentCardProps {
  doctorName: string;
  specialty: string;
  clinic: string;
  date: Date;
  status: string;
  onCancel?: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  doctorName,
  specialty,
  clinic,
  date,
  status,
  onCancel,
}) => {
  const formattedDate = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const formattedTime = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <Card style={styles.card}>
      <View style={styles.borderLeft} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={Typography.h3}>{doctorName}</Text>
            <Text style={[Typography.body, styles.specialty]}>{specialty}</Text>
          </View>
          <Badge 
            label={status} 
            color={Colors.primary.greenLight + '20'} 
            textColor={Colors.primary.greenDark} 
          />
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={16} color={Colors.text.tertiary} />
            <Text style={[Typography.caption, styles.detailText]}>{clinic}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.text.tertiary} />
            <Text style={[Typography.caption, styles.detailText]}>{formattedDate} à {formattedTime}</Text>
          </View>
        </View>

        {onCancel && (
          <View style={styles.actions}>
            <Button title="Annuler" variant="outline" size="small" onPress={onCancel} />
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
  },
  borderLeft: {
    width: 6,
    backgroundColor: Colors.primary.green,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingLeft: 22,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  specialty: {
    color: Colors.text.secondary,
    marginTop: 2,
  },
  detailsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: Colors.text.secondary,
  },
  actions: {
    alignItems: 'flex-end',
  },
});
