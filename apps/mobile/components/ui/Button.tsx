import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  size = 'medium',
  loading = false,
}) => {
  const scale = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: Colors.surface.card, textColor: Colors.text.primary, border: true };
      case 'danger':
        return { backgroundColor: Colors.status.error, textColor: Colors.text.inverse };
      case 'outline':
        return { backgroundColor: 'transparent', textColor: Colors.primary.orange, border: true, borderColor: Colors.primary.orange };
      case 'primary':
      default:
        return { textColor: Colors.text.inverse };
    }
  };

  const vStyles = getVariantStyles();

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={vStyles.textColor} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === 'small' ? 16 : 20} color={vStyles.textColor} style={styles.icon} />}
          <Text style={[Typography.button, { color: vStyles.textColor, fontSize: size === 'small' ? 14 : 16 }]}>{title}</Text>
        </>
      )}
    </>
  );

  const buttonStyle = [
    styles.container,
    size === 'small' && styles.small,
    size === 'large' && styles.large,
    vStyles.border && { borderWidth: 1, borderColor: vStyles.borderColor || Colors.text.tertiary },
    !vStyles.border && vStyles.backgroundColor && { backgroundColor: vStyles.backgroundColor },
    variant === 'primary' && Colors.shadow.light,
  ];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={loading}
    >
      <Animated.View style={[buttonStyle, { transform: [{ scale }] }]}>
        {variant === 'primary' ? (
          <LinearGradient
            colors={Colors.gradients.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            {content}
          </LinearGradient>
        ) : (
          content
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  icon: {
    marginRight: 8,
  },
});
