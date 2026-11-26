import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Platform, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Stop } from 'react-native-svg';
import { LayeredArt } from '../../components/art/LayeredArt';
import { SKILL_POSE } from '../../components/art/poses';
import { RankBadge } from '../../components/RankBadge';
import { useToast } from '../../components/Toast';
import { Button, IconButton, tap, T } from '../../components/ui';
import { BRANCHES, canCompleteNextStage, SKILL_BY_ID, SKILLS, skillStatus, stagesDone, type BranchId, type SkillStatus } from '../../lib/skills';
import { BRANCH_ANGLE, CENTER, layoutTree, WORLD } from '../../lib/treeLayout';
import { useStore } from '../../store';
import { radius, space, useTheme } from '../../theme';

const MIN_SCALE = 0.35;
const MAX_SCALE = 1.6;
const NODE = 76;
const BRANCH_COLOR: Record<BranchId, string> = Object.fromEntries(BRANCHES.map((b) => [b.id, b.color])) as Record<BranchId, string>;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Deterministic star field so it does not jump between renders. */
function stars(count: number, seed: number, spread: number) {
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  return Array.from({ length: count }, () => ({ x: rnd() * spread, y: rnd() * spread, r: 0.6 + rnd() * 1.6, o: 0.25 + rnd() * 0.6 }));
}

