import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Button, Card, IconButton, IconDisc, Segmented, T } from '../components/ui';
import type { ThemeMode } from '../lib/state';
import { useStore } from '../store';
import { ff, radius, space, useTheme } from '../theme';

function Label({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <T v="label" color="faint" style={style}>
      {String(children).toUpperCase()}
    </T>
  );
}

export default function Settings() {
  const { state, dispatch, today } = useStore();
  const { c } = useTheme();
  const [confirm, setConfirm] = useState(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <Screen>
      <View style={styles.top}>
        <IconButton icon="chevron-back" label="Back" onPress={back} />
        <T v="h1" style={{ marginLeft: space.md }}>
          Settings
        </T>
      </View>

      <Label style={styles.section}>Appearance</Label>
      <Segmented<ThemeMode>
        options={[
          { value: 'dark', label: 'Dark', icon: 'moon' },
          { value: 'light', label: 'Light', icon: 'sunny' },
          { value: 'system', label: 'System', icon: 'phone-portrait' },
        ]}
        value={state.settings.theme}
        onChange={(theme) => dispatch({ type: 'setTheme', theme })}
        testIDPrefix="theme"
      />

      <Label style={styles.section}>Feel</Label>
      <Card style={styles.row}>
        <IconDisc icon="pulse" size={40} />
        <T v="bodyStrong" style={{ flex: 1, marginLeft: space.md }}>Vibration</T>
        <Switch
          value={state.settings.haptics}
          onValueChange={(on) => dispatch({ type: 'setHaptics', on })}
          trackColor={{ true: c.primary, false: c.muted }}
          thumbColor={state.settings.haptics ? c.onPrimary : '#FFFFFF'}
          accessibilityLabel="Vibration"
        />
      </Card>

      <Label style={styles.section}>You</Label>
      <Pressable onPress={() => router.push('/onboarding?edit=1')} accessibilityRole="button">
        <Card style={styles.row}>
          <IconDisc icon="body" size={40} />
          <View style={{ flex: 1, marginLeft: space.md }}>
            <T v="bodyStrong">Body data</T>
            <T v="small" color="faint">
              {state.profile ? `${state.profile.heightCm} cm · ${state.profile.weightKg} kg · ${state.profile.age} y` : 'Not set'}
            </T>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
        </Card>
      </Pressable>

      <Label style={styles.section}>Danger zone</Label>
      {confirm ? (
        <Card>
          <T v="h2">Reset all progress?</T>
          <T color="dim" style={{ marginTop: 4 }}>
            EXP, skills, streak and badges go to zero.
          </T>
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
            <Button label="Cancel" variant="secondary" onPress={() => setConfirm(false)} style={{ flex: 1 }} />
            <Button
              label="Reset"
              variant="danger"
              onPress={() => {
                dispatch({ type: 'reset', today });
                setConfirm(false);
              }}
              style={{ flex: 1 }}
              testID="confirm-reset"
            />
          </View>
        </Card>
      ) : (
        <Button label="Reset progress" variant="danger" icon="refresh" onPress={() => setConfirm(true)} />
      )}
      <Text style={{ color: c.textFaint, textAlign: 'center', marginTop: space.xl, fontSize: 12, fontFamily: ff.regular }}>Calisthenics Awakening · v0.3.0</Text>
      <View style={{ height: radius.lg }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center' },
  section: { marginTop: space.xl, marginBottom: space.md },
  row: { flexDirection: 'row', alignItems: 'center', padding: space.md },
});
