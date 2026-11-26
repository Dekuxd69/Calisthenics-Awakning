import { Outfit_400Regular } from '@expo-google-fonts/outfit/400Regular';
import { Outfit_500Medium } from '@expo-google-fonts/outfit/500Medium';
import { Outfit_600SemiBold } from '@expo-google-fonts/outfit/600SemiBold';
import { Outfit_700Bold } from '@expo-google-fonts/outfit/700Bold';
import { Outfit_800ExtraBold } from '@expo-google-fonts/outfit/800ExtraBold';
import { useFonts } from 'expo-font';
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
  const [fontsLoaded, fontError] = useFonts({ Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold });
  const loaded = ready && (fontsLoaded || !!fontError);
  return (
    <ThemeRoot mode={state.settings.theme}>
      {loaded ? (
        <ToastProvider>
          <Navigator />
        </ToastProvider>
      ) : (
        <View style={{ flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#C6F432" size="large" />
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
