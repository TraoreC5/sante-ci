import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: string[];
  onPress?: () => void;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  gradient,
  onPress,
  elevated = true,
}) => {
  const scale = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const CardContent = () => (
    <View style={[styles.inner, !gradient && { backgroundColor: Colors.surface.card }]}>
      {gradient ? (
        <LinearGradient colors={gradient} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {children}
        </LinearGradient>
      ) : (
        children
      )}
    </View>
  );

  const cardStyle = [
    styles.container,
    elevated && Colors.shadow.light,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[cardStyle, { transform: [{ scale }] }]}>
          <CardContent />
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      <CardContent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 8,
  },
  inner: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
  },
});
