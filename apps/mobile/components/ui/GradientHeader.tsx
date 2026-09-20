import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

interface GradientHeaderProps {
  userName: string;
  subtitle?: string;
  notificationCount?: number;
}

export const GradientHeader: React.FC<GradientHeaderProps> = ({ userName, subtitle, notificationCount = 0 }) => {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={Colors.gradients.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top + 16 }]}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[Typography.h1, styles.title]}>Bonjour, {userName} 👋</Text>
          {subtitle && <Text style={[Typography.body, styles.subtitle]}>{subtitle}</Text>}
        </View>
        <TouchableOpacity style={styles.bellButton}>
          <Ionicons name="notifications-outline" size={24} color={Colors.text.inverse} />
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...Colors.shadow.medium,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: Colors.text.inverse,
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  bellButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    marginLeft: 16,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.status.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary.orange,
  },
  badgeText: {
    color: Colors.text.inverse,
    fontSize: 10,
    fontWeight: 'bold',
  },
});
