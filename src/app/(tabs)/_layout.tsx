import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import React from 'react';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../store';
import { ff, useTheme } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;

function icon(active: IconName, idle: IconName) {
  return ({ focused, color }: { focused: boolean; color: ColorValue; size: number }) => (
    <Ionicons name={focused ? active : idle} color={typeof color === 'string' ? color : undefined} size={24} />
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
        tabBarActiveTintColor: c.primaryText,
        tabBarInactiveTintColor: c.textFaint,
        tabBarStyle: { backgroundColor: c.bg, borderTopWidth: 0, elevation: 0, height: 66 + insets.bottom, paddingBottom: insets.bottom },
        tabBarLabelStyle: { fontSize: 11, fontFamily: ff.medium, marginBottom: 6 },
        tabBarItemStyle: { paddingTop: 8 },
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Main', tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen name="skills" options={{ title: 'Skills', tabBarIcon: icon('trophy', 'trophy-outline') }} />
      <Tabs.Screen name="diet" options={{ title: 'Diet', tabBarIcon: icon('nutrition', 'nutrition-outline') }} />
      <Tabs.Screen name="rank" options={{ title: 'Profile', tabBarIcon: icon('person', 'person-outline') }} />
    </Tabs>
  );
}
