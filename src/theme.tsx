import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import type { ThemeMode } from './lib/state';

export interface Palette {
  bg: string;
  surface: string;
  surfaceHigh: string;
  border: string;
  text: string;
  textDim: string;
  textFaint: string;
  /** Lime, used as a fill. */
  primary: string;
  /** Lime-family colour that stays readable as text or an icon on the background. */
  primaryText: string;
  /** Text and icons drawn on top of a lime fill. */
  onPrimary: string;
  primarySoft: string;
  success: string;
  warning: string;
  danger: string;
  dangerSoft: string;
  overlay: string;
  /** Locked / inactive circles. */
  muted: string;
  mutedEdge: string;
}

export const LIME = '#C6F432';
export const LIME_DEEP = '#8DB814';

export const DARK: Palette = {
  bg: '#0A0A0A',
  surface: '#161616',
  surfaceHigh: '#212121',
  border: '#262626',
  text: '#FFFFFF',
  textDim: '#A3A3A3',
  textFaint: '#7C7C7C',
  primary: LIME,
  primaryText: LIME,
  onPrimary: '#0A0A0A',
  primarySoft: '#232B0E',
  success: LIME,
  warning: '#FFB020',
  danger: '#FF5F57',
  dangerSoft: '#2A1514',
  overlay: 'rgba(0,0,0,0.78)',
  muted: '#2A2A2A',
  mutedEdge: '#1C1C1C',
};

export const LIGHT: Palette = {
  bg: '#F3F3EF',
  surface: '#FFFFFF',
  surfaceHigh: '#ECECE6',
  border: '#E3E3DC',
  text: '#0A0A0A',
  textDim: '#4A4A4A',
  textFaint: '#6F6F6F',
  primary: LIME,
  primaryText: '#4C6B00',
  onPrimary: '#0A0A0A',
  primarySoft: '#EEF9CF',
  success: '#4C6B00',
  warning: '#B26A00',
  danger: '#D93025',
  dangerSoft: '#FDECEA',
  overlay: 'rgba(10,10,10,0.45)',
  muted: '#E2E2DB',
  mutedEdge: '#CACAC2',
};

export const radius = { sm: 12, md: 18, lg: 26, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

/** Outfit font families. Custom fonts ignore fontWeight on Android, so pick a family instead. */
export const ff = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
  black: 'Outfit_800ExtraBold',
};

export const font = {
  hero: { fontSize: 44, fontFamily: ff.semibold, letterSpacing: -1.5 },
  display: { fontSize: 32, fontFamily: ff.semibold, letterSpacing: -1 },
  h1: { fontSize: 26, fontFamily: ff.semibold, letterSpacing: -0.6 },
  h2: { fontSize: 18, fontFamily: ff.semibold, letterSpacing: -0.2 },
  body: { fontSize: 15, fontFamily: ff.regular, lineHeight: 21 },
  bodyStrong: { fontSize: 15, fontFamily: ff.semibold, lineHeight: 21 },
  small: { fontSize: 13, fontFamily: ff.regular, lineHeight: 18 },
  label: { fontSize: 12, fontFamily: ff.medium, letterSpacing: 0.4 },
};

interface ThemeValue {
  c: Palette;
  dark: boolean;
}

const Ctx = createContext<ThemeValue>({ c: DARK, dark: true });

export function ThemeRoot({ mode, children }: { mode: ThemeMode; children: React.ReactNode }) {
  const system = useColorScheme();
  const dark = mode === 'dark' || (mode === 'system' && system !== 'light');
  const value = useMemo(() => ({ c: dark ? DARK : LIGHT, dark }), [dark]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}

/** Theme-aware StyleSheet: `const s = useStyles(makeStyles)`. */
export function useStyles<T>(factory: (c: Palette) => T): T {
  const { c } = useTheme();
  return useMemo(() => StyleSheet.create(factory(c) as never) as T, [c, factory]);
}
