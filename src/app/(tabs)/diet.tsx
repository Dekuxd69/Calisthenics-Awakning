import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Screen } from '../../components/Screen';
import { Button, Card, IconButton, IconDisc, Label, Pill, T, tap } from '../../components/ui';
import { buildDietPlan } from '../../lib/diet';
import { GOAL_LABEL } from '../../lib/profile';
import { useStore } from '../../store';
import { radius, space, useTheme } from '../../theme';

const MACRO = { protein: '#F472B6', carbs: '#38BDF8', fat: '#FBBF24' };
const MEAL_ICON = { breakfast: 'sunny', lunch: 'restaurant', snack: 'nutrition', dinner: 'moon' } as const;

function MacroRing({ p, cb, f, kcal }: { p: number; cb: number; f: number; kcal: number }) {
  const { c } = useTheme();
  const size = 168;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = p + cb + f || 1;
  const parts = [
    { v: p / total, color: MACRO.protein },
    { v: cb / total, color: MACRO.carbs },
    { v: f / total, color: MACRO.fat },
  ];
  let offset = 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.surfaceHigh} strokeWidth={stroke} fill="none" />
        {parts.map((pt, i) => {
          const len = Math.max(0, pt.v * circ - 6);
          const el = (
            <Circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={pt.color}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${len} ${circ}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += pt.v * circ;
          return el;
        })}
      </Svg>
      <Text style={{ color: c.text, fontSize: 32, fontWeight: '900', letterSpacing: -1 }}>{kcal.toLocaleString()}</Text>
      <Text style={{ color: c.textFaint, fontWeight: '700', fontSize: 12 }}>KCAL / DAY</Text>
    </View>
  );
}

export default function Diet() {
  const { state } = useStore();
  const { c } = useTheme();
  const profile = state.profile;
  const plan = useMemo(() => (profile ? buildDietPlan(profile) : null), [profile]);
  const [choice, setChoice] = useState<Record<string, number>>({});
  const [open, setOpen] = useState<string | null>('breakfast');

  if (!profile || !plan) {
    return (
      <Screen>
        <T v="h1">Diet</T>
        <Button label="Add body data" onPress={() => router.push('/onboarding?edit=1')} style={{ marginTop: space.lg }} />
      </Screen>
    );
  }

  const macros = [
    { label: 'Protein', g: plan.proteinG, color: MACRO.protein },
    { label: 'Carbs', g: plan.carbsG, color: MACRO.carbs },
    { label: 'Fat', g: plan.fatG, color: MACRO.fat },
  ];

  return (
    <Screen>
      <View style={styles.top}>
        <View>
          <T v="h1">Diet</T>
          <View style={{ marginTop: 6 }}>
            <Pill text={GOAL_LABEL[profile.goal]} color={c.primary} icon="flag" />
          </View>
        </View>
        <IconButton icon="create-outline" label="Edit body data" onPress={() => router.push('/onboarding?edit=1')} />
      </View>

      <Card style={styles.hero}>
        <MacroRing p={plan.proteinG * 4} cb={plan.carbsG * 4} f={plan.fatG * 9} kcal={plan.calories} />
        <View style={styles.macros}>
          {macros.map((m) => (
            <View key={m.label} style={styles.macro}>
              <View style={[styles.mDot, { backgroundColor: m.color }]} />
              <Text style={[styles.mValue, { color: c.text }]}>{m.g}g</Text>
              <Text style={[styles.mLabel, { color: c.textFaint }]}>{m.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.tiles}>
        {[
          { icon: 'water', value: `${plan.waterL} L`, label: 'Water', color: '#38BDF8' },
          { icon: 'body', value: String(plan.bmi), label: plan.bmiLabel, color: c.primary },
          { icon: 'flame', value: plan.tdee.toLocaleString(), label: 'Burn', color: '#F97316' },
        ].map((t) => (
          <View key={t.label} style={[styles.tile, { backgroundColor: c.surface, borderColor: c.border }]}>
            <IconDisc icon={t.icon as 'water'} color={t.color} size={34} />
            <Text style={[styles.tValue, { color: c.text }]}>{t.value}</Text>
            <Text style={[styles.tLabel, { color: c.textFaint }]}>{t.label}</Text>
          </View>
        ))}
      </View>

      <Label style={{ marginTop: space.xl, marginBottom: space.md }}>Meals</Label>
      <View style={{ gap: space.sm }}>
        {plan.meals.map((m) => {
          const idx = (choice[m.id] ?? 0) % m.options.length;
          const isOpen = open === m.id;
          return (
            <View key={m.id} style={[styles.meal, { backgroundColor: c.surface, borderColor: isOpen ? c.primary + '66' : c.border }]}>
              <Pressable
                onPress={() => {
                  tap();
                  setOpen(isOpen ? null : m.id);
                }}
                style={styles.mealHead}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                testID={`meal-${m.id}`}
              >
                <IconDisc icon={MEAL_ICON[m.id as keyof typeof MEAL_ICON] ?? 'restaurant'} color={c.primary} size={40} />
                <View style={{ flex: 1, marginLeft: space.md }}>
                  <T style={{ fontWeight: '800' }}>{m.name}</T>
                  <T v="small" color="faint">
                    {m.calories} kcal · {m.proteinG}g protein
                  </T>
                </View>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={c.textFaint} />
              </Pressable>
              {isOpen ? (
                <View style={{ paddingHorizontal: space.md, paddingBottom: space.md }}>
                  {m.options[idx].map((item) => (
                    <View key={item} style={styles.item}>
                      <View style={[styles.bullet, { backgroundColor: c.primary }]} />
                      <T style={{ flex: 1 }}>{item}</T>
                    </View>
                  ))}
                  <Pressable
                    onPress={() => {
                      tap();
                      setChoice((s) => ({ ...s, [m.id]: idx + 1 }));
                    }}
                    style={[styles.swap, { backgroundColor: c.primarySoft }]}
                    accessibilityRole="button"
                    accessibilityLabel="Swap meal idea"
                  >
                    <Ionicons name="shuffle" size={16} color={c.primary} />
                    <Text style={{ color: c.primary, fontWeight: '800', fontSize: 13 }}>Swap</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <Card style={{ marginTop: space.lg, flexDirection: 'row', gap: space.md, padding: space.md }}>
        <Ionicons name="bulb" size={20} color={c.warning} />
        <T v="small" color="dim" style={{ flex: 1 }}>
          {plan.notes[0]}
        </T>
      </Card>
      <T v="small" color="faint" center style={{ marginTop: space.lg }}>
        Estimates, not medical advice.
      </T>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  hero: { alignItems: 'center', marginTop: space.lg, paddingVertical: space.xl },
  macros: { flexDirection: 'row', marginTop: space.lg, alignSelf: 'stretch' },
  macro: { flex: 1, alignItems: 'center' },
  mDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 6 },
  mValue: { fontSize: 20, fontWeight: '900' },
  mLabel: { fontSize: 12, fontWeight: '700' },
  tiles: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  tile: { flex: 1, borderRadius: radius.md, borderWidth: 1, padding: space.md, alignItems: 'flex-start' },
  tValue: { fontSize: 18, fontWeight: '900', marginTop: 8 },
  tLabel: { fontSize: 12, fontWeight: '700' },
  meal: { borderRadius: radius.md, borderWidth: 1 },
  mealHead: { flexDirection: 'row', alignItems: 'center', padding: space.md },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginRight: space.md },
  swap: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: space.sm, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill },
});
