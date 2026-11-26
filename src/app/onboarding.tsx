import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LayeredArt } from '../components/art/LayeredArt';
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
import { space, useStyles, useTheme, useType, type Palette } from '../theme';

export default function Onboarding() {
  const { c: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const type = useType();
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
        <View style={styles.heroArt}>
          <LayeredArt pose="frontLever" color="#38BDF8" size={150} sparkles depth={10} style={{ position: 'absolute', top: 0, left: 0 }} />
          <LayeredArt pose="planche" color="#F97316" size={120} sparkles depth={6} style={{ position: 'absolute', top: 120, right: 0 }} />
          <LayeredArt pose="humanFlag" color="#A78BFA" size={104} sparkles depth={14} style={{ position: 'absolute', top: 190, left: 30 }} />
        </View>
        <Text style={[type.small, { color: colors.accent, marginTop: space.lg }]}>CALISTHENICS AWAKENING</Text>
        <Text style={[type.display, { marginTop: space.sm }]}>Level up your body.</Text>
        <Text style={[type.dim, { marginTop: space.sm }]}>Clear stages. Earn EXP. Rank up from E to S.</Text>
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
        <Text style={[type.h1, { marginTop: space.lg }]}>{editing ? 'Body data' : 'About you'}</Text>
        <Text style={[type.dim, { marginTop: 4, marginBottom: space.lg }]}>For your quests and diet plan. Stays on your phone.</Text>

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

const makeStyles = (colors: Palette) => StyleSheet.create({
  feature: { flexDirection: 'row', alignItems: 'center' },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 14, color: colors.textDim, fontWeight: '700', marginBottom: space.sm },
  heroArt: { height: 300, marginTop: space.lg, width: '100%', maxWidth: 340, alignSelf: 'center' },
  formError: { color: colors.danger, marginTop: space.lg, textAlign: 'center' },
});
