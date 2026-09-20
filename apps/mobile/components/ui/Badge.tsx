import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../constants/typography';

interface BadgeProps {
  label: string;
  color: string;
  textColor: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const Badge: React.FC<BadgeProps> = ({ label, color, textColor, icon }) => {
  return (
    <View style={[styles.container, { backgroundColor: color }]}>
      {icon && <Ionicons name={icon} size={12} color={textColor} style={styles.icon} />}
      <Text style={[Typography.captionBold, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
});
