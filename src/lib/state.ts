// App state and reducer. Pure: no React Native imports, every date comes in through the action.
import type { CustomGoal, DailyGoal } from './goals';
import { PERFECT_DAY_BONUS, addDays } from './goals';
import type { Profile } from './profile';
import { canCompleteNextStage, canUndoLastStage, SKILL_BY_ID, stagesDone, type SkillProgress } from './skills';
import { levelFromXp } from './xp';

export interface XpEvent {
  at: number;
  label: string;
  xp: number;
}

export interface DayState {
  date: string;
  /** goal id -> EXP that was awarded for it, so unticking takes back exactly that. */
  done: Record<string, number>;
  bonus: number;
  total: number;
}

export interface AppState {
  version: 1;
  profile: Profile | null;
  xp: number;
  progress: SkillProgress;
  day: DayState;
  history: Record<string, { done: number; total: number }>;
  custom: CustomGoal[];
  warmups: number;
  log: XpEvent[];
  /** Highest level the user has already been congratulated for. */
  seenLevel: number;
}

export const STORAGE_KEY = 'calisthenics-awakening/state/v1';

export function initialState(today: string): AppState {
  return {
    version: 1,
    profile: null,
    xp: 0,
    progress: {},
    day: { date: today, done: {}, bonus: 0, total: 0 },
    history: {},
    custom: [],
    warmups: 0,
    log: [],
    seenLevel: 1,
  };
}

export type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'rollover'; today: string }
  | { type: 'setProfile'; profile: Profile }
  | { type: 'toggleGoal'; goal: DailyGoal; goals: DailyGoal[]; today: string; now: number }
  | { type: 'completeWarmup'; goals: DailyGoal[]; today: string; now: number }
  | { type: 'completeStage'; skillId: string; now: number }
  | { type: 'undoStage'; skillId: string; now: number }
  | { type: 'addCustom'; id: string; title: string }
  | { type: 'removeCustom'; id: string; goals: DailyGoal[]; today: string; now: number }
  | { type: 'ackLevel' }
  | { type: 'reset'; today: string };

const LOG_LIMIT = 40;

function addXp(state: AppState, xp: number, label: string, now: number): AppState {
  const log = xp === 0 ? state.log : [{ at: now, label, xp }, ...state.log].slice(0, LOG_LIMIT);
  return { ...state, xp: Math.max(0, state.xp + xp), log };
}

export function rollover(state: AppState, today: string): AppState {
  if (state.day.date === today) return state;
  const { day } = state;
  const history = { ...state.history };
  if (day.total > 0 || Object.keys(day.done).length > 0) {
    history[day.date] = { done: Object.keys(day.done).length, total: day.total };
  }
  return { ...state, history, day: { date: today, done: {}, bonus: 0, total: 0 } };
}

