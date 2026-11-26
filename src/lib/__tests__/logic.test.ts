/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levelFromXp, rankForLevel, xpForLevel, RANKS } from '../xp';
import { SKILLS, SKILL_BY_ID, canCompleteNextStage, canUndoLastStage, isUnlocked, skillStatus, masteryBonus, stageXp } from '../skills';
import { reducer, initialState, streak, sanitize, type AppState } from '../state';
import { generateGoals, addDays, dateKey, PERFECT_DAY_BONUS } from '../goals';
import { buildDietPlan } from '../diet';
import { validateProfile, type Profile } from '../profile';

const profile: Profile = { name: 'A', sex: 'male', age: 25, heightCm: 178, weightKg: 75, goal: 'maintain', activity: 'moderate', diet: 'nonveg' };
const today = '2026-11-26';

test('levels and ranks', () => {
  assert.equal(levelFromXp(0).level, 1);
  assert.equal(levelFromXp(49).level, 1);
  assert.equal(levelFromXp(50).level, 2);
  assert.equal(levelFromXp(150).level, 3);
  for (let l = 1; l < 40; l++) {
    const info = levelFromXp(xpForLevel(l));
    assert.equal(info.level, l);
    assert.equal(info.current, 0);
  }
  assert.equal(rankForLevel(1).id, 'E');
  assert.equal(rankForLevel(100).id, 'S');
  assert.equal(RANKS.length, 6);
});

test('skill data is consistent', () => {
  const ids = new Set<string>();
  for (const k of SKILLS) {
    assert.ok(!ids.has(k.id), `duplicate ${k.id}`);
    ids.add(k.id);
    assert.ok(k.stages.length > 0);
    for (const r of k.requires) assert.ok(SKILL_BY_ID[r], `${k.id} requires missing ${r}`);
    const stageIds = new Set(k.stages.map((s) => s.id));
    assert.equal(stageIds.size, k.stages.length);
  }
  // Every skill must be reachable (no cycles).
  const progress: Record<string, number> = {};
  for (let pass = 0; pass < SKILLS.length; pass++) {
    for (const k of SKILLS) if (isUnlocked(progress, k.id)) progress[k.id] = k.stages.length;
  }
  for (const k of SKILLS) assert.equal(progress[k.id], k.stages.length, `${k.id} unreachable`);
});

test('skill stages unlock, award EXP and undo cleanly', () => {
  let s = initialState(today);
  assert.equal(skillStatus(s.progress, 'pushup'), 'locked');
  s = reducer(s, { type: 'completeStage', skillId: 'pushup', now: 1 });
  assert.equal(s.xp, 0, 'locked skill cannot be ticked');
  const k = SKILL_BY_ID['incline-pushup'];
  for (let i = 0; i < k.stages.length; i++) s = reducer(s, { type: 'completeStage', skillId: k.id, now: 1 });
  assert.equal(s.xp, stageXp(k) * k.stages.length + masteryBonus(k));
  assert.equal(skillStatus(s.progress, 'pushup'), 'available');
  s = reducer(s, { type: 'completeStage', skillId: k.id, now: 1 });
  assert.equal(s.progress[k.id], k.stages.length, 'cannot go past mastered');
  s = reducer(s, { type: 'completeStage', skillId: 'pushup', now: 1 });
  assert.equal(canUndoLastStage(s.progress, k.id).ok, false, 'dependent started, cannot un-master');
  s = reducer(s, { type: 'undoStage', skillId: 'pushup', now: 1 });
  for (let i = 0; i < k.stages.length; i++) s = reducer(s, { type: 'undoStage', skillId: k.id, now: 1 });
  assert.equal(s.xp, 0);
  assert.deepEqual(s.progress, {});
  assert.equal(canCompleteNextStage(s.progress, k.id).ok, true);
});

