/**
 * Écran de connexion — Santé CI
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { login, isLoading, loginOffline } = useAuth();
  const insets = useSafeAreaInsets();

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) newErrors.email = 'Email requis';
    else if (!email.includes('@')) newErrors.email = 'Email invalide';
    if (!password) newErrors.password = 'Mot de passe requis';
    else if (password.length < 6) newErrors.password = 'Minimum 6 caractères';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    const result = await login(email, password);
    if (!result.success) {
      // Si le serveur n'est pas joignable, proposer le mode démo
      Alert.alert(
        'Connexion impossible',
        result.error || 'Erreur inconnue',
        [
          { text: 'Réessayer', style: 'cancel' },
          {
            text: 'Mode démo',
            onPress: loginOffline,
          },
        ]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSmall}>
            <LinearGradient
              colors={Colors.gradients.header}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="heart" size={24} color="white" />
            </LinearGradient>
          </View>
          <Text style={[Typography.h1, styles.title]}>Bon retour !</Text>
          <Text style={[Typography.body, styles.subtitle]}>
            Connectez-vous pour accéder à votre dossier médical
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={[Typography.captionBold, styles.label]}>EMAIL</Text>
            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
              <Ionicons name="mail-outline" size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
              <TextInput
                style={[Typography.body, styles.input]}
                placeholder="amadou.kone@email.ci"
                placeholderTextColor={Colors.text.tertiary}
                value={email}
                onChangeText={(text) => { setEmail(text); setErrors((e) => ({ ...e, email: undefined })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={[Typography.captionBold, styles.label]}>MOT DE PASSE</Text>
            <View style={[styles.inputContainer, errors.password && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
              <TextInput
                style={[Typography.body, styles.input]}
                placeholder="Votre mot de passe"
                placeholderTextColor={Colors.text.tertiary}
                value={password}
                onChangeText={(text) => { setPassword(text); setErrors((e) => ({ ...e, password: undefined })); }}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={Colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Forgot password */}
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={[Typography.bodyBold, { color: Colors.primary.orange }]}>
              Mot de passe oublié ?
            </Text>
          </TouchableOpacity>

          {/* Login button */}
          <TouchableOpacity
            style={styles.loginButton}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <LinearGradient
              colors={Colors.gradients.header}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={22} color="white" style={styles.btnIcon} />
                  <Text style={[Typography.button, { color: 'white', fontSize: 17 }]}>
                    Se connecter
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={[Typography.body, { color: Colors.text.secondary }]}>
            Pas encore de compte ?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
            <Text style={[Typography.bodyBold, { color: Colors.primary.orange }]}>S'inscrire</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...Colors.shadow.light,
    marginBottom: 16,
  },
  header: {
    marginBottom: 32,
  },
  logoSmall: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    color: Colors.text.tertiary,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 56,
  },
  inputError: {
    borderColor: Colors.status.error,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: Colors.text.primary,
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    color: Colors.status.error,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    marginTop: 2,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  loginButton: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 8,
    ...Colors.shadow.light,
  },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  btnIcon: {
    marginRight: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 24,
  },
});
