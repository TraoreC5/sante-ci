/**
 * Écran d'inscription — Santé CI
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

interface FormData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterScreen() {
  const [form, setForm] = useState<FormData>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '+225',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const { register, isLoading, loginOffline } = useAuth();
  const insets = useSafeAreaInsets();

  const updateField = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.nom.trim()) newErrors.nom = 'Nom requis';
    if (!form.prenom.trim()) newErrors.prenom = 'Prénom requis';
    if (!form.email.trim()) newErrors.email = 'Email requis';
    else if (!form.email.includes('@')) newErrors.email = 'Email invalide';
    if (!form.telephone || form.telephone.length < 10) newErrors.telephone = 'Numéro invalide';
    if (!form.password) newErrors.password = 'Mot de passe requis';
    else if (form.password.length < 6) newErrors.password = 'Minimum 6 caractères';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    const result = await register(form);
    if (!result.success) {
      Alert.alert(
        'Inscription impossible',
        result.error || 'Erreur inconnue',
        [
          { text: 'Réessayer', style: 'cancel' },
          { text: 'Mode démo', onPress: loginOffline },
        ]
      );
    }
  };

  const renderInput = (
    key: keyof FormData,
    label: string,
    icon: keyof typeof Ionicons.glyphMap,
    options?: {
      placeholder?: string;
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      autoCapitalize?: 'none' | 'sentences' | 'words';
      secureTextEntry?: boolean;
    }
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[Typography.captionBold, styles.label]}>{label}</Text>
      <View style={[styles.inputContainer, errors[key] && styles.inputError]}>
        <Ionicons name={icon} size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
        <TextInput
          style={[Typography.body, styles.input]}
          placeholder={options?.placeholder || ''}
          placeholderTextColor={Colors.text.tertiary}
          value={form[key]}
          onChangeText={(text) => updateField(key, text)}
          keyboardType={options?.keyboardType || 'default'}
          autoCapitalize={options?.autoCapitalize || 'sentences'}
          secureTextEntry={options?.secureTextEntry && !showPassword}
        />
        {options?.secureTextEntry && key === 'password' && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={Colors.text.tertiary}
            />
          </TouchableOpacity>
        )}
      </View>
      {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
    </View>
  );

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
          <Text style={[Typography.h1, styles.title]}>Créer un compte</Text>
          <Text style={[Typography.body, styles.subtitle]}>
            Rejoignez Santé CI pour sécuriser votre dossier médical
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              {renderInput('nom', 'NOM', 'person-outline', {
                placeholder: 'Koné',
                autoCapitalize: 'words',
              })}
            </View>
            <View style={styles.halfWidth}>
              {renderInput('prenom', 'PRÉNOM', 'person-outline', {
                placeholder: 'Amadou',
                autoCapitalize: 'words',
              })}
            </View>
          </View>

          {renderInput('email', 'EMAIL', 'mail-outline', {
            placeholder: 'amadou.kone@email.ci',
            keyboardType: 'email-address',
            autoCapitalize: 'none',
          })}

          {renderInput('telephone', 'TÉLÉPHONE', 'call-outline', {
            placeholder: '+2250101020304',
            keyboardType: 'phone-pad',
          })}

          {renderInput('password', 'MOT DE PASSE', 'lock-closed-outline', {
            placeholder: 'Minimum 6 caractères',
            secureTextEntry: true,
          })}

          {renderInput('confirmPassword', 'CONFIRMER LE MOT DE PASSE', 'lock-closed-outline', {
            placeholder: 'Retapez votre mot de passe',
            secureTextEntry: true,
          })}

          {/* Register button */}
          <TouchableOpacity
            style={styles.registerButton}
            activeOpacity={0.85}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <LinearGradient
              colors={Colors.gradients.header}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.registerGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="white" style={styles.btnIcon} />
                  <Text style={[Typography.button, { color: 'white', fontSize: 17 }]}>
                    S'inscrire
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={[Typography.body, { color: Colors.text.secondary }]}>
            Déjà inscrit ?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={[Typography.bodyBold, { color: Colors.primary.orange }]}>Se connecter</Text>
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
    marginBottom: 28,
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
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
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
  registerButton: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 8,
    ...Colors.shadow.light,
  },
  registerGradient: {
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
