import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, Pressable, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { font, radius, space, useStyles, useTheme, type Palette } from '../theme';

let hapticsOn = true;
export function setHapticsEnabled(on: boolean) {
  hapticsOn = on;
}

export function tap(kind: 'light' | 'success' | 'heavy' = 'light') {
  if (Platform.OS === 'web' || !hapticsOn) return;
  try {
    if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    else Haptics.impactAsync(kind === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  } catch {
    // Haptics are a nice-to-have.
  }
}

export type IconName = keyof typeof Ionicons.glyphMap;

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const s = useStyles(styles);
  return <View style={[s.card, style]}>{children}</View>;
}

export function Label({ children, color, style }: { children: React.ReactNode; color?: string; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <View style={style}>
      <Text style={[font.label, { color: color ?? c.textFaint, textTransform: 'uppercase' }]}>{children}</Text>
    </View>
  );
}

export function T({ children, v = 'body', color, center, style, lines }: { children: React.ReactNode; v?: keyof typeof font; color?: 'dim' | 'faint' | string; center?: boolean; style?: object; lines?: number }) {
  const { c } = useTheme();
  const col = color === 'dim' ? c.textDim : color === 'faint' ? c.textFaint : (color ?? c.text);
  return (
    <Text numberOfLines={lines} style={[font[v], { color: col }, center && { textAlign: 'center' }, style]}>
      {children}
    </Text>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  color?: string;
};

export function Button({ label, onPress, variant = 'primary', icon, disabled, style, testID, color }: ButtonProps) {
  const { c } = useTheme();
  const s = useStyles(styles);
  const fg = variant === 'primary' ? '#FFFFFF' : variant === 'danger' ? c.danger : variant === 'ghost' ? c.textDim : c.text;
  const content = (
    <View style={s.btnInner}>
      {icon ? <Ionicons name={icon} size={19} color={fg} /> : null}
      <Text style={[s.btnLabel, { color: fg }]}>{label}</Text>
    </View>
  );
  const main = color ?? c.primary;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [s.btn, variant === 'secondary' && s.secondary, variant === 'danger' && s.danger, disabled && { opacity: 0.4 }, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }, style]}
    >
      {variant === 'primary' ? (
        <LinearGradient colors={[main, main]} style={[s.btnGradient, { borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.25)' }]}>
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}

export function IconButton({ icon, onPress, label, size = 44, testID }: { icon: IconName; onPress: () => void; label: string; size?: number; testID?: string }) {
  const { c } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={() => {
        tap();
        onPress();
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({ width: size, height: size, borderRadius: size / 2, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}
    >
      <Ionicons name={icon} size={size * 0.46} color={c.text} />
    </Pressable>
  );
}

export function ProgressBar({ value, color, height = 8 }: { value: number; color?: string; height?: number }) {
  const { c } = useTheme();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={{ height, backgroundColor: c.surfaceHigh, borderRadius: height, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color ?? c.primary, borderRadius: height }} />
    </View>
  );
}

export function Chip<T extends string>({ options, value, onChange }: { options: { value: T; label: string; icon?: IconName }[]; value: T; onChange: (v: T) => void }) {
  const { c } = useTheme();
  const s = useStyles(styles);
  return (
    <View style={s.chips}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            style={[s.chip, active && { backgroundColor: c.primarySoft, borderColor: c.primary }]}
          >
            {o.icon ? <Ionicons name={o.icon} size={16} color={active ? c.primary : c.textDim} /> : null}
            <Text style={[s.chipText, active && { color: c.text }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({ label, error, suffix, ...props }: TextInputProps & { label: string; error?: string; suffix?: string }) {
  const { c } = useTheme();
  const s = useStyles(styles);
  return (
    <View style={{ marginBottom: space.md }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={[s.inputWrap, !!error && { borderColor: c.danger }]}>
        <TextInput placeholderTextColor={c.textFaint} style={s.input} accessibilityLabel={label} {...props} />
        {suffix ? <Text style={s.suffix}>{suffix}</Text> : null}
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

export function Pill({ text, color, icon }: { text: string; color: string; icon?: IconName }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: color + '24', alignSelf: 'flex-start' }}>
      {icon ? <Ionicons name={icon} size={13} color={color} /> : null}
      <Text style={{ color, fontSize: 12, fontWeight: '800', letterSpacing: 0.3 }}>{text}</Text>
    </View>
  );
}

/** A round icon on a tinted disc, for lists and badges. */
export function IconDisc({ icon, color, size = 40, filled }: { icon: IconName; color: string; size?: number; filled?: boolean }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: filled ? color : color + '24', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={size * 0.5} color={filled ? '#FFFFFF' : color} />
    </View>
  );
}

const styles = (c: Palette) => ({
  card: { backgroundColor: c.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: c.border },
  btn: { borderRadius: radius.md, overflow: 'hidden' as const, minHeight: 54, justifyContent: 'center' as const },
  btnGradient: { minHeight: 54, justifyContent: 'center' as const, paddingHorizontal: space.lg },
  btnInner: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: space.sm, paddingHorizontal: space.lg },
  btnLabel: { fontWeight: '800' as const, fontSize: 16, letterSpacing: 0.2 },
  secondary: { backgroundColor: c.surfaceHigh, borderWidth: 1, borderColor: c.border },
  danger: { backgroundColor: c.dangerSoft, borderWidth: 1, borderColor: c.danger + '55' },
  chips: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: space.sm },
  chip: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, paddingHorizontal: 14, paddingVertical: 11, borderRadius: radius.pill, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  chipText: { color: c.textDim, fontWeight: '700' as const, fontSize: 14 },
  fieldLabel: { color: c.textDim, fontSize: 13, fontWeight: '700' as const, marginBottom: 6 },
  inputWrap: { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: c.surfaceHigh, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, paddingHorizontal: space.lg },
  input: { flex: 1, color: c.text, fontSize: 17, fontWeight: '600' as const, paddingVertical: 14 },
  suffix: { color: c.textFaint, fontWeight: '700' as const },
  error: { color: c.danger, fontSize: 13, marginTop: 6 },
});
