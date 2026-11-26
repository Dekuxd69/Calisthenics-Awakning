import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RankBadge } from '../../components/RankBadge';
import { Screen } from '../../components/Screen';
import { Button, Card, ProgressBar, SectionTitle } from '../../components/ui';
import { isMastered, SKILLS } from '../../lib/skills';
import { streak } from '../../lib/state';
import { nextRank, RANKS, xpForLevel } from '../../lib/xp';
import { useStore } from '../../store';
import { colors, radius, space, type } from '../../theme';

function timeAgo(at: number) {
  const s = Math.max(0, (Date.now() - at) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

export default function RankScreen() {
  const { state, level, rank, dispatch, today } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const upcoming = nextRank(level.level);
  const mastered = SKILLS.filter((k) => isMastered(state.progress, k.id)).length;
  const toNextRank = upcoming ? xpForLevel(upcoming.minLevel) - state.xp : 0;

  return (
    <Screen>
      <Text style={type.h1}>Rank</Text>
      <Card style={[styles.hero, { borderColor: rank.color + '66' }]}>
        <RankBadge rank={rank} size={120} />
        <Text style={[type.small, { color: rank.color, marginTop: space.md }]}>{rank.id}-RANK HUNTER</Text>
        <Text style={[type.display, { marginTop: 2 }]}>{rank.title}</Text>
        <Text style={[type.dim, { textAlign: 'center', marginTop: space.sm }]}>{rank.blurb}</Text>
        <View style={{ alignSelf: 'stretch', marginTop: space.lg }}>
          <View style={styles.lvlRow}>
            <Text style={type.h2}>Level {level.level}</Text>
            <Text style={type.dim}>
              {level.current} / {level.needed} EXP
            </Text>
          </View>
          <ProgressBar value={level.progress} color={rank.color} height={10} />
          <Text style={[type.dim, { fontSize: 13, marginTop: space.sm, textAlign: 'center' }]}>
            {upcoming ? `${toNextRank.toLocaleString()} EXP to ${upcoming.id}-Rank (level ${upcoming.minLevel})` : 'Highest rank reached. Legend.'}
          </Text>
        </View>
      </Card>

      <View style={styles.stats}>
        {[
          { icon: 'sparkles', value: state.xp.toLocaleString(), label: 'Total EXP', color: colors.primary },
          { icon: 'git-network', value: `${mastered}/${SKILLS.length}`, label: 'Skills', color: colors.success },
          { icon: 'flame', value: String(streak(state)), label: 'Day streak', color: colors.warning },
          { icon: 'body', value: String(state.warmups), label: 'Warm-ups', color: colors.accent },
        ].map((s) => (
          <Card key={s.label} style={styles.stat}>
            <Ionicons name={s.icon as keyof typeof Ionicons.glyphMap} size={18} color={s.color} />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </Card>
        ))}
      </View>

      <SectionTitle>Rank ladder</SectionTitle>
      <Card style={{ padding: space.sm }}>
        {[...RANKS].reverse().map((r, i) => {
          const reached = level.level >= r.minLevel;
          const current = r.id === rank.id;
          return (
            <View key={r.id} style={[styles.rankRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }, current && { backgroundColor: r.color + '14', borderRadius: radius.md }]}>
              <View style={{ opacity: reached ? 1 : 0.4 }}>
                <RankBadge rank={r} size={40} />
              </View>
              <View style={{ flex: 1, marginLeft: space.md }}>
                <Text style={[styles.rankName, !reached && { color: colors.textFaint }]}>
                  {r.id}-Rank · {r.title}
                </Text>
                <Text style={styles.rankSub}>From level {r.minLevel}</Text>
              </View>
              {current ? <Text style={[styles.you, { color: r.color }]}>YOU</Text> : reached ? <Ionicons name="checkmark-circle" size={20} color={colors.success} /> : <Ionicons name="lock-closed" size={16} color={colors.textFaint} />}
            </View>
          );
        })}
      </Card>

      <SectionTitle>How to earn EXP</SectionTitle>
      <Card>
        {[
          ['Tick off daily goals', '10–40 EXP each'],
          ['Finish every daily goal', '+30 perfect day bonus'],
          ['Clear a skill stage', '20–120 EXP by tier'],
          ['Master a whole skill', 'Double stage EXP bonus'],
        ].map(([a, b]) => (
          <View key={a} style={styles.earn}>
            <Text style={[type.body, { flex: 1 }]}>{a}</Text>
            <Text style={[type.dim, { fontWeight: '700' }]}>{b}</Text>
          </View>
        ))}
      </Card>

      <SectionTitle>Recent EXP</SectionTitle>
      <Card style={{ padding: space.sm }}>
        {state.log.length === 0 ? (
          <Text style={[type.dim, { padding: space.md }]}>Nothing yet. Tick off your first daily goal to start earning.</Text>
        ) : (
          state.log.slice(0, 12).map((e, i) => (
            <View key={`${e.at}-${i}`} style={[styles.logRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={type.body} numberOfLines={1}>
                  {e.label}
                </Text>
                <Text style={styles.rankSub}>{timeAgo(e.at)}</Text>
              </View>
              <Text style={[styles.logXp, { color: e.xp >= 0 ? colors.success : colors.danger }]}>
                {e.xp >= 0 ? '+' : '−'}
                {Math.abs(e.xp)}
              </Text>
            </View>
          ))
        )}
      </Card>

      <SectionTitle>Profile</SectionTitle>
      <Button label="Edit body data" icon="create-outline" variant="secondary" onPress={() => router.push('/onboarding?edit=1')} />
      {confirmReset ? (
        <Card style={{ marginTop: space.md, borderColor: colors.danger + '66' }}>
          <Text style={type.h2}>Reset all progress?</Text>
          <Text style={[type.dim, { marginTop: 4 }]}>Your EXP, skill stages, goals and streak go back to zero. Your body data stays. This cannot be undone.</Text>
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
            <Button label="Cancel" variant="secondary" onPress={() => setConfirmReset(false)} style={{ flex: 1 }} />
            <Button
              label="Reset"
              variant="danger"
              onPress={() => {
                dispatch({ type: 'reset', today });
                setConfirmReset(false);
              }}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      ) : (
        <Button label="Reset progress" variant="ghost" onPress={() => setConfirmReset(true)} style={{ marginTop: space.sm }} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: space.lg, paddingVertical: space.xl },
  lvlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: space.sm },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  stat: { flexGrow: 1, flexBasis: '45%', padding: space.md },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 6 },
  statLabel: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  rankRow: { flexDirection: 'row', alignItems: 'center', padding: space.sm },
  rankName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  rankSub: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  you: { fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  earn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  logRow: { flexDirection: 'row', alignItems: 'center', padding: space.md },
  logXp: { fontWeight: '800', fontSize: 15, marginLeft: space.md },
});
