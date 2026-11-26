import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Button, Card, Pill, SectionTitle, tap } from '../../components/ui';
import { buildDietPlan } from '../../lib/diet';
import { DIET_LABEL, GOAL_LABEL } from '../../lib/profile';
import { useStore } from '../../store';
import { colors, radius, space, type } from '../../theme';

function Macro({ label, grams, kcal, color, share }: { label: string; grams: number; kcal: number; color: string; share: number }) {
  return (
    <View style={styles.macro}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={styles.macroValue}>{grams} g</Text>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroKcal}>
        {kcal} kcal · {Math.round(share * 100)}%
      </Text>
    </View>
  );
}

export default function Diet() {
  const { state } = useStore();
  const profile = state.profile;
  const plan = useMemo(() => (profile ? buildDietPlan(profile) : null), [profile]);
  const [choice, setChoice] = useState<Record<string, number>>({});

  if (!profile || !plan) {
    return (
      <Screen>
        <Text style={type.h1}>Diet plan</Text>
        <Button label="Add your body data" onPress={() => router.push('/onboarding?edit=1')} style={{ marginTop: space.lg }} />
      </Screen>
    );
  }

  const p = plan.proteinG * 4;
  const f = plan.fatG * 9;
  const c = plan.carbsG * 4;
  const total = p + f + c || 1;

  return (
    <Screen>
      <Text style={type.h1}>Your diet plan</Text>
      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm, flexWrap: 'wrap' }}>
        <Pill text={GOAL_LABEL[profile.goal].toUpperCase()} color={colors.primary} />
        <Pill text={DIET_LABEL[profile.diet].toUpperCase()} color={colors.success} />
      </View>

      <Card style={{ marginTop: space.lg }}>
        <Text style={type.small}>DAILY TARGET</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 }}>
          <Text style={styles.kcal}>{plan.calories.toLocaleString()}</Text>
          <Text style={[type.dim, { marginLeft: 6, marginBottom: 8 }]}>kcal / day</Text>
        </View>
        <View style={styles.bar}>
          <View style={{ flex: p / total, backgroundColor: '#F472B6' }} />
          <View style={{ flex: c / total, backgroundColor: '#38BDF8' }} />
          <View style={{ flex: f / total, backgroundColor: '#FBBF24' }} />
        </View>
        <View style={styles.macros}>
          <Macro label="Protein" grams={plan.proteinG} kcal={p} color="#F472B6" share={p / total} />
          <Macro label="Carbs" grams={plan.carbsG} kcal={c} color="#38BDF8" share={c / total} />
          <Macro label="Fat" grams={plan.fatG} kcal={f} color="#FBBF24" share={f / total} />
        </View>
      </Card>

      <View style={styles.stats}>
        <Card style={styles.stat}>
          <Ionicons name="water" size={20} color={colors.accent} />
          <Text style={styles.statValue}>{plan.waterL} L</Text>
          <Text style={styles.statLabel}>Water</Text>
        </Card>
        <Card style={styles.stat}>
          <Ionicons name="body" size={20} color={colors.primary} />
          <Text style={styles.statValue}>{plan.bmi}</Text>
          <Text style={styles.statLabel}>BMI · {plan.bmiLabel}</Text>
        </Card>
        <Card style={styles.stat}>
          <Ionicons name="flash" size={20} color={colors.warning} />
          <Text style={styles.statValue}>{plan.tdee.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Burn / day</Text>
        </Card>
      </View>

      <SectionTitle>Meals</SectionTitle>
      {plan.meals.map((m) => {
        const idx = (choice[m.id] ?? 0) % m.options.length;
        return (
          <Card key={m.id} style={{ marginBottom: space.md }}>
            <View style={styles.mealHead}>
              <View style={{ flex: 1 }}>
                <Text style={type.h2}>{m.name}</Text>
                <Text style={[type.dim, { fontSize: 13 }]}>{m.time}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.mealKcal}>{m.calories} kcal</Text>
                <Text style={[type.dim, { fontSize: 13 }]}>{m.proteinG} g protein</Text>
              </View>
            </View>
            <View style={{ marginTop: space.md }}>
              {m.options[idx].map((item) => (
                <View key={item} style={styles.item}>
                  <View style={styles.bullet} />
                  <Text style={[type.body, { flex: 1 }]}>{item}</Text>
                </View>
              ))}
            </View>
            <Pressable
              onPress={() => {
                tap();
                setChoice((s) => ({ ...s, [m.id]: idx + 1 }));
              }}
              style={styles.swap}
              accessibilityRole="button"
              accessibilityLabel={`Show another ${m.name} idea`}
            >
              <Ionicons name="swap-horizontal" size={16} color={colors.primary} />
              <Text style={styles.swapText}>
                Other idea ({idx + 1}/{m.options.length})
              </Text>
            </Pressable>
          </Card>
        );
      })}

      <SectionTitle>Coach notes</SectionTitle>
      <Card>
        {plan.notes.map((n) => (
          <View key={n} style={styles.item}>
            <Ionicons name="information-circle" size={18} color={colors.accent} style={{ marginRight: space.sm, marginTop: 1 }} />
            <Text style={[type.dim, { flex: 1 }]}>{n}</Text>
          </View>
        ))}
      </Card>

      <Button label="Update body data" icon="create-outline" variant="secondary" onPress={() => router.push('/onboarding?edit=1')} style={{ marginTop: space.lg }} />
      <Text style={styles.disclaimer}>
        Estimates use the Mifflin-St Jeor formula. This is general guidance, not medical advice. Talk to a doctor or dietitian if you have a health condition.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kcal: { color: colors.text, fontSize: 44, fontWeight: '800', letterSpacing: -1 },
  bar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginTop: space.md, gap: 2 },
  macros: { flexDirection: 'row', marginTop: space.lg, gap: space.sm },
  macro: { flex: 1 },
  macroDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 6 },
  macroValue: { color: colors.text, fontWeight: '800', fontSize: 20 },
  macroLabel: { color: colors.textDim, fontWeight: '600', fontSize: 13 },
  macroKcal: { color: colors.textFaint, fontSize: 11, marginTop: 2 },
  stats: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  stat: { flex: 1, padding: space.md, alignItems: 'flex-start' },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 6 },
  statLabel: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  mealHead: { flexDirection: 'row', alignItems: 'flex-start' },
  mealKcal: { color: colors.text, fontWeight: '800', fontSize: 16 },
  item: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 5 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 8, marginRight: space.md },
  swap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.md, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.primarySoft },
  swapText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  disclaimer: { color: colors.textFaint, fontSize: 12, textAlign: 'center', marginTop: space.lg, lineHeight: 17 },
});
