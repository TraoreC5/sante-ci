/**
 * Écran d'accueil / Onboarding — Santé CI
 * 
 * 3 slides présentant les fonctionnalités principales,
 * puis boutons Connexion / Inscription / Mode démo.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    icon: 'shield-checkmark' as const,
    title: 'Votre santé,\nen sécurité',
    description: 'Stockez vos ordonnances, résultats d\'examens et documents médicaux de manière chiffrée et sécurisée.',
    gradient: Colors.gradients.header,
    accentIcon: 'lock-closed' as const,
  },
  {
    id: '2',
    icon: 'calendar' as const,
    title: 'Rendez-vous\nsimplifiés',
    description: 'Prenez rendez-vous avec les meilleures cliniques de Côte d\'Ivoire en quelques taps.',
    gradient: Colors.gradients.greenCard,
    accentIcon: 'medical' as const,
  },
  {
    id: '3',
    icon: 'qr-code' as const,
    title: 'Partage\néphémère',
    description: 'Partagez votre dossier médical avec un médecin via un code PIN temporaire ou un QR code.',
    gradient: Colors.gradients.tealCard,
    accentIcon: 'time' as const,
  },
];

export default function WelcomeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { loginOffline } = useAuth();

  const handleDemoMode = () => {
    loginOffline();
  };

  const renderSlide = ({ item, index }: { item: typeof slides[0]; index: number }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.slide, { width }]}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale }], opacity }]}>
          <LinearGradient
            colors={item.gradient}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={item.icon} size={72} color="white" />
          </LinearGradient>
          <View style={styles.accentBadge}>
            <Ionicons name={item.accentIcon} size={20} color={Colors.primary.orange} />
          </View>
        </Animated.View>
        <Animated.View style={{ opacity }}>
          <Text style={[Typography.h1, styles.slideTitle]}>{item.title}</Text>
          <Text style={[Typography.body, styles.slideDescription]}>{item.description}</Text>
        </Animated.View>
      </View>
    );
  };

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 28, 8],
          extrapolate: 'clamp',
        });
        const dotOpacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity: dotOpacity,
                backgroundColor: Colors.primary.orange,
              },
            ]}
          />
        );
      })}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Logo area */}
      <View style={styles.logoArea}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={Colors.gradients.header}
            style={styles.logoBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="heart" size={28} color="white" />
          </LinearGradient>
          <Text style={[Typography.h3, styles.logoText]}>Santé CI</Text>
        </View>
      </View>

      {/* Slides */}
      <View style={styles.slidesContainer}>
        <Animated.FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setActiveIndex(index);
          }}
        />
        {renderDots()}
      </View>

      {/* Action buttons */}
      <View style={[styles.actionsContainer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={() => router.push('/(auth)/register')}
        >
          <LinearGradient
            colors={Colors.gradients.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButtonGradient}
          >
            <Ionicons name="person-add" size={20} color="white" style={styles.btnIcon} />
            <Text style={[Typography.button, styles.primaryButtonText]}>Créer un compte</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={[Typography.button, styles.secondaryButtonText]}>Se connecter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.demoButton}
          activeOpacity={0.7}
          onPress={handleDemoMode}
        >
          <Ionicons name="eye-outline" size={16} color={Colors.text.tertiary} style={styles.btnIcon} />
          <Text style={[Typography.caption, styles.demoButtonText]}>Mode démonstration</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  logoArea: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  slidesContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 32,
    position: 'relative',
  },
  iconGradient: {
    width: 140,
    height: 140,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...Colors.shadow.medium,
  },
  accentBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...Colors.shadow.light,
  },
  slideTitle: {
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  slideDescription: {
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actionsContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 28,
    overflow: 'hidden',
    ...Colors.shadow.light,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 17,
  },
  secondaryButton: {
    backgroundColor: Colors.surface.card,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    color: Colors.text.primary,
    fontSize: 17,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  demoButtonText: {
    color: Colors.text.tertiary,
  },
  btnIcon: {
    marginRight: 8,
  },
});
