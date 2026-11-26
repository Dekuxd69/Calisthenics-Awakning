import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, radius, space, type } from '../theme';

export function tap(kind: 'light' | 'success' = 'light') {
  if (Platform.OS === 'web') return;
  try {
    if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  } catch {
    // Haptics are a nice-to-have.
  }
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section}>{children}</Text>
      {right}
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Button({ label, onPress, variant = 'primary', icon, disabled, style, testID }: ButtonProps) {
  const content = (
    <View style={styles.btnInner}>
      {icon ? <Ionicons name={icon} size={18} color={variant === 'primary' ? '#fff' : variant === 'danger' ? colors.danger : colors.text} /> : null}
      <Text style={[styles.btnLabel, variant === 'danger' && { color: colors.danger }, variant === 'ghost' && { color: colors.textDim }]}>{label}</Text>
    </View>
  );
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.btn, variant !== 'primary' && styles[variant], disabled && { opacity: 0.4 }, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }, style]}
    >
      {variant === 'primary' ? (
        <LinearGradient colors={['#9B6BFF', '#6D3FF0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnGradient}>
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}

export function ProgressBar({ value, color = colors.primary, height = 8, track = colors.surfaceHigh }: { value: number; color?: string; height?: number; track?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={{ height, backgroundColor: track, borderRadius: height, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: height }} />
    </View>
  );
}

export function Checkbox({ checked, color = colors.success }: { checked: boolean; color?: string }) {
  return (
    <View style={[styles.check, checked && { backgroundColor: color, borderColor: color }]}>
      {checked ? <Ionicons name="checkmark" size={18} color="#06101A" /> : null}
    </View>
  );
}

export function Chip<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && { color: colors.text }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({ label, error, suffix, ...props }: TextInputProps & { label: string; error?: string; suffix?: string }) {
  return (
    <View style={{ marginBottom: space.md }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputWrap, !!error && { borderColor: colors.danger }]}>
        <TextInput placeholderTextColor={colors.textFaint} style={styles.input} {...props} />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Pill({ text, color = colors.primary }: { text: string; color?: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: color + '26' }]}>
      <Text style={[styles.pillText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: colors.border },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xl, marginBottom: space.md },
  section: { ...type.small, textTransform: 'uppercase' },
  btn: { borderRadius: radius.md, overflow: 'hidden', minHeight: 50, justifyContent: 'center' },
  btnGradient: { minHeight: 50, justifyContent: 'center', paddingHorizontal: space.lg },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingHorizontal: space.lg },
  btnLabel: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondary: { backgroundColor: colors.surfaceHigh, borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: '#2A1418', borderWidth: 1, borderColor: '#4A2028' },
  primary: {},
  check: { width: 28, height: 28, borderRadius: 9, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.surfaceHigh, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { color: colors.textDim, fontWeight: '600', fontSize: 14 },
  fieldLabel: { ...type.dim, marginBottom: 6, fontWeight: '600' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceHigh, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: space.lg },
  input: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 14 },
  suffix: { color: colors.textFaint, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 13, marginTop: 6 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
});