test('daily goals tick, untick, perfect bonus and rollover', () => {
  let s: AppState = { ...initialState(today), profile };
  const goals = generateGoals({ date: new Date(2026, 10, 26), profile, level: 1, progress: {}, custom: [] });
  assert.ok(goals.length >= 4);
  const sum = goals.reduce((t, g) => t + g.xp, 0);
  for (const g of goals) s = reducer(s, { type: 'toggleGoal', goal: g, goals, today, now: 1 });
  assert.equal(s.xp, sum + PERFECT_DAY_BONUS);
  assert.equal(streak(s), 1);
  s = reducer(s, { type: 'toggleGoal', goal: goals[0], goals, today, now: 1 });
  assert.equal(s.xp, sum - goals[0].xp, 'untick removes goal EXP and bonus');
  s = reducer(s, { type: 'toggleGoal', goal: goals[0], goals, today, now: 1 });
  // Next day: fresh list, streak kept from history.
  const tomorrow = addDays(today, 1);
  s = reducer(s, { type: 'rollover', today: tomorrow });
  assert.equal(Object.keys(s.day.done).length, 0);
  assert.equal(streak(s), 1);
  s = reducer(s, { type: 'rollover', today: addDays(today, 3) });
  assert.equal(streak(s), 0);
});

test('warm-up ticks its goal once', () => {
  let s: AppState = { ...initialState(today), profile };
  const goals = generateGoals({ date: new Date(2026, 10, 26), profile, level: 1, progress: {}, custom: [] });
  s = reducer(s, { type: 'completeWarmup', goals, today, now: 1 });
  s = reducer(s, { type: 'completeWarmup', goals, today, now: 1 });
  assert.equal(s.xp, 20);
  assert.equal(s.warmups, 2);
});

test('custom goals', () => {
  let s = initialState(today);
  s = reducer(s, { type: 'addCustom', id: 'x', title: '  Stretch  ' });
  s = reducer(s, { type: 'addCustom', id: 'y', title: '   ' });
  assert.deepEqual(s.custom, [{ id: 'x', title: 'Stretch' }]);
  const goals = generateGoals({ date: new Date(), profile: null, level: 1, progress: {}, custom: s.custom });
  const g = goals.find((x) => x.id === 'custom:x')!;
  s = reducer(s, { type: 'toggleGoal', goal: g, goals, today, now: 1 });
  assert.equal(s.xp, 10);
  s = reducer(s, { type: 'removeCustom', id: 'x', goals, today, now: 1 });
  assert.equal(s.xp, 0);
});

test('diet plan', () => {
  const p = buildDietPlan(profile);
  assert.ok(p.calories > 2200 && p.calories < 3000, String(p.calories));
  assert.equal(p.proteinG, 120);
  assert.ok(Math.abs(p.proteinG * 4 + p.fatG * 9 + p.carbsG * 4 - p.calories) < 15);
  const cut = buildDietPlan({ ...profile, goal: 'lose', sex: 'female', weightKg: 45, heightCm: 150, age: 60, activity: 'low' });
  assert.ok(cut.calories >= 1200);
  for (const d of ['nonveg', 'veg', 'vegan'] as const) assert.equal(buildDietPlan({ ...profile, diet: d }).meals.length, 4);
});

test('profile validation', () => {
  assert.deepEqual(validateProfile({ name: 'A', age: '25', heightCm: '178', weightKg: '75,5' }), {});
  const e = validateProfile({ name: ' ', age: 'x', heightCm: '10', weightKg: '' });
  assert.ok(e.name && e.age && e.heightCm && e.weightKg);
});

test('sanitize survives junk', () => {
  assert.equal(sanitize(null, today).xp, 0);
  const s = sanitize({ xp: 'lots', progress: { pushup: 99, fake: 2 }, day: { date: '2020-01-01', done: { a: 5 }, total: 1 } }, today);
  assert.equal(s.xp, 0);
  assert.equal(s.progress.pushup, SKILL_BY_ID.pushup.stages.length);
  assert.equal(s.progress.fake, undefined);
  assert.equal(s.day.date, today);
  assert.equal(dateKey(new Date(2026, 0, 5)), '2026-01-05');
});
