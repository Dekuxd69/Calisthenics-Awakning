import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { useToast } from '../../components/Toast';
import { Button, Card, Checkbox, Pill, ProgressBar, SectionTitle, tap } from '../../components/ui';
import { BRANCHES, canCompleteNextStage, canUndoLastStage, dependents, masteryBonus, SKILL_BY_ID, skillStatus, stagesDone, stageXp } from '../../lib/skills';
import { useStore } from '../../store';
import { colors, radius, space, type } from '../../theme';

function BackButton() {
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/skills'))}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={styles.back}
    >
      <Ionicons name="chevron-back" size={22} color={colors.text} />
    </Pressable>
  );
}

export default function SkillDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [confirmUndo, setConfirmUndo] = useState(false);
  const skill = typeof id === 'string' ? SKILL_BY_ID[id] : undefined;

  if (!skill) {
    return (
      <Screen>
        <BackButton />
        <Text style={[type.h1, { marginTop: space.lg }]}>Skill not found</Text>
      </Screen>
    );
  }

  const branch = BRANCHES.find((b) => b.id === skill.branch)!;
  const status = skillStatus(state.progress, skill.id);
  const done = stagesDone(state.progress, skill.id);
  const locked = status === 'locked';
  const next = canCompleteNextStage(state.progress, skill.id);
  const undo = canUndoLastStage(state.progress, skill.id);

  const complete = () => {
    if (!next.ok) {
      toast(next.reason, 'error');
      return;
    }
    dispatch({ type: 'completeStage', skillId: skill.id, now: Date.now() });
    tap('success');
    toast(next.mastered ? `${skill.name} mastered! +${next.xp} EXP` : `Stage cleared! +${next.xp} EXP`, 'xp');
    setConfirmUndo(false);
  };

  const doUndo = () => {
    if (!undo.ok) {
      toast(undo.reason, 'error');
      setConfirmUndo(false);
      return;
    }
    dispatch({ type: 'undoStage', skillId: skill.id, now: Date.now() });
    toast(`Stage unticked. −${undo.xp} EXP`, 'info');
    setConfirmUndo(false);
  };

  const unlocks = dependents(skill.id);

  return (
    <Screen>
      <BackButton />
      <View style={{ marginTop: space.md }}>
        <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
          <Pill text={branch.name.toUpperCase()} color={branch.color} />
          <Pill text={`TIER ${skill.tier}`} color={colors.textDim} />
          {status === 'mastered' ? <Pill text="MASTERED" color={colors.success} /> : null}
          {locked ? <Pill text="LOCKED" color={colors.textFaint} /> : null}
        </View>
        <Text style={[type.display, { marginTop: space.md }]}>{skill.name}</Text>
        <Text style={[type.dim, { marginTop: space.sm }]}>{skill.description}</Text>
        <View style={{ marginTop: space.lg }}>
          <ProgressBar value={done / skill.stages.length} color={status === 'mastered' ? colors.success : branch.color} />
          <Text style={[type.dim, { fontSize: 12, marginTop: 6 }]}>
            {done} of {skill.stages.length} stages · {stageXp(skill)} EXP each · +{masteryBonus(skill)} mastery bonus
          </Text>
        </View>
      </View>

      {locked ? (
        <Card style={{ marginTop: space.lg, borderColor: colors.warning + '55' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Ionicons name="lock-closed" size={18} color={colors.warning} />
            <Text style={type.h2}>Unlock this skill first</Text>
          </View>
          <Text style={[type.dim, { marginTop: space.sm }]}>Master these to build the strength this skill needs:</Text>
          {skill.requires.map((r) => {
            const req = SKILL_BY_ID[r];
            const ok = skillStatus(state.progress, r) === 'mastered';
            return (
              <Pressable key={r} onPress={() => router.push({ pathname: '/skill/[id]', params: { id: r } })} style={styles.reqRow} accessibilityRole="button">
                <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={ok ? colors.success : colors.textDim} />
                <Text style={[type.body, { flex: 1, marginLeft: space.sm }]}>{req.name}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
              </Pressable>
            );
          })}
        </Card>
      ) : null}

      <SectionTitle>Stages</SectionTitle>
      <View>
        {skill.stages.map((st, i) => {
          const isDone = i < done;
          const isNext = i === done && !locked;
          const isLastDone = i === done - 1;
          return (
            <View key={st.id} style={styles.stageWrap}>
              <View style={styles.rail}>
                <View style={[styles.dot, isDone && { backgroundColor: colors.success, borderColor: colors.success }, isNext && { borderColor: branch.color }]}>
                  <Text style={[styles.dotText, isDone && { color: '#06101A' }]}>{i + 1}</Text>
                </View>
                {i < skill.stages.length - 1 ? <View style={[styles.line, isDone && { backgroundColor: colors.success }]} /> : null}
              </View>
              <Pressable
                testID={`stage-${i}`}
                disabled={!isNext && !isLastDone}
                onPress={() => (isNext ? complete() : setConfirmUndo((v) => !v))}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isDone, disabled: !isNext && !isLastDone }}
                accessibilityLabel={`${st.name}, ${st.target}`}
                style={[styles.stage, isDone && styles.stageDone, isNext && { borderColor: branch.color }, !isDone && !isNext && { opacity: 0.5 }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.stageName}>{st.name}</Text>
                  <Text style={styles.stageTarget}>{st.target}</Text>
                  {isNext ? <Text style={[styles.hint, { color: branch.color }]}>Tap when you can do this · +{stageXp(skill) + (i === skill.stages.length - 1 ? masteryBonus(skill) : 0)} EXP</Text> : null}
                  {isLastDone ? <Text style={styles.hintDim}>Tap to untick</Text> : null}
                </View>
                {isDone || isNext ? <Checkbox checked={isDone} /> : <Ionicons name="lock-closed-outline" size={18} color={colors.textFaint} />}
              </Pressable>
            </View>
          );
        })}
      </View>

      {confirmUndo && done > 0 ? (
        <Card style={{ marginTop: space.md }}>
          <Text style={type.h2}>Untick “{skill.stages[done - 1].name}”?</Text>
          <Text style={[type.dim, { marginTop: 4 }]}>{undo.ok ? `You will lose ${undo.xp} EXP.` : undo.reason}</Text>
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
            <Button label="Keep it" variant="secondary" onPress={() => setConfirmUndo(false)} style={{ flex: 1 }} />
            {undo.ok ? <Button label="Untick" variant="danger" onPress={doUndo} style={{ flex: 1 }} /> : null}
          </View>
        </Card>
      ) : null}

      <SectionTitle>Form cues</SectionTitle>
      <Card>
        {skill.cues.map((c) => (
          <View key={c} style={styles.cue}>
            <Ionicons name="checkmark-done" size={18} color={branch.color} />
            <Text style={[type.body, { flex: 1, marginLeft: space.sm }]}>{c}</Text>
          </View>
        ))}
      </Card>

      {unlocks.length > 0 ? (
        <>
          <SectionTitle>Unlocks</SectionTitle>
          {unlocks.map((u) => (
            <Pressable key={u.id} onPress={() => router.push({ pathname: '/skill/[id]', params: { id: u.id } })} style={styles.unlock} accessibilityRole="button">
              <Ionicons name="arrow-forward-circle" size={22} color={BRANCHES.find((b) => b.id === u.branch)!.color} />
              <Text style={[type.body, { flex: 1, marginLeft: space.sm, fontWeight: '600' }]}>{u.name}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </Pressable>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  reqRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border, marginTop: space.sm },
  stageWrap: { flexDirection: 'row' },
  rail: { width: 36, alignItems: 'center' },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  dotText: { color: colors.textDim, fontSize: 12, fontWeight: '800' },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  stage: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: space.md, marginBottom: space.sm, marginLeft: space.sm, minHeight: 64 },
  stageDone: { backgroundColor: colors.successSoft, borderColor: colors.success + '66' },
  stageName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  stageTarget: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  hint: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  hintDim: { fontSize: 12, color: colors.textFaint, marginTop: 6 },
  cue: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6 },
  unlock: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: space.md, marginBottom: space.sm },
});
