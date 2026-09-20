/**
 * Contexte d'authentification — Santé CI Mobile
 * 
 * Gère l'état d'authentification global de l'application.
 * En mode offline (pas de backend), utilise des données mock.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi, setTokens, clearTokens } from '../services/api';
import { mockUser } from '../data/mockData';

interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  numeroCmu?: string | null;
  dateNaissance?: string | null;
  iceGroupeSanguin?: string | null;
  iceAllergies?: string | null;
  isBiometricEnabled: boolean;
  hasPinSetup: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOfflineMode: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    password: string;
    confirmPassword: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loginOffline: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isOfflineMode: false,
  });

  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await authApi.login(email, password);

      if (result.success && result.data) {
        const data = result.data as { accessToken: string; refreshToken: string; user: User };
        setTokens(data.accessToken, data.refreshToken);
        setState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          isOfflineMode: false,
        });
        return { success: true };
      }

      setState((prev) => ({ ...prev, isLoading: false }));
      return {
        success: false,
        error: (result.error as any)?.message || 'Erreur de connexion',
      };
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Connexion au serveur impossible.' };
    }
  }, []);

  const register = useCallback(async (data: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    password: string;
    confirmPassword: string;
  }) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await authApi.register(data);

      if (result.success && result.data) {
        const respData = result.data as { accessToken: string; refreshToken: string; user: User };
        setTokens(respData.accessToken, respData.refreshToken);
        setState({
          user: respData.user,
          isAuthenticated: true,
          isLoading: false,
          isOfflineMode: false,
        });
        return { success: true };
      }

      setState((prev) => ({ ...prev, isLoading: false }));
      return {
        success: false,
        error: (result.error as any)?.message || 'Erreur lors de l\'inscription',
      };
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Connexion au serveur impossible.' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {}
    clearTokens();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isOfflineMode: false,
    });
  }, []);

  // Mode offline avec données mock — pour preview sans backend
  const loginOffline = useCallback(() => {
    setState({
      user: {
        id: mockUser.id,
        nom: mockUser.nom,
        prenom: mockUser.prenom,
        email: 'amadou.kone@email.ci',
        telephone: '+2250101020304',
        numeroCmu: mockUser.numeroCmu,
        iceGroupeSanguin: mockUser.iceGroupeSanguin,
        iceAllergies: (mockUser.iceAllergies as string[]).join(', '),
        isBiometricEnabled: false,
        hasPinSetup: false,
        createdAt: new Date().toISOString(),
      },
      isAuthenticated: true,
      isLoading: false,
      isOfflineMode: true,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, loginOffline }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
