import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LayeredArt } from '../../components/art/LayeredArt';
import { type PoseId } from '../../components/art/poses';
import { RankBadge } from '../../components/RankBadge';
import { Screen } from '../../components/Screen';
import { useToast } from '../../components/Toast';
import { Button, IconButton, IconDisc, Label, ProgressBar, T, tap, type IconName } from '../../components/ui';
import { chestXp, dayFocus, FOCUS_LABEL, parseDateKey, type DailyGoal, type DayFocus } from '../../lib/goals';
import { streak, weekStrip } from '../../lib/state';
import { useNewId, useStore } from '../../store';
import { radius, space, useTheme } from '../../theme';

const GOAL_ICON: Record<DailyGoal['kind'], IconName> = {
  warmup: 'flame',
  train: 'barbell',
  skill: 'git-network',
  water: 'water',
  protein: 'restaurant',
  custom: 'star',
};
const GOAL_COLOR: Record<DailyGoal['kind'], string> = {
  warmup: '#F97316',
  train: '#7C5CFF',
  skill: '#22D3EE',
  water: '#38BDF8',
  protein: '#F472B6',
  custom: '#FBBF24',
};
const FOCUS_ART: Record<DayFocus, { pose: PoseId; color: string }> = {
  push: { pose: 'pushup', color: '#F97316' },
  pull: { pose: 'pullup', color: '#38BDF8' },
  legs: { pose: 'squat', color: '#A78BFA' },
  rest: { pose: 'hollow', color: '#2DD4A0' },
};

