import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { LayeredArt } from '../../components/art/LayeredArt';
import { Pictogram } from '../../components/art/Illustrations';
import { BRANCH_POSE, SKILL_POSE } from '../../components/art/poses';
import { useToast } from '../../components/Toast';
import { Button, IconButton, Segmented, T, tap } from '../../components/ui';
import { BRANCHES, canCompleteNextStage, SKILL_BY_ID, SKILLS, skillDepth, skillStatus, stagesDone, type BranchId, type Skill, type SkillStatus } from '../../lib/skills';
import { useStore } from '../../store';
import { ff, LIME, radius, space, useTheme } from '../../theme';

const NODE = 76;
const SWING = 80;
const UNIT_NAME: Record<number, string> = { 1: 'Foundations', 2: 'Builder', 3: 'Strength', 4: 'Advanced', 5: 'Elite' };

interface Unit {
  tier: number;
  skills: Skill[];
}

function unitsFor(branch: BranchId): Unit[] {
  const list = SKILLS.filter((k) => k.branch === branch).sort((a, b) => a.tier - b.tier || skillDepth(a.id) - skillDepth(b.id));
  const units: Unit[] = [];
  for (const k of list) {
    const last = units[units.length - 1];
    if (last && last.tier === k.tier) last.skills.push(k);
    else units.push({ tier: k.tier, skills: [k] });
  }
  return units;
}

