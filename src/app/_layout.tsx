import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Celebration } from '../components/Celebration';
import { TiltProvider } from '../components/Tilt';
import { ToastProvider } from '../components/Toast';
import { StoreProvider, useStore } from '../store';
import { ThemeRoot, useTheme } from '../theme';

function Navigator() {
  const { c, dark } = useTheme();
  const navTheme = useMemo(() => {
    const base = dark ? DarkTheme : DefaultTheme;
    return { ...base, colors: { ...base.colors, background: c.bg, card: c.surface, text: c.text, border: c.border, primary: c.primary } };
  }, [c, dark]);
  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="skill/[id]" />
        <Stack.Screen name="warmup" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="settings" />
      </Stack>
      <Celebration />
    </ThemeProvider>
  );
}

function Gate() {
  const { ready, state } = useStore();
  return (
    <ThemeRoot mode={state.settings.theme}>
      {ready ? (
        <ToastProvider>
          <Navigator />
        </ToastProvider>
      ) : (
        <View style={{ flex: 1, backgroundColor: '#07090F', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#7C5CFF" size="large" />
        </View>
      )}
    </ThemeRoot>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <TiltProvider>
          <Gate />
        </TiltProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
