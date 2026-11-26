import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Screen } from '../components/Screen';
import { useToast } from '../components/Toast';
import { Button, Card, tap } from '../components/ui';
import { formatSeconds, WARMUP, WARMUP_TOTAL_SECONDS } from '../lib/warmup';
import { useStore } from '../store';
import { colors, radius, space, type } from '../theme';

type Phase = 'intro' | 'running' | 'paused' | 'done';

function Ring({ progress, size = 220 }: { progress: number; size?: number }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceHigh} strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={colors.primary}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={c * (1 - Math.max(0, Math.min(1, progress)))}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

export default function Warmup() {
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
        <Pressable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close warm-up" style={styles.iconBtn}>
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <Text style={type.small}>WARM-UP · {formatSeconds(WARMUP_TOTAL_SECONDS)}</Text>
        <View style={{ width: 40 }} />
      </View>

      {phase === 'intro' ? (
        <>
          <Text style={[type.display, { marginTop: space.lg }]}>Prime your body</Text>
          <Text style={[type.dim, { marginTop: space.sm }]}>
            {WARMUP.length} moves that wake up your wrists, shoulders, spine and hips. Warming up cuts injury risk and makes your first sets stronger.
          </Text>
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
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark" size={56} color="#06101A" />
          </View>
          <Text style={[type.display, { marginTop: space.xl, textAlign: 'center' }]}>You are warmed up</Text>
          <Text style={[type.dim, { marginTop: space.sm, textAlign: 'center' }]}>Your warm-up goal is ticked off. Now go train while your body is ready.</Text>
          <Button label="Back to today" onPress={close} style={{ marginTop: space.xl, alignSelf: 'stretch' }} />
          <Button label="See skill tree" variant="secondary" onPress={() => router.replace('/skills')} style={{ marginTop: space.sm, alignSelf: 'stretch' }} />
        </View>
      ) : (
        <>
          <View style={styles.overall}>
            {WARMUP.map((m, i) => (
              <View key={m.id} style={[styles.seg, i < index && { backgroundColor: colors.primary }, i === index && { backgroundColor: colors.accent }]} />
            ))}
          </View>
          <Text style={[type.small, { marginTop: space.lg, textAlign: 'center' }]}>
            MOVE {index + 1} OF {WARMUP.length} · {move.area.toUpperCase()}
          </Text>
          <Text style={[type.display, { textAlign: 'center', marginTop: space.sm }]}>{move.name}</Text>
          <View style={styles.ringWrap}>
            <Ring progress={1 - left / move.seconds} />
            <View style={styles.ringCenter}>
              <Text style={styles.time} accessibilityLiveRegion="polite">
                {left}
              </Text>
              <Text style={type.dim}>seconds</Text>
            </View>
          </View>
          <Card>
            <Text style={[type.body, { textAlign: 'center' }]}>{move.cue}</Text>
          </Card>
          {index + 1 < WARMUP.length ? <Text style={[type.dim, { textAlign: 'center', marginTop: space.md }]}>Next: {WARMUP[index + 1].name}</Text> : <Text style={[type.dim, { textAlign: 'center', marginTop: space.md }]}>Last move. Finish strong.</Text>}
          <View style={styles.controls}>
            <Pressable onPress={() => index > 0 && goTo(index - 1, phase === 'running')} disabled={index === 0} style={[styles.ctrl, index === 0 && { opacity: 0.35 }]} accessibilityRole="button" accessibilityLabel="Previous move">
              <Ionicons name="play-skip-back" size={22} color={colors.text} />
            </Pressable>
            <Pressable onPress={phase === 'running' ? pause : start} style={[styles.ctrl, styles.ctrlMain]} accessibilityRole="button" accessibilityLabel={phase === 'running' ? 'Pause' : 'Resume'} testID="warmup-toggle">
              <Ionicons name={phase === 'running' ? 'pause' : 'play'} size={30} color="#fff" />
            </Pressable>
            <Pressable onPress={() => goTo(index + 1, phase === 'running')} style={styles.ctrl} accessibilityRole="button" accessibilityLabel="Skip move" testID="warmup-skip">
              <Ionicons name="play-skip-forward" size={22} color={colors.text} />
            </Pressable>
          </View>
          <Text style={[type.dim, { textAlign: 'center', marginTop: space.md, fontSize: 12 }]}>
            {formatSeconds(elapsed)} / {formatSeconds(WARMUP_TOTAL_SECONDS)}
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  listRow: { flexDirection: 'row', alignItems: 'center', padding: space.md },
  num: { width: 26, color: colors.textFaint, fontWeight: '800' },
  moveName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  moveArea: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  moveTime: { color: colors.accent, fontWeight: '800' },
  overall: { flexDirection: 'row', gap: 4, marginTop: space.lg },
  seg: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.surfaceHigh },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: space.xl },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  time: { color: colors.text, fontSize: 64, fontWeight: '800', fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: space.xl, marginTop: space.xl },
  ctrl: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  ctrlMain: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.primary, borderColor: colors.primary },
  doneIcon: { width: 110, height: 110, borderRadius: 55, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  // eslint-disable-next-line react-native/no-unused-styles
  pad: { borderRadius: radius.md },
});
