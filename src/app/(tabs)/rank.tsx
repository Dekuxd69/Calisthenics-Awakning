import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RankBadge } from '../../components/RankBadge';
import { Screen } from '../../components/Screen';
import { Card, IconButton, Label, ProgressBar, T } from '../../components/ui';
import { BADGES } from '../../lib/badges';
import { isMastered, SKILLS } from '../../lib/skills';
import { streak } from '../../lib/state';
import { nextRank, RANKS, xpForLevel } from '../../lib/xp';
import { useStore } from '../../store';
import { radius, space, useTheme } from '../../theme';

export default function Profile() {
  const { state, level, rank } = useStore();
  const { c } = useTheme();
  const [badgeInfo, setBadgeInfo] = useState<string | null>(null);
  const upcoming = nextRank(level.level);
  const mastered = SKILLS.filter((k) => isMastered(state.progress, k.id)).length;
  const earned = BADGES.filter((b) => b.id in state.badges).length;
  const info = BADGES.find((b) => b.id === badgeInfo);

  const stats = [
    { icon: 'flame', value: streak(state), label: 'Streak', color: '#F97316' },
    { icon: 'trophy', value: state.bestStreak, label: 'Best', color: '#FBBF24' },
    { icon: 'flash', value: state.xp, label: 'EXP', color: c.primary },
    { icon: 'planet', value: `${mastered}/${SKILLS.length}`, label: 'Skills', color: c.accent },
  ] as const;

  return (
    <Screen>
      <View style={styles.top}>
        <T v="h1">Profile</T>
        <IconButton icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
      </View>

      <Card style={[styles.hero, { borderColor: rank.color + '55' }]}>
        <RankBadge rank={rank} size={112} />
        <T v="h1" style={{ marginTop: space.md }}>
          {state.profile?.name ?? 'Athlete'}
        </T>
        <T v="label" color={rank.color} style={{ marginTop: 4 }}>
          {rank.id}-RANK · {rank.title.toUpperCase()}
        </T>
        <View style={{ alignSelf: 'stretch', marginTop: space.lg }}>
          <View style={styles.lvl}>
            <T style={{ fontWeight: '800' }}>Level {level.level}</T>
            <T v="small" color="dim">
              {level.current}/{level.needed}
            </T>
          </View>
          <ProgressBar value={level.progress} color={rank.color} height={10} />
          {upcoming ? (
            <T v="small" color="faint" center style={{ marginTop: space.sm }}>
              {(xpForLevel(upcoming.minLevel) - state.xp).toLocaleString()} EXP to {upcoming.id}-Rank
            </T>
          ) : null}
        </View>
      </Card>

      <View style={styles.stats}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.stat, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name={s.icon} size={18} color={s.color} />
            <Text style={[styles.statValue, { color: c.text }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: c.textFaint }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionRow}>
        <Label>Badges</Label>
        <Text style={{ color: c.textDim, fontWeight: '800' }}>
          {earned}/{BADGES.length}
        </Text>
      </View>
      <View style={styles.badges}>
        {BADGES.map((b) => {
          const got = b.id in state.badges;
          return (
            <Pressable key={b.id} style={styles.badge} onPress={() => setBadgeInfo(badgeInfo === b.id ? null : b.id)} accessibilityRole="button" accessibilityLabel={`${b.name}, ${got ? 'earned' : 'locked'}. ${b.hint}`}>
              <View style={[styles.badgeRing, { backgroundColor: got ? b.color + '2A' : c.surfaceHigh, borderColor: badgeInfo === b.id ? c.text : 'transparent' }]}>
                <View style={[styles.badgeDisc, { backgroundColor: got ? b.color : c.surface }]}>
                  <Ionicons name={(got ? b.icon : 'lock-closed') as keyof typeof Ionicons.glyphMap} size={got ? 24 : 16} color={got ? '#fff' : c.textFaint} />
                </View>
              </View>
              <Text numberOfLines={1} style={[styles.badgeName, { color: got ? c.text : c.textFaint }]}>
                {b.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {info ? (
        <Card style={{ marginTop: space.sm, padding: space.md }}>
          <T style={{ fontWeight: '800' }}>{info.name}</T>
          <T v="small" color="dim">
            {info.id in state.badges ? 'Earned' : info.hint}
          </T>
        </Card>
      ) : null}

      <Label style={{ marginTop: space.xl, marginBottom: space.md }}>Ranks</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md }}>
        {RANKS.map((r) => {
          const reached = level.level >= r.minLevel;
          return (
            <View key={r.id} style={[styles.rankCard, { backgroundColor: r.id === rank.id ? r.color + '1F' : c.surface, borderColor: r.id === rank.id ? r.color : c.border, opacity: reached ? 1 : 0.55 }]}>
              <RankBadge rank={r} size={48} />
              <Text style={{ color: c.text, fontWeight: '800', marginTop: 6 }}>{r.title}</Text>
              <Text style={{ color: c.textFaint, fontSize: 12 }}>Lv {r.minLevel}+</Text>
            </View>
          );
        })}
      </ScrollView>

      {state.log.length > 0 ? (
        <>
          <Label style={{ marginTop: space.xl, marginBottom: space.md }}>Recent</Label>
          <Card style={{ padding: space.sm }}>
            {state.log.slice(0, 5).map((e, i) => (
              <View key={`${e.at}-${i}`} style={[styles.log, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
                <Text numberOfLines={1} style={{ color: c.text, flex: 1, fontWeight: '600' }}>
                  {e.label}
                </Text>
                <Text style={{ color: e.xp >= 0 ? c.success : c.danger, fontWeight: '900' }}>
                  {e.xp >= 0 ? '+' : '−'}
                  {Math.abs(e.xp)}
                </Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hero: { alignItems: 'center', marginTop: space.lg, paddingVertical: space.xl },
  lvl: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.sm },
  stats: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  stat: { flex: 1, borderRadius: radius.md, borderWidth: 1, padding: space.md, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  statLabel: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.xl, marginBottom: space.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.md },
  badge: { width: '25%', alignItems: 'center' },
  badgeRing: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  badgeDisc: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  badgeName: { fontSize: 11, fontWeight: '700', marginTop: 6, maxWidth: 80 },
  rankCard: { width: 104, alignItems: 'center', borderRadius: radius.md, borderWidth: 1, paddingVertical: space.md },
  log: { flexDirection: 'row', alignItems: 'center', padding: space.md, gap: space.md },
});
