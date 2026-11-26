import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import React from 'react';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../store';
import { useTheme } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;

function icon(active: IconName, idle: IconName) {
  return ({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) => (
    <Ionicons name={focused ? active : idle} color={typeof color === 'string' ? color : undefined} size={size} />
  );
}

export default function TabsLayout() {
  const { state } = useStore();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  if (!state.profile) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textFaint,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border, height: 64 + insets.bottom, paddingBottom: insets.bottom },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '800', marginBottom: 6 },
        tabBarItemStyle: { paddingTop: 6 },
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen name="skills" options={{ title: 'Skill Map', tabBarIcon: icon('planet', 'planet-outline') }} />
      <Tabs.Screen name="diet" options={{ title: 'Diet', tabBarIcon: icon('nutrition', 'nutrition-outline') }} />
      <Tabs.Screen name="rank" options={{ title: 'Profile', tabBarIcon: icon('person-circle', 'person-circle-outline') }} />
    </Tabs>
  );
}
