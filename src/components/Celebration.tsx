import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, View } from 'react-native';
import { BADGE_BY_ID } from '../lib/badges';
import { pendingBadge } from '../lib/state';
import { rankForLevel } from '../lib/xp';
import { useStore } from '../store';
import { radius, space, useTheme } from '../theme';
import { RankBadge } from './RankBadge';
import { Button, T, tap } from './ui';

const CONFETTI = ['#7C5CFF', '#22D3EE', '#FBBF24', '#F472B6', '#2DD4A0', '#F97316'];

function Confetti({ run }: { run: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        x: (Math.random() - 0.5) * 320,
        y: -160 - Math.random() * 160,
        r: Math.random() * 540 - 270,
        color: CONFETTI[i % CONFETTI.length],
        w: 6 + Math.random() * 6,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [run],
  );
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    t.setValue(0);
    Animated.timing(t, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [run, t]);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: p.w,
            height: p.w * 1.6,
            borderRadius: 2,
            backgroundColor: p.color,
            opacity: t.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, p.x] }) },
              { translateY: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, p.y, p.y + 220] }) },
              { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.r}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

/** Level-up and new-badge celebrations, one at a time. */
export function Celebration() {
  const { state, level, dispatch } = useStore();
  const { c } = useTheme();
  const levelUp = !!state.profile && level.level > state.seenLevel;
  const badgeId = !levelUp && state.profile ? pendingBadge(state) : null;
  const badge = badgeId ? BADGE_BY_ID[badgeId] : null;
  const visible = levelUp || !!badge;
  const key = levelUp ? `l${level.level}` : (badgeId ?? '');
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    tap('success');
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  }, [visible, key, pop]);

  const close = () => (levelUp ? dispatch({ type: 'ackLevel' }) : badgeId ? dispatch({ type: 'ackBadge', id: badgeId }) : undefined);
  const oldRank = rankForLevel(state.seenLevel);
  const rank = rankForLevel(level.level);
  const rankUp = levelUp && rank.id !== oldRank.id;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={[styles.backdrop, { backgroundColor: c.overlay }]}>
        {visible ? <Confetti run={key.length + level.level} /> : null}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Animated.View style={{ alignItems: 'center', transform: [{ scale: pop }] }}>
            {levelUp ? (
              <RankBadge rank={rank} size={120} />
            ) : badge ? (
              <View style={[styles.badge, { backgroundColor: badge.color + '26' }]}>
                <View style={[styles.badgeInner, { backgroundColor: badge.color }]}>
                  <Ionicons name={badge.icon as keyof typeof Ionicons.glyphMap} size={48} color="#fff" />
                </View>
              </View>
            ) : null}
          </Animated.View>
          <T v="label" color={levelUp ? rank.color : (badge?.color ?? c.primary)} center style={{ marginTop: space.lg }}>
            {rankUp ? 'NEW RANK' : levelUp ? 'LEVEL UP' : 'BADGE EARNED'}
          </T>
          <T v="display" center style={{ marginTop: 4 }}>
            {levelUp ? (rankUp ? `${rank.id}-Rank` : `Level ${level.level}`) : badge?.name}
          </T>
          <T color="dim" center style={{ marginTop: 4 }}>
            {levelUp ? (rankUp ? rank.title : `${rank.id}-Rank ${rank.title}`) : badge?.hint}
          </T>
          <Button label="Continue" onPress={close} style={{ marginTop: space.xl, alignSelf: 'stretch' }} testID="celebrate-continue" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  card: { width: '100%', maxWidth: 360, borderRadius: radius.lg, padding: space.xl, borderWidth: 1, alignItems: 'center' },
  badge: { width: 128, height: 128, borderRadius: 64, alignItems: 'center', justifyContent: 'center' },
  badgeInner: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
});
