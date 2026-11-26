import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { RankBadge } from '../../components/RankBadge';
import { Screen } from '../../components/Screen';
import { useToast } from '../../components/Toast';
import { Card, Checkbox, Pill, ProgressBar, SectionTitle, tap } from '../../components/ui';
import { dayFocus, FOCUS_LABEL, PERFECT_DAY_BONUS, type DailyGoal } from '../../lib/goals';
import { streak } from '../../lib/state';
import { WARMUP_TOTAL_SECONDS } from '../../lib/warmup';
import { useNewId, useStore } from '../../store';
import { colors, radius, space, type } from '../../theme';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const GOAL_ICON: Record<DailyGoal['kind'], keyof typeof Ionicons.glyphMap> = {
  warmup: 'flame-outline',
  train: 'barbell-outline',
  skill: 'git-network-outline',
  water: 'water-outline',
  protein: 'restaurant-outline',
  custom: 'star-outline',
};

export default function Today() {
  const { state, dispatch, goals, level, rank, today } = useStore();
  const toast = useToast();
  const newId = useNewId();
  const [draft, setDraft] = useState('');
  const doneCount = goals.filter((g) => g.id in state.day.done).length;
  const allDone = goals.length > 0 && doneCount === goals.length;
  const warmupDone = 'warmup' in state.day.done;
  const days = streak(state);
  const focus = dayFocus(new Date());
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  const toggle = (g: DailyGoal) => {
    const wasDone = g.id in state.day.done;
    dispatch({ type: 'toggleGoal', goal: g, goals, today, now: Date.now() });
    if (!wasDone) {
      tap('success');
      const willBePerfect = goals.every((x) => x.id === g.id || x.id in state.day.done);
      toast(willBePerfect ? `Perfect day! +${g.xp + PERFECT_DAY_BONUS} EXP` : `+${g.xp} EXP`, 'xp');
    } else {
      tap();
    }
  };

  const addGoal = () => {
    const title = draft.trim();
    if (!title) return;
    if (state.custom.length >= 8) {
      toast('You can have up to 8 of your own goals.', 'error');
      return;
    }
    dispatch({ type: 'addCustom', id: newId(), title });
    setDraft('');
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={type.dim}>{dateLabel}</Text>
          <Text style={type.h1} numberOfLines={1}>
            {greeting()}, {state.profile?.name ?? 'athlete'}
          </Text>
        </View>
        <View style={styles.streak} accessibilityLabel={`${days} day streak`}>
          <Ionicons name="flame" size={18} color={days > 0 ? colors.warning : colors.textFaint} />
          <Text style={[styles.streakText, days > 0 && { color: colors.warning }]}>{days}</Text>
        </View>
      </View>

      <Pressable onPress={() => router.push('/rank')} accessibilityRole="button" accessibilityLabel="Open rank details">
        <Card style={styles.hero}>
          <RankBadge rank={rank} size={68} />
          <View style={{ flex: 1, marginLeft: space.lg }}>
            <Text style={[type.small, { color: rank.color }]}>
              {rank.id}-RANK · {rank.title.toUpperCase()}
            </Text>
            <Text style={[type.h2, { marginTop: 2 }]}>Level {level.level}</Text>
            <View style={{ marginTop: space.sm }}>
              <ProgressBar value={level.progress} color={rank.color} />
            </View>
            <Text style={[type.dim, { fontSize: 12, marginTop: 6 }]}>
              {level.current} / {level.needed} EXP to level {level.level + 1}
            </Text>
          </View>
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push('/warmup')} accessibilityRole="button" accessibilityLabel="Start warm-up" style={({ pressed }) => [{ marginTop: space.lg }, pressed && { opacity: 0.9 }]}>
        <LinearGradient colors={warmupDone ? ['#10302A', '#0E2623'] : ['#7C3AED', '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.warmup}>
          <View style={styles.warmIcon}>
            <Ionicons name={warmupDone ? 'checkmark' : 'play'} size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[type.h2, { color: '#fff' }]}>{warmupDone ? 'Warm-up done' : 'Start your warm-up'}</Text>
            <Text style={{ color: '#E0E7FF', opacity: 0.85, marginTop: 2 }}>
              {warmupDone ? 'Joints ready. Go crush your workout.' : `${Math.round(WARMUP_TOTAL_SECONDS / 60)} min guided · do this before every session`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </LinearGradient>
      </Pressable>

      <SectionTitle right={<Pill text={FOCUS_LABEL[focus].toUpperCase()} color={colors.accent} />}>Daily goals</SectionTitle>

      <Card style={{ padding: space.md }}>
        <View style={styles.progressRow}>
          <Text style={type.body}>
            <Text style={{ fontWeight: '800' }}>{doneCount}</Text> of {goals.length} done
          </Text>
          <Text style={[type.dim, { fontSize: 13 }]}>{allDone ? 'Perfect day earned' : `Finish all for +${PERFECT_DAY_BONUS} bonus`}</Text>
        </View>
        <ProgressBar value={goals.length ? doneCount / goals.length : 0} color={colors.success} />

        <View style={{ marginTop: space.md }}>
          {goals.map((g) => {
            const done = g.id in state.day.done;
            return (
              <View key={g.id} style={[styles.goal, done && styles.goalDone]}>
                <Pressable
                  onPress={() => toggle(g)}
                  style={styles.goalMain}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: done }}
                  accessibilityLabel={`${g.title}. ${g.detail}. ${g.xp} EXP`}
                  testID={`goal-${g.id}`}
                >
                  <Checkbox checked={done} />
                  <View style={{ flex: 1, marginHorizontal: space.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name={GOAL_ICON[g.kind]} size={15} color={done ? colors.textFaint : colors.textDim} />
                      <Text style={[styles.goalTitle, done && styles.strike]} numberOfLines={2}>
                        {g.title}
                      </Text>
                    </View>
                    <Text style={styles.goalDetail}>{g.detail}</Text>
                  </View>
                  <Text style={[styles.xp, done && { color: colors.success }]}>+{g.xp}</Text>
                </Pressable>
                {g.kind === 'custom' ? (
                  <Pressable
                    hitSlop={10}
                    onPress={() => dispatch({ type: 'removeCustom', id: g.id.slice('custom:'.length), goals, today, now: Date.now() })}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${g.title}`}
                    style={styles.remove}
                  >
                    <Ionicons name="close" size={18} color={colors.textFaint} />
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={styles.addRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Add your own daily goal"
            placeholderTextColor={colors.textFaint}
            style={styles.addInput}
            onSubmitEditing={addGoal}
            returnKeyType="done"
            maxLength={60}
          />
          <Pressable onPress={addGoal} disabled={!draft.trim()} style={[styles.addBtn, !draft.trim() && { opacity: 0.4 }]} accessibilityRole="button" accessibilityLabel="Add goal">
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>
      </Card>

      <Text style={[type.dim, { textAlign: 'center', marginTop: space.lg, fontSize: 13 }]}>Goals reset at midnight. Tick them off honestly, the EXP is only as real as your reps.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: space.lg },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  streakText: { color: colors.textFaint, fontWeight: '800', fontSize: 15 },
  hero: { flexDirection: 'row', alignItems: 'center' },
  warmup: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, padding: space.lg, gap: space.md },
  warmIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm, paddingHorizontal: 2 },
  goal: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, backgroundColor: colors.surfaceHigh, marginBottom: space.sm },
  goalDone: { backgroundColor: colors.successSoft },
  goalMain: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: space.md, minHeight: 64 },
  goalTitle: { color: colors.text, fontWeight: '700', fontSize: 15, flexShrink: 1 },
  strike: { textDecorationLine: 'line-through', color: colors.textDim },
  goalDetail: { color: colors.textDim, fontSize: 13, marginTop: 3, lineHeight: 18 },
  xp: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  remove: { paddingRight: space.md, paddingLeft: 2, paddingVertical: space.md },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xs },
  addInput: { flex: 1, color: colors.text, backgroundColor: colors.bg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: space.md, paddingVertical: 12, fontSize: 15 },
  addBtn: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