/** One round lesson button on the path. Static art, so the list stays cheap to draw. */
const PathNode = memo(function PathNode({ skill, status, done, current, offset, onPress }: { skill: Skill; status: SkillStatus; done: number; current: boolean; offset: number; onPress: (id: string) => void }) {
  const { c } = useTheme();
  const locked = status === 'locked';
  const mastered = status === 'mastered';
  const face = mastered || current ? c.primary : locked ? c.muted : c.surfaceHigh;
  const edge = mastered || current ? '#7FA30F' : locked ? c.mutedEdge : c.border;
  const ink = mastered || current ? '#0A0A0A' : locked ? c.textFaint : c.primaryText;
  const total = skill.stages.length;
  const ring = NODE + 16;
  const r = ring / 2 - 3;
  const circ = 2 * Math.PI * r;
  return (
    <View style={[styles.nodeWrap, { transform: [{ translateX: offset }] }]}>
      {current ? <StartBubble /> : null}
      <Pressable
        testID={`node-${skill.id}`}
        onPress={() => onPress(skill.id)}
        accessibilityRole="button"
        accessibilityLabel={`${skill.name}, ${mastered ? 'mastered' : locked ? 'locked' : `${done} of ${total} stages`}`}
        style={{ width: ring, height: ring, alignItems: 'center', justifyContent: 'center' }}
      >
        {({ pressed }) => (
          <>
            {!locked && !mastered ? (
              <Svg width={ring} height={ring} style={StyleSheet.absoluteFill}>
                <Circle cx={ring / 2} cy={ring / 2} r={r} stroke={c.muted} strokeWidth={5} fill="none" />
                {done > 0 ? (
                  <Circle
                    cx={ring / 2}
                    cy={ring / 2}
                    r={r}
                    stroke={c.primary}
                    strokeWidth={5}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(circ * done) / total} ${circ}`}
                    transform={`rotate(-90 ${ring / 2} ${ring / 2})`}
                  />
                ) : null}
              </Svg>
            ) : null}
            <View style={{ width: NODE, height: NODE + 6 }}>
              <View style={[styles.nodeEdge, { backgroundColor: edge }]} />
              <View style={[styles.nodeFace, { backgroundColor: face, top: pressed ? 5 : 0 }]}>
                <Pictogram pose={SKILL_POSE[skill.id]} size={NODE - 14} color={ink} />
              </View>
            </View>
            {mastered ? (
              <View style={[styles.badge, { backgroundColor: c.text, borderColor: c.bg }]}>
                <Ionicons name="checkmark" size={14} color={c.bg} />
              </View>
            ) : locked ? (
              <View style={[styles.badge, { backgroundColor: c.surfaceHigh, borderColor: c.bg }]}>
                <Ionicons name="lock-closed" size={11} color={c.textFaint} />
              </View>
            ) : null}
          </>
        )}
      </Pressable>
      <Text numberOfLines={2} style={[styles.nodeName, { color: locked ? c.textFaint : c.text }]}>
        {skill.name}
      </Text>
    </View>
  );
});

function StartBubble() {
  const { c } = useTheme();
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);
  return (
    <Animated.View pointerEvents="none" style={[styles.bubble, { transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] }]}>
      <View style={[styles.bubbleBox, { backgroundColor: c.surface, borderColor: c.primary }]}>
        <Text style={{ color: c.primaryText, fontFamily: ff.bold, fontSize: 13, letterSpacing: 0.6 }}>START</Text>
      </View>
      <View style={[styles.bubbleTip, { borderTopColor: c.primary }]} />
    </Animated.View>
  );
}

export default function SkillPath() {
  const { state, dispatch } = useStore();
  const { c } = useTheme();
  const toast = useToast();
  const [branch, setBranch] = useState<BranchId>('push');
  const [selected, setSelected] = useState<string | null>(null);
  const scroll = useRef<ScrollViewInstance>(null);
  const nodeY = useRef<Record<string, { unit: number; y: number }>>({});
  const unitY = useRef<number[]>([]);

  const units = useMemo(() => unitsFor(branch), [branch]);
  const statusOf = useCallback((id: string): SkillStatus => skillStatus(state.progress, id), [state.progress]);
  const ordered = useMemo(() => units.flatMap((u) => u.skills), [units]);
  const currentId = ordered.find((k) => {
    const s = statusOf(k.id);
    return s === 'available' || s === 'in-progress';
  })?.id;
  const info = BRANCHES.find((b) => b.id === branch)!;
  const branchMastered = ordered.filter((k) => statusOf(k.id) === 'mastered').length;
  const totalMastered = SKILLS.filter((k) => statusOf(k.id) === 'mastered').length;

  // Bring the current lesson into view when the branch changes.
  useEffect(() => {
    setSelected(null);
    const t = setTimeout(() => {
      const n = currentId ? nodeY.current[currentId] : undefined;
      const y = n ? (unitY.current[n.unit] ?? 0) + 90 + n.y : 0;
      scroll.current?.scrollTo({ y: Math.max(0, y - 160), animated: true });
    }, 120);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch]);

  // Close the lesson sheet when leaving the tab.
  useFocusEffect(useCallback(() => () => setSelected(null), []));

  const onNode = useCallback((id: string) => {
    tap();
    setSelected((s) => (s === id ? null : id));
  }, []);

  const sel = selected ? SKILL_BY_ID[selected] : null;
  const selStatus = sel ? statusOf(sel.id) : 'locked';
  const selDone = sel ? stagesDone(state.progress, sel.id) : 0;
  const sheet = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(sheet, { toValue: selected ? 1 : 0, friction: 9, tension: 80, useNativeDriver: true }).start();
  }, [selected, sheet]);

  const completeSelected = () => {
    if (!sel) return;
    const check = canCompleteNextStage(state.progress, sel.id);
    if (!check.ok) return toast(check.reason, 'error');
    dispatch({ type: 'completeStage', skillId: sel.id, now: Date.now() });
    tap('success');
    toast(check.mastered ? `Mastered! +${check.xp} EXP` : `+${check.xp} EXP`, 'xp');
  };

  let index = 0;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: c.bg }}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <T v="h1">Skills</T>
            <View style={[styles.count, { backgroundColor: c.surface }]}>
              <Ionicons name="trophy" size={14} color={c.primaryText} />
              <Text style={{ color: c.text, fontFamily: ff.semibold, fontSize: 14 }}>
                {totalMastered}/{SKILLS.length}
              </Text>
            </View>
          </View>
          <View style={{ marginTop: space.md }}>
            <Segmented
              options={BRANCHES.map((b) => ({ value: b.id, label: b.id === 'core' ? 'Core' : b.name }))}
              value={branch}
              onChange={setBranch}
              testIDPrefix="branch"
            />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView ref={scroll} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} onScrollBeginDrag={() => selected && setSelected(null)}>
        <View style={styles.inner}>
          {units.map((u, ui) => {
            const m = u.skills.filter((k) => statusOf(k.id) === 'mastered').length;
            const lit = ui === 0 || u.skills.some((k) => statusOf(k.id) !== 'locked');
            const fg = lit ? c.onPrimary : c.textDim;
            return (
              <View key={`${branch}-${u.tier}`} onLayout={(e) => (unitY.current[ui] = e.nativeEvent.layout.y)}>
                <View style={[styles.unit, { backgroundColor: lit ? c.primary : c.surface }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.unitLabel, { color: fg }]}>UNIT {ui + 1}</Text>
                    <Text style={[styles.unitTitle, { color: lit ? c.onPrimary : c.text }]}>{UNIT_NAME[u.tier]}</Text>
                  </View>
                  <Text style={[styles.unitCount, { color: fg }]}>
                    {m}/{u.skills.length}
                  </Text>
                </View>
                <View style={styles.path}>
                  {u.skills.map((k) => {
                    const i = index++;
                    // Wind left and right like a trail: 0, +, ++, +, 0, -, --, -.
                    const offset = Math.round(Math.sin((i * Math.PI) / 4) * SWING);
                    return (
                      <View key={k.id} onLayout={(e) => (nodeY.current[k.id] = { unit: ui, y: e.nativeEvent.layout.y })}>
                        <PathNode skill={k} status={statusOf(k.id)} done={stagesDone(state.progress, k.id)} current={k.id === currentId} offset={offset} onPress={onNode} />
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}

          {/* Branch goal */}
          <View style={[styles.goal, { backgroundColor: c.surface }]}>
            <LayeredArt pose={BRANCH_POSE[branch]} color={LIME} size={120} state={branchMastered === ordered.length ? 'done' : 'open'} depth={6} sparkles surface={c.surfaceHigh} />
            <T v="label" color="faint" style={{ marginTop: space.md }}>
              BRANCH GOAL
            </T>
            <T v="h1" style={{ marginTop: 2 }}>
              {info.signature}
            </T>
            <T color="dim" style={{ marginTop: 2 }}>
              {branchMastered}/{ordered.length} skills mastered
            </T>
          </View>
        </View>
      </ScrollView>

      {/* Lesson sheet */}
      <Animated.View
        pointerEvents={selected ? 'auto' : 'none'}
        style={[styles.sheet, { backgroundColor: c.surface, opacity: sheet, transform: [{ translateY: sheet.interpolate({ inputRange: [0, 1], outputRange: [260, 0] }) }] }]}
      >
        {sel ? (
          <>
            <View style={styles.sheetTop}>
              <View style={{ flex: 1 }}>
                <T v="label" color={selStatus === 'locked' ? 'faint' : 'lime'}>
                  {selStatus === 'mastered' ? 'MASTERED' : selStatus === 'locked' ? 'LOCKED' : `STAGE ${selDone + 1} OF ${sel.stages.length}`}
                </T>
                <T v="h1" lines={1} style={{ marginTop: 2 }}>
                  {sel.name}
                </T>
              </View>
              <IconButton icon="close" label="Close" size={40} onPress={() => setSelected(null)} />
            </View>
            <View style={styles.dots}>
              {sel.stages.map((s2, i) => (
                <View key={s2.id} style={[styles.stageDot, { backgroundColor: i < selDone ? c.primary : c.muted }]} />
              ))}
            </View>
            {selStatus === 'locked' ? (
              <View style={{ marginTop: space.md }}>
                <T v="small" color="dim">
                  Master these first
                </T>
                <View style={styles.reqRow}>
                  {sel.requires.map((r) => {
                    const ok = statusOf(r) === 'mastered';
                    return (
                      <Pressable
                        key={r}
                        onPress={() => {
                          const b = SKILL_BY_ID[r].branch;
                          if (b !== branch) setBranch(b);
                          setTimeout(() => setSelected(r), b !== branch ? 120 : 0);
                        }}
                        style={[styles.req, { backgroundColor: c.surfaceHigh }]}
                        accessibilityRole="button"
                      >
                        <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={ok ? c.primaryText : c.textDim} />
                        <Text style={{ color: c.text, fontFamily: ff.medium }}>{SKILL_BY_ID[r].name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : selStatus === 'mastered' ? (
              <T color="dim" style={{ marginTop: space.md }}>
                All {sel.stages.length} stages cleared.
              </T>
            ) : (
              <View style={[styles.next, { backgroundColor: c.surfaceHigh }]}>
                <T v="h2">{sel.stages[selDone].name}</T>
                <T color="dim" style={{ marginTop: 2 }}>
                  {sel.stages[selDone].target}
                </T>
              </View>
            )}
            <View style={styles.sheetBtns}>
              <Button label="Details" variant="secondary" onPress={() => router.push({ pathname: '/skill/[id]', params: { id: sel.id } })} style={{ flex: 1 }} testID="sheet-details" />
              {selStatus === 'available' || selStatus === 'in-progress' ? (
                <Button label="I can do it" icon="checkmark" onPress={completeSelected} style={{ flex: 1.4 }} testID="sheet-complete" />
              ) : null}
            </View>
          </>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.sm, width: '100%', maxWidth: 640, alignSelf: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  count: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 36, borderRadius: radius.pill },
  list: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: 300 },
  inner: { width: '100%', maxWidth: 640, alignSelf: 'center' },
  unit: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, paddingHorizontal: space.lg, paddingVertical: space.md, marginTop: space.lg },
  unitLabel: { fontFamily: ff.semibold, fontSize: 12, letterSpacing: 0.8, opacity: 0.75 },
  unitTitle: { fontFamily: ff.semibold, fontSize: 22, letterSpacing: -0.4, marginTop: 1 },
  unitCount: { fontFamily: ff.semibold, fontSize: 16 },
  path: { alignItems: 'center', paddingVertical: space.lg, gap: space.lg },
  nodeWrap: { alignItems: 'center', width: 140 },
  nodeEdge: { position: 'absolute', left: 0, top: 6, width: NODE, height: NODE, borderRadius: NODE / 2 },
  nodeFace: { position: 'absolute', left: 0, width: NODE, height: NODE, borderRadius: NODE / 2, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', right: 8, bottom: 6, width: 24, height: 24, borderRadius: 12, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  nodeName: { fontFamily: ff.medium, fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 16 },
  bubble: { alignItems: 'center', marginBottom: 4 },
  bubbleBox: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.sm, borderWidth: 2 },
  bubbleTip: { width: 0, height: 0, borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  goal: { alignItems: 'center', borderRadius: radius.lg, padding: space.xl, marginTop: space.xl },
  sheet: { position: 'absolute', left: space.md, right: space.md, bottom: space.md, borderRadius: radius.lg, padding: space.lg, maxWidth: 560, alignSelf: 'center' },
  sheetTop: { flexDirection: 'row', alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 5, marginTop: space.md },
  stageDot: { flex: 1, height: 6, borderRadius: 3 },
  next: { marginTop: space.md, borderRadius: radius.md, padding: space.md },
  reqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  req: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 40, borderRadius: radius.pill },
  sheetBtns: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
});
