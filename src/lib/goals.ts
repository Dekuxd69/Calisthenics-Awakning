import { buildDietPlan } from './diet';
import type { Profile } from './profile';
import { SKILLS, stagesDone, skillStatus, type SkillProgress } from './skills';

export type GoalKind = 'warmup' | 'train' | 'skill' | 'water' | 'protein' | 'custom';

export interface DailyGoal {
  id: string;
  kind: GoalKind;
  title: string;
  detail: string;
  xp: number;
}

export interface CustomGoal {
  id: string;
  title: string;
}

export type DayFocus = 'push' | 'pull' | 'legs' | 'rest';

/** Weekly rotation, Sunday = 0. */
const ROTATION: DayFocus[] = ['rest', 'push', 'pull', 'legs', 'push', 'pull', 'legs'];

export function dayFocus(date: Date): DayFocus {
  return ROTATION[date.getDay()];
}

export const FOCUS_LABEL: Record<DayFocus, string> = {
  push: 'Push day',
  pull: 'Pull day',
  legs: 'Legs & core day',
  rest: 'Active recovery',
};

/** Local calendar date as YYYY-MM-DD. */
export function dateKey(d: Date): string {
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

function trainingGoal(focus: DayFocus, level: number): DailyGoal {
  // Volume grows slowly with level so the goals keep up with you.
  const bump = Math.min(10, Math.floor((level - 1) / 2));
  switch (focus) {
    case 'push':
      return { id: 'train', kind: 'train', title: 'Push workout', detail: `4× ${6 + bump} push-ups · ${5 + bump} pike · 30s plank`, xp: 40 };
    case 'pull':
      return { id: 'train', kind: 'train', title: 'Pull workout', detail: `4× ${8 + bump} rows · ${20 + bump * 2}s hang · ${8 + bump} scap pulls`, xp: 40 };
    case 'legs':
      return { id: 'train', kind: 'train', title: 'Legs & core workout', detail: `4× ${15 + bump} squats · ${8 + bump} lunges · ${20 + bump * 2}s hollow`, xp: 40 };
    default:
      return { id: 'train', kind: 'train', title: 'Walk & stretch', detail: '20 min walk · 10 min stretch', xp: 25 };
  }
}

/** The skill to practise today: the furthest along unlocked skill, preferring today's focus. */
export function practiceSkill(progress: SkillProgress, focus: DayFocus) {
  const branchForFocus = focus === 'push' ? 'push' : focus === 'pull' ? 'pull' : 'core';
  const open = SKILLS.filter((k) => {
    const st = skillStatus(progress, k.id);
    return st === 'available' || st === 'in-progress';
  });
  const sorted = [...open].sort((a, b) => {
    const fa = a.branch === branchForFocus ? 0 : 1;
    const fb = b.branch === branchForFocus ? 0 : 1;
    if (fa !== fb) return fa - fb;
    const pa = stagesDone(progress, a.id) > 0 ? 0 : 1;
    const pb = stagesDone(progress, b.id) > 0 ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return a.tier - b.tier;
  });
  return sorted[0] ?? null;
}

export function generateGoals(opts: {
  date: Date;
  profile: Profile | null;
  level: number;
  progress: SkillProgress;
  custom: CustomGoal[];
}): DailyGoal[] {
  const focus = dayFocus(opts.date);
  const goals: DailyGoal[] = [
    { id: 'warmup', kind: 'warmup', title: 'Warm up', detail: '5 min guided', xp: 20 },
    trainingGoal(focus, opts.level),
  ];
  const skill = practiceSkill(opts.progress, focus);
  if (skill) {
    const stage = skill.stages[stagesDone(opts.progress, skill.id)];
    goals.push({
      id: 'skill',
      kind: 'skill',
      title: skill.name,
      detail: stage ? `${stage.name} · ${stage.target}` : skill.name,
      xp: 30,
    });
  }
  if (opts.profile) {
    const plan = buildDietPlan(opts.profile);
    goals.push({ id: 'water', kind: 'water', title: `Drink ${plan.waterL} L water`, detail: 'Through the day', xp: 10 });
    goals.push({ id: 'protein', kind: 'protein', title: `Eat ${plan.proteinG} g protein`, detail: 'See your diet plan', xp: 15 });
  }
  for (const c of opts.custom) {
    goals.push({ id: `custom:${c.id}`, kind: 'custom', title: c.title, detail: 'Your goal', xp: 10 });
  }
  return goals;
}

/** Bonus EXP from the daily chest, which opens once every quest is done. Varies by day so it feels like a reward. */
export function chestXp(date: string): number {
  let h = 0;
  for (const ch of date) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 25 + (h % 6) * 5;
}
