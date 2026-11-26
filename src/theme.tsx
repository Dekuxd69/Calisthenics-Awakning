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
  primary: string;
  primarySoft: string;
  accent: string;
  success: string;
  successSoft: string;
  warning: string;
  danger: string;
  dangerSoft: string;
  overlay: string;
  /** Silhouette colour inside coloured circles. */
  onColor: string;
}

export const DARK: Palette = {
  bg: '#07090F',
  surface: '#10141F',
  surfaceHigh: '#181D2C',
  border: '#232A3D',
  text: '#F4F6FB',
  textDim: '#A0A9C0',
  textFaint: '#7F88A3',
  primary: '#7C5CFF',
  primarySoft: '#221B45',
  accent: '#22D3EE',
  success: '#2DD4A0',
  successSoft: '#0F2E27',
  warning: '#FBBF24',
  danger: '#F87171',
  dangerSoft: '#2A1418',
  overlay: 'rgba(3,5,10,0.82)',
  onColor: '#FFFFFF',
};

export const LIGHT: Palette = {
  bg: '#F4F5FA',
  surface: '#FFFFFF',
  surfaceHigh: '#ECEEF5',
  border: '#DFE2EC',
  text: '#0E1220',
  textDim: '#4C546B',
  textFaint: '#666E89',
  primary: '#6A47FF',
  primarySoft: '#ECE7FF',
  accent: '#0891B2',
  success: '#059669',
  successSoft: '#DBF4EA',
  warning: '#D97706',
  danger: '#DC2626',
  dangerSoft: '#FDECEC',
  overlay: 'rgba(10,12,20,0.5)',
  onColor: '#FFFFFF',
};

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const font = {
  display: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.8 },
  h1: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 21 },
  small: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1.2 },
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

/** Text styles with colours applied, for screens that style Text directly. */
export function useType() {
  const { c } = useTheme();
  return useMemo(
    () => ({
      display: { ...font.display, color: c.text },
      h1: { ...font.h1, color: c.text },
      h2: { ...font.h2, color: c.text },
      body: { ...font.body, color: c.text },
      dim: { ...font.body, color: c.textDim },
      small: { ...font.label, color: c.textFaint },
    }),
    [c],
  );
}
