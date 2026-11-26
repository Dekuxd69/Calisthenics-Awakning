import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LayeredArt } from '../../components/art/LayeredArt';
import { SKILL_POSE } from '../../components/art/poses';
import { Screen } from '../../components/Screen';
import { useToast } from '../../components/Toast';
import { Button, Card, IconButton, Label, T, tap } from '../../components/ui';
import { BRANCHES, canCompleteNextStage, canUndoLastStage, dependents, SKILL_BY_ID, skillStatus, stagesDone } from '../../lib/skills';
import { useStore } from '../../store';
import { radius, space, useTheme } from '../../theme';

export default function SkillDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch } = useStore();
  const { c } = useTheme();
  const toast = useToast();
  const [confirmUndo, setConfirmUndo] = useState(false);
  const skill = typeof id === 'string' ? SKILL_BY_ID[id] : undefined;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/skills'));

  if (!skill) {
    return (
      <Screen>
        <IconButton icon="chevron-back" label="Back" onPress={back} />
        <T v="h1" style={{ marginTop: space.lg }}>
          Skill not found
        </T>
      </Screen>
    );
  }

  const branch = BRANCHES.find((b) => b.id === skill.branch)!;
  const status = skillStatus(state.progress, skill.id);
  const done = stagesDone(state.progress, skill.id);
  const locked = status === 'locked';
  const undo = canUndoLastStage(state.progress, skill.id);

  const complete = () => {
    const next = canCompleteNextStage(state.progress, skill.id);
    if (!next.ok) return toast(next.reason, 'error');
    dispatch({ type: 'completeStage', skillId: skill.id, now: Date.now() });
    tap('success');
    toast(next.mastered ? `Mastered! +${next.xp} EXP` : `+${next.xp} EXP`, 'xp');
    setConfirmUndo(false);
  };

  const doUndo = () => {
    if (!undo.ok) {
      toast(undo.reason, 'error');
      return setConfirmUndo(false);
    }
    dispatch({ type: 'undoStage', skillId: skill.id, now: Date.now() });
    toast(`−${undo.xp} EXP`, 'info');
    setConfirmUndo(false);
  };

  return (
    <Screen>
      <IconButton icon="chevron-back" label="Back" onPress={back} />

      <View style={styles.hero}>
        <LayeredArt pose={SKILL_POSE[skill.id]} color={branch.color} size={190} state={status === 'mastered' ? 'done' : locked ? 'locked' : 'open'} sparkles depth={9} surface={c.surface} />
        <Label color={branch.color} style={{ marginTop: space.md }}>
          {branch.name} · Tier {skill.tier}
        </Label>
        <T v="display" center style={{ marginTop: 4 }}>
          {skill.name}
        </T>
        <T color="dim" center style={{ marginTop: 6, maxWidth: 340 }}>
          {skill.description}
        </T>
      </View>

      {locked ? (
        <Card style={{ marginTop: space.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Ionicons name="lock-closed" size={18} color={c.warning} />
            <T v="h2">Unlock first</T>
          </View>
          {skill.requires.map((r) => {
            const ok = skillStatus(state.progress, r) === 'mastered';
            return (
              <Pressable key={r} onPress={() => router.push({ pathname: '/skill/[id]', params: { id: r } })} style={[styles.reqRow, { borderTopColor: c.border }]} accessibilityRole="button">
                <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={ok ? c.success : c.textDim} />
                <T style={{ flex: 1, marginLeft: space.sm, fontWeight: '700' }}>{SKILL_BY_ID[r].name}</T>
                <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
              </Pressable>
            );
          })}
        </Card>
      ) : null}

      {/* Stage path */}
      <View style={{ marginTop: space.xl }}>
        {skill.stages.map((st, i) => {
          const isDone = i < done;
          const isNext = i === done && !locked;
          const isLastDone = i === done - 1;
          const color = isDone ? c.success : isNext ? branch.color : c.surfaceHigh;
          return (
            <View key={st.id} style={styles.stageRow}>
              <View style={styles.rail}>
                <Pressable
                  testID={`stage-${i}`}
                  disabled={!isNext && !isLastDone}
                  onPress={() => (isNext ? complete() : setConfirmUndo((v) => !v))}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isDone, disabled: !isNext && !isLastDone }}
                  accessibilityLabel={`Stage ${i + 1}: ${st.name}, ${st.target}`}
                  style={({ pressed }) => [styles.node, { backgroundColor: color, borderBottomColor: 'rgba(0,0,0,0.25)' }, pressed && { transform: [{ translateY: 2 }] }]}
                >
                  {isDone ? <Ionicons name="checkmark" size={26} color="#fff" /> : isNext ? <Ionicons name="star" size={22} color="#fff" /> : <Ionicons name="lock-closed" size={18} color={c.textFaint} />}
                </Pressable>
                {i < skill.stages.length - 1 ? <View style={[styles.line, { backgroundColor: isDone ? c.success : c.border }]} /> : null}
              </View>
              <View style={{ flex: 1, paddingTop: 10, paddingLeft: space.md, opacity: !isDone && !isNext ? 0.6 : 1 }}>
                <T style={{ fontWeight: '800' }}>{st.name}</T>
                <T v="small" color="dim">
                  {st.target}
                </T>
                {isNext ? (
                  <Text style={{ color: branch.color, fontWeight: '800', fontSize: 12, marginTop: 4 }}>TAP THE STAR WHEN YOU CAN DO IT</Text>
                ) : null}
                {isLastDone ? <Text style={{ color: c.textFaint, fontSize: 12, marginTop: 4 }}>Tap to untick</Text> : null}
              </View>
            </View>
          );
        })}
      </View>

      {confirmUndo && done > 0 ? (
        <Card style={{ marginTop: space.md }}>
          <T v="h2">Untick this stage?</T>
          <T color="dim" style={{ marginTop: 4 }}>
            {undo.ok ? `You lose ${undo.xp} EXP.` : undo.reason}
          </T>
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
            <Button label="Keep" variant="secondary" onPress={() => setConfirmUndo(false)} style={{ flex: 1 }} />
            {undo.ok ? <Button label="Untick" variant="danger" onPress={doUndo} style={{ flex: 1 }} testID="confirm-undo" /> : null}
          </View>
        </Card>
      ) : null}

      <Label style={{ marginTop: space.xl, marginBottom: space.md }}>Form</Label>
      <View style={styles.cues}>
        {skill.cues.map((cue) => (
          <View key={cue} style={[styles.cue, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name="checkmark-circle" size={16} color={branch.color} />
            <Text style={{ color: c.text, fontWeight: '600', flexShrink: 1 }}>{cue}</Text>
          </View>
        ))}
      </View>

      {dependents(skill.id).length > 0 ? (
        <>
          <Label style={{ marginTop: space.xl, marginBottom: space.md }}>Unlocks</Label>
          <View style={styles.cues}>
            {dependents(skill.id).map((u) => {
              const b = BRANCHES.find((x) => x.id === u.branch)!;
              return (
                <Pressable key={u.id} onPress={() => router.push({ pathname: '/skill/[id]', params: { id: u.id } })} style={[styles.unlock, { backgroundColor: c.surface, borderColor: b.color + '55' }]} accessibilityRole="button">
                  <LayeredArt pose={SKILL_POSE[u.id]} color={b.color} size={40} state="open" depth={0} surface={c.surfaceHigh} />
                  <Text style={{ color: c.text, fontWeight: '700' }}>{u.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: space.sm },
  reqRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, marginTop: space.sm },
  stageRow: { flexDirection: 'row' },
  rail: { width: 60, alignItems: 'center' },
  node: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 5 },
  line: { width: 4, flex: 1, minHeight: 18, borderRadius: 2, marginVertical: 4 },
  cues: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  cue: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1, maxWidth: '100%' },
  unlock: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingRight: 14, paddingLeft: 4, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1 },
});
