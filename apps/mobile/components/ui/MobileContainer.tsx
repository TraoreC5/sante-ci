/**
 * MobileContainer — Santé CI
 * 
 * Wraps the entire app in a mobile-width container on web
 * to give an authentic app feel rather than a stretched website.
 */

import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Colors } from '../../constants/colors';

const MAX_MOBILE_WIDTH = 430; // iPhone 15 Pro Max width

interface MobileContainerProps {
  children: React.ReactNode;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children }) => {
  const { width } = useWindowDimensions();

  // On native or narrow screens, just render children directly
  if (Platform.OS !== 'web' || width <= MAX_MOBILE_WIDTH + 40) {
    return <>{children}</>;
  }

  return (
    <View style={styles.webWrapper}>
      <View style={[styles.mobileFrame, { maxWidth: MAX_MOBILE_WIDTH }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileFrame: {
    flex: 1,
    width: '100%',
    backgroundColor: Colors.surface.background,
    overflow: 'hidden',
    // Subtle shadow to make the frame pop
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
});
