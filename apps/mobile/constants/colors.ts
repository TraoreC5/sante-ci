export const Colors = {
  // Couleurs principales (inspirées du drapeau ivoirien)
  primary: {
    orange: '#FF6B35',      // Orange vif
    orangeLight: '#FF8C5A',
    orangeDark: '#E85520',
    green: '#00A86B',        // Vert émeraude
    greenLight: '#2EC486',
    greenDark: '#008C59',
  },
  // Accents modernes
  accent: {
    teal: '#0891B2',
    coral: '#F97068',
    purple: '#8B5CF6',
    gold: '#F59E0B',
  },
  // Surfaces et arrière-plans
  surface: {
    background: '#F8FAFC',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  // Texte
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    tertiary: '#94A3B8',
    inverse: '#FFFFFF',
    link: '#0891B2',
  },
  // Statuts
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    new: '#8B5CF6',
  },
  // Gradients (as arrays for LinearGradient)
  gradients: {
    header: ['#FF6B35', '#FF8C5A', '#FFA07A'],
    greenCard: ['#00A86B', '#2EC486'],
    tealCard: ['#0891B2', '#06B6D4'],
    purpleCard: ['#8B5CF6', '#A78BFA'],
    warmSunset: ['#FF6B35', '#F97068'],
    emergency: ['#EF4444', '#F87171'],
  },
  // Ombres
  shadow: {
    light: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    medium: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 },
    heavy: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 },
    colored: (color: string) => ({ shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }),
  },
};
