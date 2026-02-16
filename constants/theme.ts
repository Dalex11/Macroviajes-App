export const COLORS = {
  primary: '#1391cb',
  secondary: '#ec6f35',
  white: '#FFFFFF',
  black: '#000000',
  text: '#1a1a1a',
  textLight: '#666666',
  background: '#F8F9FA',
  border: '#E0E0E0',
  error: '#DC3545',
  success: '#28A745',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const TYPOGRAPHY = {
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
} as const;
