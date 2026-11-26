import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SkillIllustration } from '../components/illustrations/SkillIllustration';
import { Screen } from '../components/Screen';
import { Button, Card, Chip, Field } from '../components/ui';
import {
  ACTIVITY_LABEL,
  DIET_LABEL,
  GOAL_LABEL,
  parseNumber,
  validateProfile,
  type Activity,
  type DietType,
  type Goal,
  type Sex,
} from '../lib/profile';
import { useStore } from '../store';
import { colors, space, type } from '../theme';

export default function Onboarding() {
  const { state, dispatch } = useStore();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const editing = edit === '1' && !!state.profile;
  const p = state.profile;
  const [step, setStep] = useState(editing ? 1 : 0);
  const [name, setName] = useState(p?.name ?? '');
  const [sex, setSex] = useState<Sex>(p?.sex ?? 'male');
  const [age, setAge] = useState(p ? String(p.age) : '');
  const [height, setHeight] = useState(p ? String(p.heightCm) : '');
  const [weight, setWeight] = useState(p ? String(p.weightKg) : '');
  const [goal, setGoal] = useState<Goal>(p?.goal ?? 'gain');
  const [activity, setActivity] = useState<Activity>(p?.activity ?? 'moderate');
  const [diet, setDiet] = useState<DietType>(p?.diet ?? 'nonveg');
  const [showErrors, setShowErrors] = useState(false);

  const errors = validateProfile({ name, age, heightCm: height, weightKg: weight });
  const valid = Object.keys(errors).length === 0;

  const save = () => {
    if (!valid) {
      setShowErrors(true);
      return;
    }
    dispatch({
      type: 'setProfile',
      profile: {
        name: name.trim().slice(0, 24),
        sex,
        age: Math.round(parseNumber(age)),
        heightCm: Math.round(parseNumber(height)),
        weightKg: Math.round(parseNumber(weight) * 10) / 10,
        goal,
        activity,
        diet,
      },
    });
    if (editing && router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (step === 0) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={{ alignItems: 'center', marginTop: space.lg }}>
          <SkillIllustration branch="pull" height={200} />
        </View>
        <Text style={[type.small, { color: colors.accent, marginTop: space.xl }]}>CALISTHENICS AWAKENING</Text>
        <Text style={[type.display, { marginTop: space.sm }]}>Build real strength, one stage at a time.</Text>
        <Text style={[type.dim, { marginTop: space.md }]}>No more random workouts. Follow a skill tree from your first push-up to the front lever, earn EXP for every stage you clear, and rank up from E to S.</Text>
        <View style={{ marginTop: space.xl, gap: space.md }}>
          {[
            ['git-network', 'A skill tree with 22 skills across Push, Pull and Core'],
            ['checkbox', 'Daily goals you tick off for EXP'],
            ['flame', 'A guided warm-up before every session'],
            ['nutrition', 'A diet plan built from your body data'],
          ].map(([icon, text]) => (
            <View key={text} style={styles.feature}>
              <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.primary} />
              <Text style={[type.body, { flex: 1, marginLeft: space.md }]}>{text}</Text>
            </View>
          ))}
        </View>
        <Button label="Get started" onPress={() => setStep(1)} style={{ marginTop: space.xxl }} testID="onboarding-start" />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen edges={['top', 'bottom']}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => (editing ? router.back() : setStep(0))}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.back}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
        </View>
        <Text style={[type.h1, { marginTop: space.lg }]}>{editing ? 'Edit your body data' : 'Tell us about you'}</Text>
        <Text style={[type.dim, { marginTop: 4, marginBottom: space.lg }]}>We use this to set your daily goals and build your diet plan. It stays on your phone.</Text>

        <Card>
          <Field label="Name" value={name} onChangeText={setName} placeholder="What should we call you?" maxLength={24} error={showErrors ? errors.name : undefined} testID="field-name" />
          <Text style={styles.label}>Sex</Text>
          <Chip options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} value={sex} onChange={setSex} />
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
            <View style={{ flex: 1 }}>
              <Field label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="25" maxLength={3} error={showErrors ? errors.age : undefined} testID="field-age" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Height" suffix="cm" value={height} onChangeText={setHeight} keyboardType="decimal-pad" placeholder="175" maxLength={5} error={showErrors ? errors.heightCm : undefined} testID="field-height" />
            </View>
          </View>
          <Field label="Weight" suffix="kg" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="70" maxLength={5} error={showErrors ? errors.weightKg : undefined} testID="field-weight" />
        </Card>

        <Text style={[styles.label, { marginTop: space.xl }]}>Your goal</Text>
        <Chip options={(Object.keys(GOAL_LABEL) as Goal[]).map((g) => ({ value: g, label: GOAL_LABEL[g] }))} value={goal} onChange={setGoal} />
        <Text style={[styles.label, { marginTop: space.lg }]}>Daily activity outside training</Text>
        <Chip options={(Object.keys(ACTIVITY_LABEL) as Activity[]).map((a) => ({ value: a, label: ACTIVITY_LABEL[a] }))} value={activity} onChange={setActivity} />
        <Text style={[styles.label, { marginTop: space.lg }]}>How you eat</Text>
        <Chip options={(Object.keys(DIET_LABEL) as DietType[]).map((d) => ({ value: d, label: DIET_LABEL[d] }))} value={diet} onChange={setDiet} />

        {showErrors && !valid ? <Text style={styles.formError}>Check the fields marked in red above.</Text> : null}
        <Button label={editing ? 'Save changes' : 'Start my journey'} onPress={save} style={{ marginTop: space.xl }} testID="onboarding-save" />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  feature: { flexDirection: 'row', alignItems: 'center' },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  label: { ...type.dim, fontWeight: '600', marginBottom: space.sm },
  formError: { color: colors.danger, marginTop: space.lg, textAlign: 'center' },
});
