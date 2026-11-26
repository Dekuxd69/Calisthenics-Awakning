import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import React from 'react';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../store';
import { colors } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;

function icon(active: IconName, idle: IconName) {
  return ({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) => (
    <Ionicons name={focused ? active : idle} color={typeof color === "string" ? color : undefined} size={size} />
  );
}

export default function TabsLayout() {
  const { state } = useStore();
  const insets = useSafeAreaInsets();
  if (!state.profile) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
        tabBarItemStyle: { paddingTop: 6 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: icon('today', 'today-outline') }} />
      <Tabs.Screen name="skills" options={{ title: 'Skills', tabBarIcon: icon('git-network', 'git-network-outline') }} />
      <Tabs.Screen name="diet" options={{ title: 'Diet', tabBarIcon: icon('nutrition', 'nutrition-outline') }} />
      <Tabs.Screen name="rank" options={{ title: 'Rank', tabBarIcon: icon('trophy', 'trophy-outline') }} />
    </Tabs>
  );
}
