import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SkillIllustration } from '../../components/illustrations/SkillIllustration';
import { Screen } from '../../components/Screen';
import { Card, ProgressBar, tap } from '../../components/ui';
import { BRANCHES, branchProgress, branchSkills, SKILL_BY_ID, skillDepth, skillStatus, stagesDone, type BranchId, type Skill, type SkillStatus } from '../../lib/skills';
import { useStore } from '../../store';
import { colors, radius, space, type } from '../../theme';

const TIER_NAMES = ['Foundation', 'Builder', 'Strength', 'Advanced', 'Signature'];

const STATUS_ICON: Record<SkillStatus, keyof typeof Ionicons.glyphMap> = {
  locked: 'lock-closed',
  available: 'ellipse-outline',
  'in-progress': 'time-outline',
  mastered: 'checkmark-circle',
};

export default function Skills() {
  const { state } = useStore();
  const [branchId, setBranchId] = useState<BranchId>('push');
  const branch = BRANCHES.find((b) => b.id === branchId)!;
  const bp = branchProgress(state.progress, branchId);

  const rows = useMemo(() => {
    const byDepth: Skill[][] = [];
    for (const k of branchSkills(branchId)) {
      const d = skillDepth(k.id);
      (byDepth[d] ??= []).push(k);
    }
    return byDepth.filter(Boolean);
  }, [branchId]);

  return (
    <Screen>
      <Text style={type.h1}>Skill tree</Text>
      <Text style={[type.dim, { marginTop: 4 }]}>Master each skill to unlock the next. Tick off a stage only when you can do it with clean form.</Text>

      <View style={styles.tabs} accessibilityRole="tablist">
        {BRANCHES.map((b) => {
          const active = b.id === branchId;
          const p = branchProgress(state.progress, b.id);
          return (
            <Pressable
              key={b.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => {
                tap();
                setBranchId(b.id);
              }}
              style={[styles.tab, active && { backgroundColor: b.color + '22', borderColor: b.color }]}
            >
              <Text style={[styles.tabText, active && { color: colors.text }]}>{b.name}</Text>
              <Text style={[styles.tabSub, active && { color: b.color }]}>
                {p.done}/{p.total}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <View style={{ alignItems: 'center', backgroundColor: '#0B0F1E' }}>
          <SkillIllustration branch={branchId} height={190} />
        </View>
        <View style={{ padding: space.lg }}>
          <Text style={[type.small, { color: branch.color }]}>SIGNATURE SKILL</Text>
          <Text style={[type.h2, { marginTop: 2 }]}>{branch.signature}</Text>
          <Text style={[type.dim, { marginTop: 2 }]}>{branch.tagline}</Text>
          <View style={{ marginTop: space.md }}>
            <ProgressBar value={bp.total ? bp.done / bp.total : 0} color={branch.color} />
          </View>
          <Text style={[type.dim, { fontSize: 12, marginTop: 6 }]}>
            {bp.done} of {bp.total} skills mastered
          </Text>
        </View>
      </Card>

      <View style={{ marginTop: space.xl }}>
        {rows.map((row, depth) => (
          <View key={depth}>
            {depth > 0 ? <View style={[styles.connector, { backgroundColor: branch.color + '55' }]} /> : null}
            <Text style={styles.tier}>
              TIER {depth + 1} · {TIER_NAMES[Math.min(depth, TIER_NAMES.length - 1)].toUpperCase()}
            </Text>
            <View style={styles.row}>
              {row.map((k) => (
                <SkillNode key={k.id} skill={k} color={branch.color} />
              ))}
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

function SkillNode({ skill, color }: { skill: Skill; color: string }) {
  const { state } = useStore();
  const status = skillStatus(state.progress, skill.id);
  const done = stagesDone(state.progress, skill.id);
  const locked = status === 'locked';
  const mastered = status === 'mastered';
  const missing = skill.requires.filter((r) => skillStatus(state.progress, r) !== 'mastered').map((r) => SKILL_BY_ID[r].name);
  const tint = mastered ? colors.success : locked ? colors.textFaint : color;
  return (
    <Pressable
      testID={`skill-${skill.id}`}
      onPress={() => router.push({ pathname: '/skill/[id]', params: { id: skill.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${skill.name}, ${status}, ${done} of ${skill.stages.length} stages`}
      style={({ pressed }) => [
        styles.node,
        mastered && { borderColor: colors.success, backgroundColor: colors.successSoft },
        !locked && !mastered && { borderColor: color + '88' },
        locked && { opacity: 0.8 },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={styles.nodeTop}>
        <View style={[styles.nodeIcon, { backgroundColor: tint + '22' }]}>
          <Ionicons name={STATUS_ICON[status]} size={18} color={tint} />
        </View>
        <Text style={[styles.nodeStages, { color: tint }]}>
          {done}/{skill.stages.length}
        </Text>
      </View>
      <Text style={styles.nodeName} numberOfLines={2}>
        {skill.name}
      </Text>
      {locked ? (
        <Text style={styles.nodeSub} numberOfLines={2}>
          Needs {missing.join(' + ')}
        </Text>
      ) : (
        <View style={{ marginTop: space.sm }}>
          <ProgressBar value={done / skill.stages.length} color={tint} height={5} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: space.sm, marginVertical: space.lg },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabText: { color: colors.textDim, fontWeight: '700', fontSize: 14 },
  tabSub: { color: colors.textFaint, fontSize: 12, fontWeight: '700', marginTop: 2 },
  tier: { ...type.small, textAlign: 'center', marginBottom: space.sm },
  connector: { width: 3, height: 22, alignSelf: 'center', borderRadius: 2, marginVertical: space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' },
  node: { flexGrow: 1, flexBasis: '45%', maxWidth: '100%', minHeight: 112, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: space.md },
  nodeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nodeIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  nodeStages: { fontWeight: '800', fontSize: 13 },
  nodeName: { color: colors.text, fontWeight: '700', fontSize: 15, marginTop: space.sm },
  nodeSub: { color: colors.textFaint, fontSize: 12, marginTop: 4 },
});
