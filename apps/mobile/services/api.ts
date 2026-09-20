/**
 * Service API — Client HTTP pour communiquer avec le backend Santé CI
 * 
 * Gère les appels API avec token Bearer, le refresh automatique,
 * et le stockage sécurisé des tokens.
 */

// En mode offline/mock, on simule les réponses API
const API_BASE_URL = 'http://localhost:3001/api/v1';

// Stockage simple en mémoire (en production → expo-secure-store)
let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
}

export function getAccessToken() {
  return accessToken;
}

/**
 * Requête HTTP générique avec gestion du token et du refresh automatique
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string; details?: Record<string, string[]> } }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await response.json();

    // Si token expiré, tenter un refresh
    if (response.status === 401 && json.error?.code === 'TOKEN_EXPIRED' && refreshToken) {
      const refreshResult = await refreshAccessToken();
      if (refreshResult) {
        // Réessayer la requête originale avec le nouveau token
        headers['Authorization'] = `Bearer ${accessToken}`;
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
        return retryResponse.json();
      }
    }

    return json;
  } catch (error) {
    // Réseau indisponible — mode offline
    console.log('[API] Réseau indisponible, mode offline');
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Connexion au serveur impossible. Vérifiez votre connexion internet.',
      },
    };
  }
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const json = await response.json();
    if (json.success && json.data) {
      setTokens(json.data.accessToken, json.data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// === AUTH API ===

export const authApi = {
  register: (data: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    password: string;
    confirmPassword: string;
  }) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  login: (email: string, password: string) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),

  logout: () => apiRequest('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  }),
};

// === PATIENT API ===

export const patientApi = {
  getProfile: () => apiRequest('/patient/profile'),

  updateProfile: (data: Record<string, unknown>) => apiRequest('/patient/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  updateEmergency: (data: { iceGroupeSanguin?: string; iceAllergies?: string }) =>
    apiRequest('/patient/emergency', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getFamily: () => apiRequest('/patient/family'),

  addFamilyMember: (data: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  }) => apiRequest('/patient/family', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// === DOCUMENTS API ===

export interface AISection {
  titre: string;
  explication: string;
  valeur?: string;
  statut: 'normal' | 'attention' | 'info';
  note?: string;
}

export interface AIInterpretationResult {
  resume: string;
  sections: AISection[];
  disclaimer: string;
  processedAt: string;
}

export interface DocumentInterpretationResponse {
  documentId: string;
  documentTitre: string;
  documentType: string;
  medecin: string | null;
  interpretation: AIInterpretationResult;
}

export const documentsApi = {
  list: (page = 1, limit = 10, type?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (type) params.append('type', type);
    return apiRequest(`/documents?${params}`);
  },

  get: (id: string) => apiRequest(`/documents/${id}`),

  upload: (data: { titre: string; type: string }) => apiRequest('/documents', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  delete: (id: string) => apiRequest(`/documents/${id}`, { method: 'DELETE' }),

  /**
   * Interprète un document médical via l'IA Gemini.
   * Nécessite le consentement explicite de l'utilisateur AVANT l'appel.
   */
  interpret: (id: string, rawText?: string) =>
    apiRequest<DocumentInterpretationResponse>(`/documents/${id}/interpret`, {
      method: 'POST',
      body: JSON.stringify({ rawText }),
    }),
};


// === APPOINTMENTS API ===

export const appointmentsApi = {
  list: (status?: 'upcoming' | 'past', page = 1, limit = 10) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append('status', status);
    return apiRequest(`/appointments?${params}`);
  },

  create: (data: { medecinId: string; dateHeure: string; motif: string; cliniqueId: string }) =>
    apiRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  cancel: (id: string) => apiRequest(`/appointments/${id}/cancel`, { method: 'PUT' }),

  getAvailableSlots: (medecinId: string, date: string) =>
    apiRequest(`/appointments/available-slots?medecinId=${medecinId}&date=${date}`),
};

// === CLINICS API ===

export const clinicsApi = {
  list: (ville?: string, search?: string) => {
    const params = new URLSearchParams();
    if (ville) params.append('ville', ville);
    if (search) params.append('search', search);
    return apiRequest(`/clinics?${params}`);
  },

  get: (id: string) => apiRequest(`/clinics/${id}`),

  getDoctors: (clinicId: string, specialite?: string) => {
    const params = specialite ? `?specialite=${specialite}` : '';
    return apiRequest(`/clinics/${clinicId}/doctors${params}`);
  },
};

// === EPHEMERAL ACCESS API ===

export const ephemeralApi = {
  generate: () => apiRequest('/ephemeral/generate', { method: 'POST' }),

  validate: (codePinEphemere: string) => apiRequest('/ephemeral/validate', {
    method: 'POST',
    body: JSON.stringify({ codePinEphemere }),
  }),
};
