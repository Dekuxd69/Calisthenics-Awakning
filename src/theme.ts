export const colors = {
  bg: '#0A0D18',
  surface: '#131829',
  surfaceHigh: '#1B2238',
  border: '#262E48',
  text: '#F2F4FA',
  textDim: '#A3ACC6',
  textFaint: '#8590AE',
  primary: '#8B5CF6',
  primarySoft: '#2A1F4D',
  accent: '#22D3EE',
  success: '#34D399',
  successSoft: '#123A30',
  warning: '#FBBF24',
  danger: '#F87171',
  gold: '#FBBF24',
};

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const type = {
  display: { fontSize: 30, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5 },
  h1: { fontSize: 24, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.3 },
  h2: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text, lineHeight: 21 },
  dim: { fontSize: 14, color: colors.textDim, lineHeight: 20 },
  small: { fontSize: 12, color: colors.textFaint, fontWeight: '600' as const, letterSpacing: 0.6 },
};