function QuestRow({ goal, done, onToggle, onRemove }: { goal: DailyGoal; done: boolean; onToggle: () => void; onRemove?: () => void }) {
  const { c } = useTheme();
  const pop = useRef(new Animated.Value(done ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: done ? 1 : 0, friction: 5, tension: 120, useNativeDriver: true }).start();
  }, [done, pop]);
  const color = GOAL_COLOR[goal.kind];
  return (
    <Pressable
      testID={`goal-${goal.id}`}
      onPress={onToggle}
      onLongPress={onRemove}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={`${goal.title}. ${goal.detail}. ${goal.xp} EXP`}
      accessibilityHint={onRemove ? 'Long press to remove' : undefined}
      style={({ pressed }) => [styles.quest, { backgroundColor: c.surface, borderColor: done ? c.success + '66' : c.border }, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <IconDisc icon={GOAL_ICON[goal.kind]} color={done ? c.textFaint : color} size={42} />
      <View style={{ flex: 1, marginHorizontal: space.md }}>
        <Text numberOfLines={1} style={[styles.questTitle, { color: done ? c.textFaint : c.text }, done && { textDecorationLine: 'line-through' }]}>
          {goal.title}
        </Text>
        <Text numberOfLines={1} style={[styles.questDetail, { color: c.textFaint }]}>
          {goal.detail}
        </Text>
      </View>
      <Text style={[styles.xp, { color: done ? c.success : c.warning }]}>+{goal.xp}</Text>
      <View style={[styles.check, { borderColor: done ? c.success : c.border }]}>
        <Animated.View style={[styles.checkFill, { backgroundColor: c.success, transform: [{ scale: pop }] }]}>
          <Ionicons name="checkmark" size={18} color="#fff" />
        </Animated.View>
      </View>
    </Pressable>
  );
}

function Chest({ ready, opened, xp, onOpen, progress }: { ready: boolean; opened: boolean; xp: number; onOpen: () => void; progress: number }) {
  const { c } = useTheme();
  const wiggle = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!ready || opened) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wiggle, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: -1, duration: 120, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.delay(1400),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [ready, opened, wiggle]);
  return (
    <Pressable
      disabled={!ready || opened}
      onPress={onOpen}
      testID="chest"
      accessibilityRole="button"
      accessibilityLabel={opened ? `Chest opened, ${xp} EXP` : ready ? 'Open daily chest' : 'Daily chest, finish all quests to open'}
      style={[styles.chest, { backgroundColor: ready && !opened ? '#FBBF2420' : c.surface, borderColor: ready && !opened ? '#FBBF24' : c.border }]}
    >
      <Animated.View style={{ transform: [{ rotate: wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-10deg', '10deg'] }) }] }}>
        <IconDisc icon={opened ? 'gift-outline' : 'gift'} color="#FBBF24" size={48} filled={ready && !opened} />
      </Animated.View>
      <View style={{ flex: 1, marginLeft: space.md }}>
        <T v="h2">{opened ? `+${xp} EXP collected` : ready ? 'Open your chest' : 'Daily chest'}</T>
        {!opened && !ready ? (
          <View style={{ marginTop: 8 }}>
            <ProgressBar value={progress} color="#FBBF24" height={6} />
          </View>
        ) : (
          <T v="small" color="dim">
            {opened ? 'Come back tomorrow' : 'Tap for bonus EXP'}
          </T>
        )}
      </View>
      {ready && !opened ? <Ionicons name="chevron-forward" size={20} color="#FBBF24" /> : null}
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
  const art = FOCUS_ART[focus];
  const warmupDone = 'warmup' in state.day.done;

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

  return (
    <Screen>
      {/* Top bar: rank, streak, EXP, settings */}
      <View style={styles.top}>
        <Pressable onPress={() => router.push('/rank')} accessibilityRole="button" accessibilityLabel={`Level ${level.level}, ${rank.id}-Rank`} style={styles.rankBtn}>
          <RankBadge rank={rank} size={40} />
          <View style={{ marginLeft: 8, width: 96 }}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 15 }}>Lv {level.level}</Text>
            <View style={{ marginTop: 4 }}>
              <ProgressBar value={level.progress} color={rank.color} height={5} />
            </View>
          </View>
        </Pressable>
        <View style={{ flex: 1 }} />
        <View style={[styles.stat, { backgroundColor: c.surface, borderColor: c.border }]} accessibilityLabel={`${days} day streak`}>
          <Ionicons name="flame" size={18} color={days > 0 ? '#F97316' : c.textFaint} />
          <Text style={[styles.statText, { color: days > 0 ? '#F97316' : c.textFaint }]}>{days}</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: c.surface, borderColor: c.border }]} accessibilityLabel={`${state.xp} total EXP`}>
          <Ionicons name="flash" size={16} color={c.warning} />
          <Text style={[styles.statText, { color: c.warning }]}>{state.xp}</Text>
        </View>
        <IconButton icon="settings-outline" label="Settings" size={40} onPress={() => router.push('/settings')} testID="open-settings" />
      </View>

      {/* Streak week */}
      <View style={[styles.week, { backgroundColor: c.surface, borderColor: c.border }]}>
        {week.map((d) => {
          const label = parseDateKey(d.date).toLocaleDateString(undefined, { weekday: 'narrow' });
          return (
            <View key={d.date} style={styles.day}>
              <Text style={[styles.dayLabel, { color: d.today ? c.text : c.textFaint }]}>{label}</Text>
              <View style={[styles.dayDot, { backgroundColor: d.active ? '#F97316' : c.surfaceHigh, borderColor: d.today ? c.text : 'transparent' }]}>
                {d.active ? <Ionicons name={d.perfect ? 'star' : 'flame'} size={14} color="#fff" /> : null}
              </View>
            </View>
          );
        })}
      </View>

      {/* Today's session */}
      <Pressable onPress={() => router.push('/warmup')} accessibilityRole="button" accessibilityLabel={warmupDone ? 'Warm-up done' : 'Start warm-up'} testID="start-session">
        <View style={[styles.session, { backgroundColor: art.color + '1F', borderColor: art.color + '55' }]}>
          <View style={{ flex: 1 }}>
            <Label color={art.color}>{FOCUS_LABEL[focus]}</Label>
            <T v="h1" style={{ marginTop: 4 }}>
              {warmupDone ? 'Warmed up' : 'Ready?'}
            </T>
            <View style={[styles.go, { backgroundColor: warmupDone ? c.success : art.color }]}>
              <Ionicons name={warmupDone ? 'checkmark' : 'play'} size={16} color="#fff" />
              <Text style={styles.goText}>{warmupDone ? 'Done' : 'Warm up · 5 min'}</Text>
            </View>
          </View>
          <LayeredArt pose={art.pose} color={art.color} size={128} sparkles depth={7} />
        </View>
      </Pressable>

      {/* Quests */}
      <View style={styles.sectionRow}>
        <Label>Daily quests</Label>
        <Text style={{ color: c.textDim, fontWeight: '800' }}>
          {doneCount}/{goals.length}
        </Text>
      </View>
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
              <Ionicons name="checkmark" size={20} color="#fff" />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setAdding(true)} style={[styles.addGhost, { borderColor: c.border }]} accessibilityRole="button" testID="add-quest">
            <Ionicons name="add" size={18} color={c.textDim} />
            <Text style={{ color: c.textDim, fontWeight: '700' }}>Add quest</Text>
          </Pressable>
        )}
      </View>

      <View style={{ marginTop: space.lg }}>
        <Chest
          ready={allDone}
          opened={state.day.chest > 0}
          xp={state.day.chest || chestXp(today)}
          progress={goals.length ? doneCount / goals.length : 0}
          onOpen={() => {
            dispatch({ type: 'claimChest', goals, today, now: Date.now() });
            tap('heavy');
            toast(`Chest opened! +${chestXp(today)} EXP`, 'xp');
          }}
        />
      </View>
      {state.custom.length > 0 ? (
        <T v="small" color="faint" center style={{ marginTop: space.md }}>
          Long press your own quests to remove them
        </T>
      ) : null}
      <View style={{ height: space.lg }} />
      <Button label="Open skill map" variant="secondary" icon="git-network" onPress={() => router.push('/skills')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  rankBtn: { flexDirection: 'row', alignItems: 'center' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 40, borderRadius: radius.pill, borderWidth: 1 },
  statText: { fontWeight: '900', fontSize: 15 },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.lg, borderRadius: radius.lg, borderWidth: 1, paddingVertical: space.md, paddingHorizontal: space.md },
  day: { alignItems: 'center', gap: 6, flex: 1 },
  dayLabel: { fontSize: 12, fontWeight: '800' },
  dayDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  session: { flexDirection: 'row', alignItems: 'center', marginTop: space.lg, borderRadius: radius.lg, borderWidth: 1, padding: space.lg, overflow: 'hidden' },
  go: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: space.md, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill },
  goText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.xl, marginBottom: space.md },
  quest: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: 1, padding: space.md, minHeight: 68 },
  questTitle: { fontWeight: '800', fontSize: 15 },
  questDetail: { fontSize: 13, marginTop: 2 },
  xp: { fontWeight: '900', fontSize: 14, marginRight: space.md },
  check: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  checkFill: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  addRow: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: 1, paddingLeft: space.md, paddingRight: 6, minHeight: 56 },
  addInput: { flex: 1, fontSize: 15, fontWeight: '600', paddingVertical: 12 },
  addBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  addGhost: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', minHeight: 50 },
  chest: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, borderWidth: 1.5, padding: space.lg },
});
