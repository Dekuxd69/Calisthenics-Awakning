import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../components/Avatar';
import { Illustration } from '../../components/art/Illustrations';
import { RankBadge } from '../../components/RankBadge';
import { Screen } from '../../components/Screen';
import { Card, IconButton, ProgressBar, SectionHeader, T } from '../../components/ui';
import { BADGES } from '../../lib/badges';
import { isMastered, SKILLS } from '../../lib/skills';
import { streak } from '../../lib/state';
import { nextRank, RANKS, xpForLevel } from '../../lib/xp';
import { useStore } from '../../store';
import { ff, radius, space, useTheme } from '../../theme';

export default function Profile() {
  const { state, level, rank } = useStore();
  const { c } = useTheme();
  const [badgeInfo, setBadgeInfo] = useState<string | null>(null);
  const upcoming = nextRank(level.level);
  const mastered = SKILLS.filter((k) => isMastered(state.progress, k.id)).length;
  const earned = BADGES.filter((b) => b.id in state.badges).length;
  const info = BADGES.find((b) => b.id === badgeInfo);
  const days = Object.values(state.history).filter((h) => h.done > 0).length + (Object.keys(state.day.done).length > 0 ? 1 : 0);

  const stats = [
    { value: streak(state), label: 'Streak' },
    { value: level.level, label: 'Level' },
    { value: `${mastered}/${SKILLS.length}`, label: 'Skills' },
    { value: days, label: 'Days' },
  ];

  return (
    <Screen>
      <View style={styles.top}>
        <T v="h1">Profile</T>
        <IconButton icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
      </View>

      <View style={styles.hero}>
        <Avatar name={state.profile?.name ?? 'Athlete'} size={112} progress={level.progress} />
        <T v="display" style={{ marginTop: space.md }}>
          {state.profile?.name ?? 'Athlete'}
        </T>
        <T v="label" color="lime" style={{ marginTop: 2 }}>
          {rank.id}-RANK · {rank.title.toUpperCase()}
        </T>
      </View>

      <View style={styles.stats}>
        {stats.map((s, i) => (
          <View key={s.label} style={[styles.stat, i > 0 && { borderLeftWidth: 1, borderLeftColor: c.border }]}>
            <Text style={[styles.statValue, { color: c.text }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: c.textFaint }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Level card */}
      <Card style={styles.levelCard}>
        <View style={{ flex: 1 }}>
          <T v="h2">Level {level.level}</T>
          <T v="small" color="dim" style={{ marginTop: 2 }}>
            {level.current} / {level.needed} EXP
          </T>
          <View style={{ marginTop: space.md }}>
            <ProgressBar value={level.progress} height={10} />
          </View>
          {upcoming ? (
            <T v="small" color="faint" style={{ marginTop: space.sm }}>
              {(xpForLevel(upcoming.minLevel) - state.xp).toLocaleString()} EXP to {upcoming.id}-Rank
            </T>
          ) : null}
        </View>
        <View style={{ marginLeft: space.md }}>
          <Illustration name="coin" size={84} />
        </View>
      </Card>

      <SectionHeader
        title="Badges"
        right={
          <T v="bodyStrong" color="dim">
            {earned}/{BADGES.length}
          </T>
        }
      />
      <View style={styles.badges}>
        {BADGES.map((b) => {
          const got = b.id in state.badges;
          return (
            <Pressable key={b.id} style={styles.badge} onPress={() => setBadgeInfo(badgeInfo === b.id ? null : b.id)} accessibilityRole="button" accessibilityLabel={`${b.name}, ${got ? 'earned' : 'locked'}. ${b.hint}`}>
              <View style={[styles.badgeRing, { borderColor: badgeInfo === b.id ? c.primary : 'transparent' }]}>
                <View style={[styles.badgeDisc, { backgroundColor: got ? c.primary : c.surface }]}>
                  <Ionicons name={(got ? b.icon : 'lock-closed') as keyof typeof Ionicons.glyphMap} size={got ? 24 : 16} color={got ? c.onPrimary : c.textFaint} />
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
          <T v="bodyStrong">{info.name}</T>
          <T v="small" color="dim">
            {info.id in state.badges ? 'Earned' : info.hint}
          </T>
        </Card>
      ) : null}

      <SectionHeader title="Ranks" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
        {RANKS.map((r) => {
          const reached = level.level >= r.minLevel;
          const current = r.id === rank.id;
          return (
            <View key={r.id} style={[styles.rankCard, { backgroundColor: c.surface, borderColor: current ? c.primary : 'transparent' }]}>
              <RankBadge rank={r} size={48} dim={!reached} />
              <Text style={{ color: reached ? c.text : c.textFaint, fontFamily: ff.semibold, marginTop: 6 }}>{r.title}</Text>
              <Text style={{ color: c.textFaint, fontFamily: ff.regular, fontSize: 12 }}>Lv {r.minLevel}+</Text>
            </View>
          );
        })}
      </ScrollView>

      {state.log.length > 0 ? (
        <>
          <SectionHeader title="Recent" />
          <Card style={{ padding: space.sm }}>
            {state.log.slice(0, 5).map((e, i) => (
              <View key={`${e.at}-${i}`} style={[styles.log, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
                <Text numberOfLines={1} style={{ color: c.text, flex: 1, fontFamily: ff.medium }}>
                  {e.label}
                </Text>
                <Text style={{ color: e.xp >= 0 ? c.primaryText : c.danger, fontFamily: ff.semibold }}>
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
  hero: { alignItems: 'center', marginTop: space.lg },
  stats: { flexDirection: 'row', marginTop: space.xl },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontFamily: ff.semibold },
  statLabel: { fontSize: 12, fontFamily: ff.regular, marginTop: 2 },
  levelCard: { flexDirection: 'row', alignItems: 'center', marginTop: space.xl },
  badges: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.md },
  badge: { width: '25%', alignItems: 'center' },
  badgeRing: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  badgeDisc: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  badgeName: { fontSize: 11, fontFamily: ff.medium, marginTop: 6, maxWidth: 80 },
  rankCard: { width: 104, alignItems: 'center', borderRadius: radius.md, borderWidth: 1.5, paddingVertical: space.md },
  log: { flexDirection: 'row', alignItems: 'center', padding: space.md, gap: space.md },
});
