import React from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { space, useTheme } from '../theme';

export function Screen({ children, scroll = true, style, edges = ['top'] }: { children: React.ReactNode; scroll?: boolean; style?: StyleProp<ViewStyle>; edges?: ('top' | 'bottom')[] }) {
  const { c } = useTheme();
  const inner = { width: '100%' as const, maxWidth: 640, alignSelf: 'center' as const };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={[{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: 96 }, style]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={inner}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, paddingHorizontal: space.lg, paddingTop: space.md }, inner, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
