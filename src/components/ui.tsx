import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, Text, TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';
import { ff, font, radius, space, useTheme } from '../theme';

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

/** Text in the app font. `color`: dim | faint | lime | any colour. */
export function T({
  children,
  v = 'body',
  color,
  center,
  style,
  lines,
}: {
  children: React.ReactNode;
  v?: keyof typeof font;
  color?: 'dim' | 'faint' | 'lime' | string;
  center?: boolean;
  style?: StyleProp<TextStyle>;
  lines?: number;
}) {
  const { c } = useTheme();
  const col = color === 'dim' ? c.textDim : color === 'faint' ? c.textFaint : color === 'lime' ? c.primaryText : (color ?? c.text);
  return (
    <Text numberOfLines={lines} style={[font[v], { color: col }, center && { textAlign: 'center' }, style]}>
      {children}
    </Text>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return <View style={[{ backgroundColor: c.surface, borderRadius: radius.lg, padding: space.lg }, style]}>{children}</View>;
}

export function SectionHeader({ title, right, style }: { title: string; right?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xl, marginBottom: space.md }, style]}>
      <T v="h2">{title}</T>
      {right}
    </View>
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
};

/** Pill button. Primary is lime with black text. */
export function Button({ label, onPress, variant = 'primary', icon, disabled, style, testID }: ButtonProps) {
  const { c } = useTheme();
  const bg = variant === 'primary' ? c.primary : variant === 'secondary' ? c.surfaceHigh : variant === 'danger' ? c.dangerSoft : 'transparent';
  const fg = variant === 'primary' ? c.onPrimary : variant === 'danger' ? c.danger : variant === 'ghost' ? c.textDim : c.text;
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
      style={({ pressed }) => [
        { minHeight: 56, borderRadius: radius.pill, backgroundColor: bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingHorizontal: space.xl },
        disabled && { opacity: 0.4 },
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={19} color={fg} /> : null}
      <Text style={{ color: fg, fontFamily: ff.semibold, fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, onPress, label, size = 44, testID, filled }: { icon: IconName; onPress: () => void; label: string; size?: number; testID?: string; filled?: boolean }) {
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
      style={({ pressed }) => ({ width: size, height: size, borderRadius: size / 2, backgroundColor: filled ? c.primary : c.surface, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}
    >
      <Ionicons name={icon} size={size * 0.46} color={filled ? c.onPrimary : c.text} />
    </Pressable>
  );
}

export function ProgressBar({ value, color, height = 8, track }: { value: number; color?: string; height?: number; track?: string }) {
  const { c } = useTheme();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={{ height, backgroundColor: track ?? c.surfaceHigh, borderRadius: height, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color ?? c.primary, borderRadius: height }} />
    </View>
  );
}

/** Segmented pill selector, like the Weight / Body Fat switch in the reference. */
export function Segmented<T extends string>({ options, value, onChange, testIDPrefix }: { options: { value: T; label: string; icon?: IconName }[]; value: T; onChange: (v: T) => void; testIDPrefix?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: c.surface, borderRadius: radius.pill, padding: 4, gap: 4 }} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            testID={testIDPrefix ? `${testIDPrefix}-${o.value}` : undefined}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: radius.pill, backgroundColor: active ? c.primary : 'transparent' }}
          >
            {o.icon ? <Ionicons name={o.icon} size={16} color={active ? c.onPrimary : c.textDim} /> : null}
            <Text style={{ fontFamily: ff.semibold, fontSize: 14, color: active ? c.onPrimary : c.textDim }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Wrapping choice chips for forms. */
export function Chip<T extends string>({ options, value, onChange }: { options: { value: T; label: string; icon?: IconName }[]; value: T; onChange: (v: T) => void }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
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
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, height: 44, borderRadius: radius.pill, backgroundColor: active ? c.primary : c.surface }}
          >
            {o.icon ? <Ionicons name={o.icon} size={16} color={active ? c.onPrimary : c.textDim} /> : null}
            <Text style={{ fontFamily: ff.medium, fontSize: 14, color: active ? c.onPrimary : c.textDim }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Big-number input tile, like the Age / Height tiles in the reference. */
export function NumberTile({ label, unit, error, ...props }: TextInputProps & { label: string; unit?: string; error?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: c.surface, borderRadius: radius.md, padding: space.md, borderWidth: 1.5, borderColor: error ? c.danger : 'transparent' }}>
        <Text style={{ color: c.textFaint, fontFamily: ff.medium, fontSize: 12, letterSpacing: 0.6 }}>{label.toUpperCase()}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <TextInput
            placeholderTextColor={c.textFaint}
            accessibilityLabel={label}
            style={{ flex: 1, color: c.text, fontFamily: ff.semibold, fontSize: 34, paddingVertical: 4, minWidth: 0 }}
            {...props}
          />
          {unit ? <Text style={{ color: c.textFaint, fontFamily: ff.medium, fontSize: 14, marginBottom: 10 }}>{unit}</Text> : null}
        </View>
      </View>
      {error ? <Text style={{ color: c.danger, fontFamily: ff.regular, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ marginBottom: space.md }}>
      <View style={{ backgroundColor: c.surface, borderRadius: radius.md, paddingHorizontal: space.lg, paddingTop: space.md, borderWidth: 1.5, borderColor: error ? c.danger : 'transparent' }}>
        <Text style={{ color: c.textFaint, fontFamily: ff.medium, fontSize: 12, letterSpacing: 0.6 }}>{label.toUpperCase()}</Text>
        <TextInput placeholderTextColor={c.textFaint} accessibilityLabel={label} style={{ color: c.text, fontFamily: ff.semibold, fontSize: 20, paddingVertical: 10 }} {...props} />
      </View>
      {error ? <Text style={{ color: c.danger, fontFamily: ff.regular, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}

export function Pill({ text, icon, tone = 'lime' }: { text: string; icon?: IconName; tone?: 'lime' | 'plain' }) {
  const { c } = useTheme();
  const lime = tone === 'lime';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 32, borderRadius: radius.pill, backgroundColor: lime ? c.primary : c.surface, alignSelf: 'flex-start' }}>
      {icon ? <Ionicons name={icon} size={14} color={lime ? c.onPrimary : c.primaryText} /> : null}
      <Text style={{ color: lime ? c.onPrimary : c.text, fontFamily: ff.semibold, fontSize: 13 }}>{text}</Text>
    </View>
  );
}

/** Round icon on a soft disc. */
export function IconDisc({ icon, size = 40, filled, color }: { icon: IconName; size?: number; filled?: boolean; color?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: filled ? c.primary : c.surfaceHigh, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={size * 0.48} color={filled ? c.onPrimary : (color ?? c.primaryText)} />
    </View>
  );
}