export default function SkillMap() {
  const { state, dispatch } = useStore();
  const { c, dark } = useTheme();
  const toast = useToast();
  const { nodes, edges } = useMemo(layoutTree, []);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState<string | null>(null);

  // Camera: pan is the screen offset of the world centre, scale is zoom.
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 60 })).current;
  const scale = useRef(new Animated.Value(0.82)).current;
  const cam = useRef({ x: 0, y: 60, s: 0.82 });
  const gesture = useRef({ x: 0, y: 0, s: 1, dist: 0, pinch: false });

  const setCam = useCallback(
    (x: number, y: number, s: number) => {
      const sc = clamp(s, MIN_SCALE, MAX_SCALE);
      const lim = CENTER * sc;
      cam.current = { x: clamp(x, -lim, lim), y: clamp(y, -lim, lim), s: sc };
      pan.setValue({ x: cam.current.x, y: cam.current.y });
      scale.setValue(sc);
    },
    [pan, scale],
  );

  const flyTo = useCallback(
    (x: number, y: number, s: number) => {
      const sc = clamp(s, MIN_SCALE, MAX_SCALE);
      const lim = CENTER * sc;
      cam.current = { x: clamp(x, -lim, lim), y: clamp(y, -lim, lim), s: sc };
      Animated.parallel([
        Animated.timing(pan, { toValue: { x: cam.current.x, y: cam.current.y }, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.timing(scale, { toValue: sc, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      ]).start();
    },
    [pan, scale],
  );

  const focusNode = useCallback(
    (id: string, s = Math.max(cam.current.s, 0.9)) => {
      const n = nodes[id];
      // Keep the node a little above centre so the bottom sheet does not cover it.
      flyTo(-(n.x - CENTER) * s, -(n.y - CENTER) * s - size.h * 0.18, s);
    },
    [flyTo, nodes, size.h],
  );

  const dist = (t: readonly { pageX: number; pageY: number }[]) => Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (e, g) => e.nativeEvent.touches.length >= 2 || Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
        onPanResponderGrant: (e) => {
          const t = e.nativeEvent.touches;
          gesture.current = { x: cam.current.x, y: cam.current.y, s: cam.current.s, dist: t.length >= 2 ? dist(t) : 0, pinch: t.length >= 2 };
        },
        onPanResponderMove: (e, g) => {
          const t = e.nativeEvent.touches;
          const st = gesture.current;
          if (t.length >= 2) {
            if (!st.pinch) {
              gesture.current = { x: cam.current.x, y: cam.current.y, s: cam.current.s, dist: dist(t), pinch: true };
              return;
            }
            const ratio = dist(t) / (st.dist || 1);
            const s = clamp(st.s * ratio, MIN_SCALE, MAX_SCALE);
            setCam(st.x * (s / st.s), st.y * (s / st.s), s);
          } else if (!st.pinch) {
            setCam(st.x + g.dx, st.y + g.dy, st.s);
          }
        },
        onPanResponderRelease: () => {
          gesture.current.pinch = false;
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [setCam],
  );

  // Mouse wheel zoom on web.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wheelRef = useRef<any>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = wheelRef.current as unknown as HTMLElement | null;
    if (!el || !el.addEventListener) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const { x, y, s } = cam.current;
      const ns = clamp(s * (ev.deltaY > 0 ? 0.9 : 1.1), MIN_SCALE, MAX_SCALE);
      setCam(x * (ns / s), y * (ns / s), ns);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [setCam, size.w]);

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const statusOf = (id: string): SkillStatus => skillStatus(state.progress, id);
  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  const far = useMemo(() => stars(90, 7, 1600), []);
  const near = useMemo(() => stars(45, 99, 1600), []);
  const mastered = SKILLS.filter((k) => statusOf(k.id) === 'mastered').length;

  const sel = selected ? SKILL_BY_ID[selected] : null;
  const selStatus = sel ? statusOf(sel.id) : 'locked';
  const selDone = sel ? stagesDone(state.progress, sel.id) : 0;
  const sheet = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(sheet, { toValue: selected ? 1 : 0, friction: 9, tension: 70, useNativeDriver: true }).start();
  }, [selected, sheet]);

  const completeSelected = () => {
    if (!sel) return;
    const check = canCompleteNextStage(state.progress, sel.id);
    if (!check.ok) return toast(check.reason, 'error');
    dispatch({ type: 'completeStage', skillId: sel.id, now: Date.now() });
    tap('success');
    toast(check.mastered ? `Mastered! +${check.xp} EXP` : `+${check.xp} EXP`, 'xp');
  };

  const starLayer = (list: ReturnType<typeof stars>, factor: number, color: string) => (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: size.w / 2 - 800,
        top: size.h / 2 - 800,
        width: 1600,
        height: 1600,
        transform: [
          { translateX: Animated.multiply(pan.x, factor) },
          { translateY: Animated.multiply(pan.y, factor) },
        ],
      }}
    >
      <Svg width={1600} height={1600}>
        {list.map((st, i) => (
          <Circle key={i} cx={st.x} cy={st.y} r={st.r} fill={color} opacity={st.o} />
        ))}
      </Svg>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: dark ? '#05060C' : '#EEF0F7' }}>
      <View ref={wheelRef} style={StyleSheet.absoluteFill} onLayout={onLayout} {...responder.panHandlers}>
        {size.w > 0 ? (
          <>
            {/* Deep space: two star layers drift at different speeds for depth. */}
            <Animated.View pointerEvents="none" style={{ position: 'absolute', left: size.w / 2 - 700, top: size.h / 2 - 700, transform: [{ translateX: Animated.multiply(pan.x, 0.08) }, { translateY: Animated.multiply(pan.y, 0.08) }] }}>
              <Svg width={1400} height={1400}>
                <Defs>
                  {BRANCHES.map((b) => (
                    <RadialGradient key={b.id} id={`neb-${b.id}`} cx="50%" cy="50%" r="50%">
                      <Stop offset="0" stopColor={b.color} stopOpacity={dark ? 0.22 : 0.14} />
                      <Stop offset="1" stopColor={b.color} stopOpacity="0" />
                    </RadialGradient>
                  ))}
                </Defs>
                {BRANCHES.map((b) => {
                  const a = (BRANCH_ANGLE[b.id] * Math.PI) / 180;
                  return <Circle key={b.id} cx={700 + Math.cos(a) * 320} cy={700 + Math.sin(a) * 320} r={420} fill={`url(#neb-${b.id})`} />;
                })}
              </Svg>
            </Animated.View>
            {starLayer(far, 0.15, dark ? '#FFFFFF' : '#8A93AE')}
            {starLayer(near, 0.4, dark ? '#C4B5FD' : '#7C5CFF')}

            {/* The world: edges, hub and nodes, panned and zoomed together. */}
            <Animated.View
              style={{
                position: 'absolute',
                left: size.w / 2 - CENTER,
                top: size.h / 2 - CENTER,
                width: WORLD,
                height: WORLD,
                transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }],
              }}
            >
              <Svg width={WORLD} height={WORLD} style={StyleSheet.absoluteFill} pointerEvents="none">
                {/* Orbits */}
                {[175, 310, 445, 580, 715].map((r) => (
                  <Circle key={r} cx={CENTER} cy={CENTER} r={r} stroke={dark ? '#FFFFFF' : '#1E2540'} strokeOpacity={0.05} strokeWidth={1.5} fill="none" strokeDasharray="3 10" />
                ))}
                {/* Hub spokes into each branch */}
                {BRANCHES.map((b) => {
                  const roots = SKILLS.filter((k) => k.branch === b.id && k.requires.length === 0);
                  return roots.map((k) => {
                    const n = nodes[k.id];
                    const lit = statusOf(k.id) !== 'locked';
                    return <Line key={k.id} x1={CENTER} y1={CENTER} x2={n.x} y2={n.y} stroke={b.color} strokeOpacity={lit ? 0.5 : 0.15} strokeWidth={3} strokeLinecap="round" />;
                  });
                })}
                {edges.map((e) => {
                  const a = nodes[e.from];
                  const b = nodes[e.to];
                  const color = BRANCH_COLOR[SKILL_BY_ID[e.to].branch];
                  const lit = statusOf(e.from) === 'mastered';
                  const d = e.cross ? `M${a.x} ${a.y} Q${CENTER + (a.x + b.x - 2 * CENTER) * 0.25} ${CENTER + (a.y + b.y - 2 * CENTER) * 0.25} ${b.x} ${b.y}` : `M${a.x} ${a.y} L${b.x} ${b.y}`;
                  return (
                    <G key={`${e.from}-${e.to}`}>
                      {lit ? <Path d={d} stroke={color} strokeOpacity={0.25} strokeWidth={10} strokeLinecap="round" fill="none" /> : null}
                      <Path
                        d={d}
                        stroke={lit ? color : dark ? '#4A5270' : '#B4BACB'}
                        strokeOpacity={lit ? 0.95 : 0.7}
                        strokeWidth={lit ? 3.5 : 2}
                        strokeDasharray={e.cross ? '6 8' : undefined}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </G>
                  );
                })}
              </Svg>

              <Hub />

              {SKILLS.map((k) => {
                const n = nodes[k.id];
                const st = statusOf(k.id);
                const color = BRANCH_COLOR[k.branch];
                const done = stagesDone(state.progress, k.id);
                const isSel = selected === k.id;
                return (
                  <Pressable
                    key={k.id}
                    testID={`node-${k.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`${k.name}, ${st}, ${done} of ${k.stages.length}`}
                    onPress={() => {
                      tap();
                      setSelected(k.id);
                      focusNode(k.id);
                    }}
                    style={{ position: 'absolute', left: n.x - 62, top: n.y - NODE / 2 - 6, width: 124, alignItems: 'center' }}
                  >
                    {st === 'available' || st === 'in-progress' ? (
                      <Animated.View
                        pointerEvents="none"
                        style={{
                          position: 'absolute',
                          top: -2,
                          width: NODE + 16,
                          height: NODE + 16,
                          borderRadius: (NODE + 16) / 2,
                          borderWidth: 2,
                          borderColor: color,
                          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.7] }),
                          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.06] }) }],
                        }}
                      />
                    ) : null}
                    {isSel ? <View style={{ position: 'absolute', top: -6, width: NODE + 24, height: NODE + 24, borderRadius: (NODE + 24) / 2, backgroundColor: color + '33' }} /> : null}
                    <View style={{ marginTop: 6 }}>
                      <LayeredArt pose={SKILL_POSE[k.id]} color={color} size={NODE} state={st === 'mastered' ? 'done' : st === 'locked' ? 'locked' : 'open'} depth={3} surface={c.surface} />
                      {st === 'locked' ? (
                        <View style={[styles.lock, { backgroundColor: c.surfaceHigh, borderColor: c.border }]}>
                          <Ionicons name="lock-closed" size={11} color={c.textFaint} />
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.count, { color: st === 'locked' ? c.textFaint : color }]}>
                      {done}/{k.stages.length}
                    </Text>
                    <Text numberOfLines={2} style={[styles.nodeName, { color: st === 'locked' ? c.textFaint : c.text }]}>
                      {k.name}
                    </Text>
                  </Pressable>
                );
              })}
            </Animated.View>
          </>
        ) : null}
      </View>

      {/* Header, over a fade so nodes do not clash with it */}
      <LinearGradient pointerEvents="none" colors={[dark ? '#05060C' : '#EEF0F7', (dark ? '#05060C' : '#EEF0F7') + '00']} style={styles.fade} />
      <SafeAreaView edges={['top']} pointerEvents="box-none" style={styles.header}>
        <View style={styles.headerRow} pointerEvents="box-none">
          <View>
            <T v="h1">Skill Map</T>
            <T v="small" color="dim">
              {mastered} of {SKILLS.length} mastered
            </T>
          </View>
        </View>
        <View style={styles.branchRow} pointerEvents="box-none">
          {BRANCHES.map((b) => {
            const list = SKILLS.filter((k) => k.branch === b.id);
            const m = list.filter((k) => statusOf(k.id) === 'mastered').length;
            return (
              <Pressable
                key={b.id}
                accessibilityRole="button"
                accessibilityLabel={`Go to ${b.name}`}
                onPress={() => {
                  tap();
                  setSelected(null);
                  const a = (BRANCH_ANGLE[b.id] * Math.PI) / 180;
                  const s = 0.7;
                  flyTo(-Math.cos(a) * 380 * s, -Math.sin(a) * 380 * s + 40, s);
                }}
                style={[styles.branchChip, { backgroundColor: c.surface + 'E6', borderColor: b.color + '66' }]}
              >
                <View style={[styles.dot, { backgroundColor: b.color }]} />
                <Text style={[styles.branchText, { color: c.text }]}>{b.name}</Text>
                <Text style={[styles.branchCount, { color: b.color }]}>
                  {m}/{list.length}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>

      {/* Zoom controls */}
      <View style={[styles.zoom, { bottom: selected ? 250 : 24 }]} pointerEvents="box-none">
        <IconButton icon="add" label="Zoom in" onPress={() => flyTo(cam.current.x * 1.25, cam.current.y * 1.25, cam.current.s * 1.25)} />
        <IconButton icon="remove" label="Zoom out" onPress={() => flyTo(cam.current.x * 0.8, cam.current.y * 0.8, cam.current.s * 0.8)} />
        <IconButton icon="locate" label="Recenter" onPress={() => flyTo(0, 60, 0.82)} testID="recenter" />
      </View>

      {/* Bottom sheet for the selected skill */}
      <Animated.View
        pointerEvents={selected ? 'auto' : 'none'}
        style={[
          styles.sheet,
          { backgroundColor: c.surface, borderColor: c.border, opacity: sheet, transform: [{ translateY: sheet.interpolate({ inputRange: [0, 1], outputRange: [280, 0] }) }] },
        ]}
      >
        {sel ? (
          <>
            <View style={styles.sheetTop}>
              <LayeredArt pose={SKILL_POSE[sel.id]} color={BRANCH_COLOR[sel.branch]} size={64} state={selStatus === 'mastered' ? 'done' : selStatus === 'locked' ? 'locked' : 'open'} surface={c.surfaceHigh} />
              <View style={{ flex: 1, marginLeft: space.md }}>
                <T v="h2" lines={1}>
                  {sel.name}
                </T>
                <View style={styles.dots}>
                  {sel.stages.map((s2, i) => (
                    <View key={s2.id} style={[styles.stageDot, { backgroundColor: i < selDone ? BRANCH_COLOR[sel.branch] : c.border }]} />
                  ))}
                </View>
              </View>
              <IconButton icon="close" label="Close" size={36} onPress={() => setSelected(null)} />
            </View>
            {selStatus === 'locked' ? (
              <View style={{ marginTop: space.md }}>
                <T v="small" color="dim">
                  Unlock by mastering
                </T>
                <View style={styles.reqRow}>
                  {sel.requires.map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => {
                        setSelected(r);
                        focusNode(r);
                      }}
                      style={[styles.req, { borderColor: statusOf(r) === 'mastered' ? c.success : c.border, backgroundColor: c.surfaceHigh }]}
                      accessibilityRole="button"
                    >
                      <Ionicons name={statusOf(r) === 'mastered' ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={statusOf(r) === 'mastered' ? c.success : c.textDim} />
                      <Text style={{ color: c.text, fontWeight: '700' }}>{SKILL_BY_ID[r].name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : selStatus === 'mastered' ? (
              <T color="dim" style={{ marginTop: space.md }}>
                Mastered. All {sel.stages.length} stages cleared.
              </T>
            ) : (
              <View style={[styles.next, { backgroundColor: c.surfaceHigh }]}>
                <T v="label" color={BRANCH_COLOR[sel.branch]}>
                  NEXT · STAGE {selDone + 1}
                </T>
                <T v="h2" style={{ marginTop: 2 }}>
                  {sel.stages[selDone].name}
                </T>
                <T color="dim">{sel.stages[selDone].target}</T>
              </View>
            )}
            <View style={styles.sheetBtns}>
              <Button label="Details" variant="secondary" onPress={() => router.push({ pathname: '/skill/[id]', params: { id: sel.id } })} style={{ flex: 1 }} testID="sheet-details" />
              {selStatus === 'available' || selStatus === 'in-progress' ? (
                <Button label="I can do it" icon="checkmark" color={BRANCH_COLOR[sel.branch]} onPress={completeSelected} style={{ flex: 1.4 }} testID="sheet-complete" />
              ) : null}
            </View>
          </>
        ) : null}
      </Animated.View>
    </View>
  );
}

function Hub() {
  const { rank, level } = useStore();
  const { c } = useTheme();
  const R = 74;
  const arc = (start: number, end: number, r: number) => {
    const a0 = (start * Math.PI) / 180;
    const a1 = (end * Math.PI) / 180;
    return `M${R + r * Math.cos(a0)} ${R + r * Math.sin(a0)} A${r} ${r} 0 0 1 ${R + r * Math.cos(a1)} ${R + r * Math.sin(a1)}`;
  };
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: CENTER - R, top: CENTER - R, width: R * 2, height: R * 2, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={R * 2} height={R * 2} style={StyleSheet.absoluteFill}>
        <Circle cx={R} cy={R} r={R - 2} fill={c.surface} stroke={c.border} strokeWidth={2} />
        {BRANCHES.map((b) => {
          const mid = BRANCH_ANGLE[b.id];
          return <Path key={b.id} d={arc(mid - 52, mid + 52, R - 10)} stroke={b.color} strokeWidth={8} strokeLinecap="round" fill="none" />;
        })}
      </Svg>
      <View style={{ zIndex: 1 }}>
        <RankBadge rank={rank} size={66} />
      </View>
      <Text style={{ color: c.text, fontWeight: '800', fontSize: 13, marginTop: 2, zIndex: 1 }}>LV {level.level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fade: { position: 'absolute', left: 0, right: 0, top: 0, height: 170 },
  header: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: space.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.sm },
  branchRow: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  branchChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  branchText: { fontWeight: '700', fontSize: 13 },
  branchCount: { fontWeight: '800', fontSize: 12 },
  lock: { position: 'absolute', right: 2, bottom: 2, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  count: { fontWeight: '900', fontSize: 13, marginTop: 4 },
  nodeName: { fontWeight: '800', fontSize: 14, textAlign: 'center', lineHeight: 17 },
  zoom: { position: 'absolute', right: space.lg, gap: space.sm },
  sheet: { position: 'absolute', left: space.md, right: space.md, bottom: space.md, borderRadius: radius.lg, borderWidth: 1, padding: space.lg, maxWidth: 560, alignSelf: 'center' },
  sheetTop: { flexDirection: 'row', alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 5, marginTop: 8 },
  stageDot: { flex: 1, maxWidth: 40, height: 6, borderRadius: 3 },
  next: { marginTop: space.md, borderRadius: radius.md, padding: space.md },
  reqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  req: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1 },
  sheetBtns: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
});
