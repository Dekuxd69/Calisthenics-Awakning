import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '../../components/Avatar';
import { Illustration, Pictogram } from '../../components/art/Illustrations';
import { type PoseId } from '../../components/art/poses';
import { Screen } from '../../components/Screen';
import { useToast } from '../../components/Toast';
import { Card, IconButton, IconDisc, ProgressBar, SectionHeader, T, tap, type IconName } from '../../components/ui';
import { chestXp, dayFocus, FOCUS_LABEL, parseDateKey, type DailyGoal, type DayFocus } from '../../lib/goals';
import { streak, weekStrip } from '../../lib/state';
import { useNewId, useStore } from '../../store';
import { ff, radius, space, useTheme } from '../../theme';

const GOAL_ICON: Record<DailyGoal['kind'], IconName> = {
  warmup: 'flame',
  train: 'barbell',
  skill: 'trophy',
  water: 'water',
  protein: 'restaurant',
  custom: 'star',
};
const FOCUS_POSE: Record<DayFocus, PoseId> = { push: 'pushup', pull: 'pullup', legs: 'squat', rest: 'hollow' };

function QuestRow({ goal, done, onToggle, onRemove }: { goal: DailyGoal; done: boolean; onToggle: () => void; onRemove?: () => void }) {
  const { c } = useTheme();
  const pop = useRef(new Animated.Value(done ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: done ? 1 : 0, friction: 5, tension: 120, useNativeDriver: true }).start();
  }, [done, pop]);
  return (
    <Pressable
      testID={`goal-${goal.id}`}
      onPress={onToggle}
      onLongPress={onRemove}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={`${goal.title}. ${goal.detail}. ${goal.xp} EXP`}
      accessibilityHint={onRemove ? 'Long press to remove' : undefined}
      style={({ pressed }) => [styles.quest, { backgroundColor: c.surface }, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <IconDisc icon={GOAL_ICON[goal.kind]} size={44} filled={done} />
      <View style={{ flex: 1, marginHorizontal: space.md }}>
        <Text numberOfLines={1} style={[styles.questTitle, { color: done ? c.textFaint : c.text }]}>
          {goal.title}
        </Text>
        <Text numberOfLines={1} style={[styles.questDetail, { color: c.textFaint }]}>
          {goal.detail}
        </Text>
      </View>
      <Text style={[styles.xp, { color: done ? c.textFaint : c.primaryText }]}>+{goal.xp}</Text>
      <View style={[styles.check, { borderColor: done ? c.primary : c.muted }]}>
        <Animated.View style={[styles.checkFill, { backgroundColor: c.primary, transform: [{ scale: pop }] }]}>
          <Ionicons name="checkmark" size={18} color={c.onPrimary} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

export default function Home() {
  const { state, dispatch, goals, level, rank, today } = useStore();
  const { c } = useTheme();
  const toast = useToast();
  const newId = useNewId();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const doneCount = goals.filter((g) => g.id in state.day.done).length;
  const allDone = goals.length > 0 && doneCount === goals.length;
  const days = streak(state);
  const week = weekStrip(state);
  const focus = dayFocus(new Date());
  const warmupDone = 'warmup' in state.day.done;
  const chestOpened = state.day.chest > 0;
  const name = state.profile?.name ?? 'Athlete';

  const toggle = (g: DailyGoal) => {
    const wasDone = g.id in state.day.done;
    dispatch({ type: 'toggleGoal', goal: g, goals, today, now: Date.now() });
    if (!wasDone) {
      tap('success');
      toast(`+${g.xp} EXP`, 'xp');
    } else tap();
  };

  const addGoal = () => {
    const title = draft.trim();
    if (!title) return setAdding(false);
    if (state.custom.length >= 8) return toast('Up to 8 custom quests', 'error');
    dispatch({ type: 'addCustom', id: newId(), title });
    setDraft('');
    setAdding(false);
  };

  const openChest = () => {
    dispatch({ type: 'claimChest', goals, today, now: Date.now() });
    tap('heavy');
    toast(`Chest opened! +${chestXp(today)} EXP`, 'xp');
  };

  return (
    <Screen>
      {/* Profile header */}
      <View style={styles.top}>
        <Pressable onPress={() => router.push('/rank')} accessibilityRole="button" accessibilityLabel="Open profile">
          <Avatar name={name} size={60} progress={level.progress} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: space.md }}>
          <T v="small" color="faint">
            Welcome back
          </T>
          <T v="h1" lines={1}>
            {name}
          </T>
        </View>
        <IconButton icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} testID="open-settings" />
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        {[
          { v: days, l: 'Streak' },
          { v: level.level, l: 'Level' },
          { v: `${rank.id}`, l: 'Rank' },
          { v: state.xp, l: 'EXP' },
        ].map((s, i) => (
          <View key={s.l} style={[styles.statCell, i > 0 && { borderLeftWidth: 1, borderLeftColor: c.border }]} accessible accessibilityLabel={`${s.l} ${s.v}`}>
            <Text style={[styles.statValue, { color: c.text }]}>{s.v}</Text>
            <Text style={[styles.statLabel, { color: c.textFaint }]}>{s.l}</Text>
          </View>
        ))}
      </View>

      {/* Week */}
      <View style={styles.week}>
        {week.map((d) => {
          const date = parseDateKey(d.date);
          return (
            <View
              key={d.date}
              style={[styles.day, { backgroundColor: c.surface, borderColor: d.today ? c.primary : 'transparent' }]}
              accessible
              accessibilityLabel={`${date.toDateString()}${d.active ? ', trained' : ''}`}
            >
              <Text style={[styles.dayName, { color: d.today ? c.primaryText : c.textFaint }]}>{date.toLocaleDateString('en', { weekday: 'short' })}</Text>
              <Text style={[styles.dayNum, { color: c.text }]}>{date.getDate()}</Text>
              <View style={[styles.dayDot, { backgroundColor: d.active ? c.primary : c.muted }]} />
            </View>
          );
        })}
      </View>

      {/* Streak card */}
      <Card style={styles.streakCard}>
        <View style={{ flex: 1 }}>
          <T v="h1">{days > 0 ? 'Keep it up!' : 'Start a streak'}</T>
          <T color="dim" style={{ marginTop: 4 }}>
            {days > 0 ? `${days} ${days === 1 ? 'day' : 'days'} in a row` : 'Finish one quest today'}
          </T>
          <View style={{ marginTop: space.md, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="trophy" size={14} color={c.primaryText} />
            <T v="small" color="faint">
              Best {state.bestStreak}
            </T>
          </View>
        </View>
        <Illustration name={days > 0 ? 'trophy' : 'flame'} size={112} />
      </Card>

      {/* Today's session */}
      <Pressable onPress={() => router.push('/warmup')} accessibilityRole="button" accessibilityLabel={warmupDone ? 'Warm-up done' : 'Start warm-up'} testID="start-session">
        {({ pressed }) => (
          <View style={[styles.session, { backgroundColor: c.primary }, pressed && { transform: [{ scale: 0.98 }] }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sessionLabel, { color: c.onPrimary }]}>{FOCUS_LABEL[focus].toUpperCase()}</Text>
              <Text style={[styles.sessionTitle, { color: c.onPrimary }]}>{warmupDone ? 'Warmed up' : 'Daily warm-up'}</Text>
              <View style={[styles.go, { backgroundColor: c.onPrimary }]}>
                <Ionicons name={warmupDone ? 'checkmark' : 'play'} size={15} color={c.primary} />
                <Text style={[styles.goText, { color: c.primary }]}>{warmupDone ? 'Done' : '5 min'}</Text>
              </View>
            </View>
            <View style={[styles.sessionArt, { backgroundColor: 'rgba(10,10,10,0.08)' }]}>
              <Pictogram pose={FOCUS_POSE[focus]} size={104} color="#0A0A0A" />
            </View>
          </View>
        )}
      </Pressable>

      {/* Quests */}
      <SectionHeader
        title="Daily quests"
        right={
          <T v="bodyStrong" color="dim">
            {doneCount}/{goals.length}
          </T>
        }
      />
      <View style={{ gap: space.sm }}>
        {goals.map((g) => (
          <QuestRow
            key={g.id}
            goal={g}
            done={g.id in state.day.done}
            onToggle={() => toggle(g)}
            onRemove={g.kind === 'custom' ? () => dispatch({ type: 'removeCustom', id: g.id.slice('custom:'.length), goals, today, now: Date.now() }) : undefined}
          />
        ))}
        {adding ? (
          <View style={[styles.addRow, { backgroundColor: c.surface, borderColor: c.primary }]}>
            <TextInput
              autoFocus
              value={draft}
              onChangeText={setDraft}
              placeholder="New quest"
              placeholderTextColor={c.textFaint}
              style={[styles.addInput, { color: c.text }]}
              onSubmitEditing={addGoal}
              onBlur={() => !draft.trim() && setAdding(false)}
              returnKeyType="done"
              maxLength={40}
              testID="quest-input"
            />
            <Pressable onPress={addGoal} style={[styles.addBtn, { backgroundColor: c.primary }]} accessibilityRole="button" accessibilityLabel="Save quest">
              <Ionicons name="checkmark" size={20} color={c.onPrimary} />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setAdding(true)} style={[styles.addGhost, { borderColor: c.muted }]} accessibilityRole="button" testID="add-quest">
            <Ionicons name="add" size={18} color={c.textDim} />
            <Text style={{ color: c.textDim, fontFamily: ff.medium }}>Add quest</Text>
          </Pressable>
        )}
      </View>

      {/* Chest */}
      <Pressable
        disabled={!allDone || chestOpened}
        onPress={openChest}
        testID="chest"
        accessibilityRole="button"
        accessibilityLabel={chestOpened ? `Chest opened, ${state.day.chest} EXP` : allDone ? 'Open daily chest' : 'Daily chest, finish all quests to open'}
        style={[styles.chest, { backgroundColor: c.surface, borderColor: allDone && !chestOpened ? c.primary : 'transparent' }]}
      >
        <View style={{ flex: 1 }}>
          <T v="h2">{chestOpened ? `+${state.day.chest} EXP` : allDone ? 'Open your chest' : 'Daily chest'}</T>
          <T v="small" color="dim" style={{ marginTop: 2 }}>
            {chestOpened ? 'Come back tomorrow' : allDone ? 'Tap for bonus EXP' : 'Finish every quest'}
          </T>
          {!chestOpened && !allDone ? (
            <View style={{ marginTop: space.md }}>
              <ProgressBar value={goals.length ? doneCount / goals.length : 0} height={8} />
            </View>
          ) : null}
        </View>
        <Illustration name={chestOpened ? 'chestOpen' : 'chest'} size={92} />
      </Pressable>
      {state.custom.length > 0 ? (
        <T v="small" color="faint" center style={{ marginTop: space.md }}>
          Long press your own quests to remove them
        </T>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center' },
  stats: { flexDirection: 'row', marginTop: space.xl },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: ff.semibold, fontSize: 22 },
  statLabel: { fontFamily: ff.regular, fontSize: 12, marginTop: 2 },
  week: { flexDirection: 'row', gap: 6, marginTop: space.xl },
  day: { flex: 1, alignItems: 'center', borderRadius: radius.md, borderWidth: 1.5, paddingVertical: 10 },
  dayName: { fontFamily: ff.medium, fontSize: 11 },
  dayNum: { fontFamily: ff.semibold, fontSize: 18, marginTop: 2 },
  dayDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  streakCard: { flexDirection: 'row', alignItems: 'center', marginTop: space.md, paddingVertical: space.md },
  session: { flexDirection: 'row', alignItems: 'center', marginTop: space.md, borderRadius: radius.lg, padding: space.lg },
  sessionLabel: { fontFamily: ff.semibold, fontSize: 12, letterSpacing: 0.8, opacity: 0.7 },
  sessionTitle: { fontFamily: ff.semibold, fontSize: 26, letterSpacing: -0.6, marginTop: 2 },
  sessionArt: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center' },
  go: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: space.md, paddingHorizontal: 16, height: 40, borderRadius: radius.pill },
  goText: { fontFamily: ff.semibold, fontSize: 14 },
  quest: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, padding: space.md, minHeight: 72 },
  questTitle: { fontFamily: ff.semibold, fontSize: 16 },
  questDetail: { fontFamily: ff.regular, fontSize: 13, marginTop: 2 },
  xp: { fontFamily: ff.semibold, fontSize: 14, marginRight: space.md },
  check: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  checkFill: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  addRow: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: 1.5, paddingLeft: space.md, paddingRight: 6, minHeight: 56 },
  addInput: { flex: 1, fontSize: 16, fontFamily: ff.medium, paddingVertical: 12 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  addGhost: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', minHeight: 52 },
  chest: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, borderWidth: 1.5, padding: space.lg, marginTop: space.lg },
});
