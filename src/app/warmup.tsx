import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { Screen } from '../components/Screen';
import { useToast } from '../components/Toast';
import { Illustration } from '../components/art/Illustrations';
import { Button, Card, IconButton, T, tap } from '../components/ui';
import { formatSeconds, WARMUP, WARMUP_TOTAL_SECONDS } from '../lib/warmup';
import { useStore } from '../store';
import { ff, radius, space, useStyles, useTheme, type Palette } from '../theme';

type Phase = 'intro' | 'running' | 'paused' | 'done';

/** 270 degree arc gauge with tick marks, like the timer in the reference. */
function Arc({ progress, size = 260 }: { progress: number; size?: number }) {
  const { c: colors } = useTheme();
  const stroke = 16;
  const r = (size - stroke) / 2 - 10;
  const cx = size / 2;
  const sweep = 270;
  const p = Math.max(0, Math.min(1, progress));
  const pt = (deg: number, rad: number) => {
    const a = ((deg - 225) * Math.PI) / 180;
    return [cx + rad * Math.cos(a), cx + rad * Math.sin(a)];
  };
  const arc = (from: number, to: number) => {
    const [x0, y0] = pt(from, r);
    const [x1, y1] = pt(to, r);
    return `M${x0} ${y0} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  };
  const ticks = Array.from({ length: 28 }, (_, i) => (i / 27) * sweep);
  return (
    <Svg width={size} height={size}>
      {ticks.map((t) => {
        const [x0, y0] = pt(t, r + 14);
        const [x1, y1] = pt(t, r + 20);
        return <Line key={t} x1={x0} y1={y0} x2={x1} y2={y1} stroke={t / sweep <= p ? colors.primary : colors.muted} strokeWidth={2} strokeLinecap="round" />;
      })}
      <Path d={arc(0, sweep)} stroke={colors.surfaceHigh} strokeWidth={stroke} fill="none" strokeLinecap="round" />
      {p > 0.005 ? <Path d={arc(0, Math.max(1, sweep * p))} stroke={colors.primary} strokeWidth={stroke} fill="none" strokeLinecap="round" /> : null}
    </Svg>
  );
}

export default function Warmup() {
  const { c: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const { dispatch, goals, today, state } = useStore();
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState(WARMUP[0].seconds);
  const endAt = useRef(0);
  const awarded = useRef(false);

  const move = WARMUP[index];

  const finish = useCallback(() => {
    setPhase('done');
    if (!awarded.current) {
      awarded.current = true;
      const already = 'warmup' in state.day.done;
      dispatch({ type: 'completeWarmup', goals, today, now: Date.now() });
      tap('success');
      if (!already) toast('Warm-up complete! +20 EXP', 'xp');
    }
  }, [dispatch, goals, today, toast, state.day.done]);

  const goTo = useCallback(
    (i: number, keepRunning: boolean) => {
      if (i >= WARMUP.length) {
        finish();
        return;
      }
      setIndex(i);
      setLeft(WARMUP[i].seconds);
      endAt.current = Date.now() + WARMUP[i].seconds * 1000;
      if (keepRunning) tap();
    },
    [finish],
  );

  // Tick based on wall clock so the timer stays right even if frames are dropped.
  useEffect(() => {
    if (phase !== 'running') return;
    const id = setInterval(() => {
      const remaining = Math.ceil((endAt.current - Date.now()) / 1000);
      if (remaining <= 0) goTo(index + 1, true);
      else setLeft(remaining);
    }, 250);
    return () => clearInterval(id);
  }, [phase, index, goTo]);

  const start = () => {
    endAt.current = Date.now() + left * 1000;
    setPhase('running');
  };
  const pause = () => setPhase('paused');

  const elapsed = WARMUP.slice(0, index).reduce((t, m) => t + m.seconds, 0) + (move.seconds - left);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.top}>
        <IconButton icon="close" label="Close warm-up" onPress={close} />
        <T v="label" color="faint">
          WARM-UP · {formatSeconds(WARMUP_TOTAL_SECONDS)}
        </T>
        <View style={{ width: 44 }} />
      </View>

      {phase === 'intro' ? (
        <>
          <View style={styles.introRow}>
            <View style={{ flex: 1 }}>
              <T v="display">Prime your body</T>
              <T color="dim" style={{ marginTop: space.sm }}>
                {WARMUP.length} moves · {Math.round(WARMUP_TOTAL_SECONDS / 60)} min · +20 EXP
              </T>
            </View>
            <Illustration name="flame" size={96} />
          </View>
          <Card style={{ marginTop: space.lg, padding: space.sm }}>
            {WARMUP.map((m, i) => (
              <View key={m.id} style={[styles.listRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Text style={styles.num}>{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.moveName}>{m.name}</Text>
                  <Text style={styles.moveArea}>{m.area}</Text>
                </View>
                <Text style={styles.moveTime}>{m.seconds}s</Text>
              </View>
            ))}
          </Card>
          <Button label="Start warm-up" icon="play" onPress={start} style={{ marginTop: space.xl }} testID="warmup-start" />
        </>
      ) : phase === 'done' ? (
        <View style={{ alignItems: 'center', marginTop: space.xxl }}>
          <Illustration name="trophy" size={170} />
          <T v="display" center style={{ marginTop: space.lg }}>
            Warmed up
          </T>
          <T color="dim" center style={{ marginTop: space.sm }}>
            Quest complete. Go train.
          </T>
          <Button label="Back to today" onPress={close} style={{ marginTop: space.xl, alignSelf: 'stretch' }} />
          <Button label="Open skills" variant="secondary" onPress={() => router.replace('/skills')} style={{ marginTop: space.sm, alignSelf: 'stretch' }} />
        </View>
      ) : (
        <>
          <View style={styles.overall}>
            {WARMUP.map((m, i) => (
              <View key={m.id} style={[styles.seg, i < index && { backgroundColor: colors.primary }, i === index && { backgroundColor: colors.textDim }]} />
            ))}
          </View>
          <T v="label" color="lime" center style={{ marginTop: space.lg }}>
            MOVE {index + 1} OF {WARMUP.length} · {move.area.toUpperCase()}
          </T>
          <T v="h1" center style={{ marginTop: space.sm }}>
            {move.name}
          </T>
          <View style={styles.ringWrap}>
            <Arc progress={1 - left / move.seconds} />
            <View style={styles.ringCenter}>
              <Text style={styles.time} accessibilityLiveRegion="polite">
                {formatSeconds(left)}
              </Text>
              <T color="faint">{phase === 'paused' ? 'Paused' : 'Remaining'}</T>
            </View>
          </View>
          <Card>
            <T center>{move.cue}</T>
          </Card>
          <T color="faint" center style={{ marginTop: space.md }}>
            {index + 1 < WARMUP.length ? `Next: ${WARMUP[index + 1].name}` : 'Last move. Finish strong.'}
          </T>
          <View style={styles.controls}>
            <Pressable onPress={() => index > 0 && goTo(index - 1, phase === 'running')} disabled={index === 0} style={[styles.ctrl, index === 0 && { opacity: 0.35 }]} accessibilityRole="button" accessibilityLabel="Previous move">
              <Ionicons name="play-skip-back" size={22} color={colors.text} />
            </Pressable>
            <Pressable onPress={phase === 'running' ? pause : start} style={[styles.ctrl, styles.ctrlMain]} accessibilityRole="button" accessibilityLabel={phase === 'running' ? 'Pause' : 'Resume'} testID="warmup-toggle">
              <Ionicons name={phase === 'running' ? 'pause' : 'play'} size={30} color={colors.onPrimary} />
            </Pressable>
            <Pressable onPress={() => goTo(index + 1, phase === 'running')} style={styles.ctrl} accessibilityRole="button" accessibilityLabel="Skip move" testID="warmup-skip">
              <Ionicons name="play-skip-forward" size={22} color={colors.text} />
            </Pressable>
          </View>
          <T v="small" color="faint" center style={{ marginTop: space.md }}>
            {formatSeconds(elapsed)} / {formatSeconds(WARMUP_TOTAL_SECONDS)}
          </T>
        </>
      )}
    </Screen>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  introRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.lg },
  listRow: { flexDirection: 'row', alignItems: 'center', padding: space.md },
  num: { width: 28, color: colors.textFaint, fontFamily: ff.semibold },
  moveName: { color: colors.text, fontFamily: ff.semibold, fontSize: 16 },
  moveArea: { color: colors.textFaint, fontFamily: ff.regular, fontSize: 13, marginTop: 2 },
  moveTime: { color: colors.primaryText, fontFamily: ff.semibold },
  overall: { flexDirection: 'row', gap: 4, marginTop: space.lg },
  seg: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.surfaceHigh },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: space.lg },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  time: { color: colors.text, fontSize: 64, fontFamily: ff.semibold, letterSpacing: -2, fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: space.xl, marginTop: space.xl },
  ctrl: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  ctrlMain: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.primary },
  pad: { borderRadius: radius.md },
});