/** Awards or removes the perfect day bonus so it always matches the goal list. */
function settleBonus(state: AppState, goals: DailyGoal[], now: number): AppState {
  const allDone = goals.length > 0 && goals.every((g) => g.id in state.day.done);
  let next = { ...state, day: { ...state.day, total: goals.length } };
  if (allDone && next.day.bonus === 0) {
    next = addXp(next, PERFECT_DAY_BONUS, 'Perfect day bonus', now);
    next.day = { ...next.day, bonus: PERFECT_DAY_BONUS };
  } else if (!allDone && next.day.bonus > 0) {
    next = addXp(next, -next.day.bonus, 'Perfect day bonus removed', now);
    next.day = { ...next.day, bonus: 0 };
  }
  return next;
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'rollover':
      return rollover(state, action.today);
    case 'setProfile':
      return { ...state, profile: action.profile };
    case 'toggleGoal': {
      let next = rollover(state, action.today);
      const { goal } = action;
      const done = { ...next.day.done };
      if (goal.id in done) {
        const xp = done[goal.id];
        delete done[goal.id];
        next = { ...next, day: { ...next.day, done } };
        next = addXp(next, -xp, `Unticked: ${goal.title}`, action.now);
      } else {
        done[goal.id] = goal.xp;
        next = { ...next, day: { ...next.day, done } };
        next = addXp(next, goal.xp, goal.title, action.now);
      }
      return settleBonus(next, action.goals, action.now);
    }
    case 'completeWarmup': {
      let next = rollover(state, action.today);
      next = { ...next, warmups: next.warmups + 1 };
      const goal = action.goals.find((g) => g.kind === 'warmup');
      if (goal && !(goal.id in next.day.done)) {
        next = { ...next, day: { ...next.day, done: { ...next.day.done, [goal.id]: goal.xp } } };
        next = addXp(next, goal.xp, 'Warm-up complete', action.now);
      }
      return settleBonus(next, action.goals, action.now);
    }
    case 'completeStage': {
      const check = canCompleteNextStage(state.progress, action.skillId);
      if (!check.ok) return state;
      const skill = SKILL_BY_ID[action.skillId];
      const done = stagesDone(state.progress, action.skillId);
      const next = { ...state, progress: { ...state.progress, [action.skillId]: done + 1 } };
      const label = check.mastered ? `Mastered ${skill.name}` : `${skill.name}: ${skill.stages[done].name}`;
      return addXp(next, check.xp, label, action.now);
    }
    case 'undoStage': {
      const check = canUndoLastStage(state.progress, action.skillId);
      if (!check.ok) return state;
      const skill = SKILL_BY_ID[action.skillId];
      const done = stagesDone(state.progress, action.skillId);
      const progress = { ...state.progress, [action.skillId]: done - 1 };
      if (progress[action.skillId] === 0) delete progress[action.skillId];
      return addXp({ ...state, progress }, -check.xp, `Unticked ${skill.name} stage`, action.now);
    }
    case 'addCustom': {
      const title = action.title.trim().slice(0, 60);
      if (!title || state.custom.length >= 8) return state;
      return { ...state, custom: [...state.custom, { id: action.id, title }] };
    }
    case 'removeCustom': {
      let next = rollover(state, action.today);
      const goalId = `custom:${action.id}`;
      next = { ...next, custom: next.custom.filter((c) => c.id !== action.id) };
      if (goalId in next.day.done) {
        const xp = next.day.done[goalId];
        const done = { ...next.day.done };
        delete done[goalId];
        next = addXp({ ...next, day: { ...next.day, done } }, -xp, 'Removed goal', action.now);
      }
      return settleBonus(next, action.goals.filter((g) => g.id !== goalId), action.now);
    }
    case 'ackLevel':
      return { ...state, seenLevel: Math.max(state.seenLevel, levelFromXp(state.xp).level) };
    case 'reset':
      return { ...initialState(action.today), profile: state.profile };
    default:
      return state;
  }
}

/** Days in a row where every goal was ticked off. Today counts once it is perfect. */
export function streak(state: AppState): number {
  const perfect = (d: { done: number; total: number } | undefined) => !!d && d.total > 0 && d.done >= d.total;
  let count = 0;
  const today = state.day;
  const todayPerfect = today.total > 0 && Object.keys(today.done).length >= today.total;
  if (todayPerfect) count++;
  let key = addDays(today.date, -1);
  while (perfect(state.history[key])) {
    count++;
    key = addDays(key, -1);
  }
  return count;
}

/** Makes sure data loaded from storage has every field, so old or partial saves never crash the app. */
export function sanitize(raw: unknown, today: string): AppState {
  const base = initialState(today);
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<AppState>;
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  const progress: SkillProgress = {};
  if (r.progress && typeof r.progress === 'object') {
    for (const [k, v] of Object.entries(r.progress)) if (SKILL_BY_ID[k] && typeof v === 'number' && v > 0) progress[k] = Math.min(v, SKILL_BY_ID[k].stages.length);
  }
  const day = r.day && typeof r.day === 'object' && typeof r.day.date === 'string'
    ? { date: r.day.date, done: r.day.done && typeof r.day.done === 'object' ? r.day.done : {}, bonus: num(r.day.bonus, 0), total: num(r.day.total, 0) }
    : base.day;
  const state: AppState = {
    version: 1,
    profile: r.profile && typeof r.profile === 'object' ? r.profile : null,
    xp: Math.max(0, num(r.xp, 0)),
    progress,
    day,
    history: r.history && typeof r.history === 'object' ? r.history : {},
    custom: Array.isArray(r.custom) ? r.custom.filter((c) => c && typeof c.id === 'string' && typeof c.title === 'string') : [],
    warmups: num(r.warmups, 0),
    log: Array.isArray(r.log) ? r.log.slice(0, LOG_LIMIT) : [],
    seenLevel: num(r.seenLevel, 1),
  };
  return rollover(state, today);
}
