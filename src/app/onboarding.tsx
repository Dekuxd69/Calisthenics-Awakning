import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { LayeredArt } from '../components/art/LayeredArt';
import { Screen } from '../components/Screen';
import { Button, Chip, Field, IconButton, NumberTile, Segmented, T } from '../components/ui';
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
import { ff, LIME, space, useStyles, useTheme, type Palette } from '../theme';

export default function Onboarding() {
  const { c: colors } = useTheme();
  const styles = useStyles(makeStyles);
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
          <LayeredArt pose="frontLever" color={LIME} size={170} sparkles depth={10} state="done" style={{ position: 'absolute', top: 0, left: 0 }} />
          <LayeredArt pose="planche" color={LIME} size={124} depth={6} surface={colors.surface} style={{ position: 'absolute', top: 120, right: 0 }} />
          <LayeredArt pose="humanFlag" color={LIME} size={104} depth={14} surface={colors.surface} style={{ position: 'absolute', top: 196, left: 36 }} />
        </View>
        <T v="label" color="lime" style={{ marginTop: space.lg }}>
          CALISTHENICS AWAKENING
        </T>
        <T v="hero" style={{ marginTop: space.sm }}>
          Level up your body.
        </T>
        <T color="dim" style={{ marginTop: space.sm }}>
          Clear stages. Earn EXP. Rank up from E to S.
        </T>
        <Button label="Get started" onPress={() => setStep(1)} style={{ marginTop: space.xxl }} testID="onboarding-start" />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen edges={['top', 'bottom']}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton icon="chevron-back" label="Back" onPress={() => (editing ? router.back() : setStep(0))} />
        </View>
        <T v="display" style={{ marginTop: space.lg }}>
          {editing ? 'Body data' : 'About you'}
        </T>
        <T color="dim" style={{ marginTop: 4, marginBottom: space.lg }}>
          For your quests and diet plan. Stays on your phone.
        </T>

        <Field label="Name" value={name} onChangeText={setName} placeholder="Your name" maxLength={24} error={showErrors ? errors.name : undefined} testID="field-name" />
        <Segmented options={[{ value: 'male', label: 'Male', icon: 'male' }, { value: 'female', label: 'Female', icon: 'female' }]} value={sex} onChange={setSex} />
        <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
          <NumberTile label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="25" maxLength={3} error={showErrors ? errors.age : undefined} testID="field-age" />
          <NumberTile label="Height" unit="cm" value={height} onChangeText={setHeight} keyboardType="decimal-pad" placeholder="175" maxLength={5} error={showErrors ? errors.heightCm : undefined} testID="field-height" />
        </View>
        <View style={{ flexDirection: 'row', marginTop: space.sm }}>
          <NumberTile label="Weight" unit="kg" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="70" maxLength={5} error={showErrors ? errors.weightKg : undefined} testID="field-weight" />
        </View>

        <Text style={[styles.label, { marginTop: space.xl }]}>Goal</Text>
        <Chip options={(Object.keys(GOAL_LABEL) as Goal[]).map((g) => ({ value: g, label: GOAL_LABEL[g] }))} value={goal} onChange={setGoal} />
        <Text style={[styles.label, { marginTop: space.lg }]}>Daily activity</Text>
        <Chip options={(Object.keys(ACTIVITY_LABEL) as Activity[]).map((a) => ({ value: a, label: ACTIVITY_LABEL[a] }))} value={activity} onChange={setActivity} />
        <Text style={[styles.label, { marginTop: space.lg }]}>Diet</Text>
        <Chip options={(Object.keys(DIET_LABEL) as DietType[]).map((d) => ({ value: d, label: DIET_LABEL[d] }))} value={diet} onChange={setDiet} />

        {showErrors && !valid ? <Text style={styles.formError}>Check the fields marked in red.</Text> : null}
        <Button label={editing ? 'Save changes' : 'Start my journey'} onPress={save} style={{ marginTop: space.xl }} testID="onboarding-save" />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  label: { fontSize: 14, color: colors.textDim, fontFamily: ff.medium, marginBottom: space.sm },
  heroArt: { height: 310, marginTop: space.lg, width: '100%', maxWidth: 340, alignSelf: 'center' },
  formError: { color: colors.danger, fontFamily: ff.regular, marginTop: space.lg, textAlign: 'center' },
});
