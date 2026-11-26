// App state and reducer. Pure: no React Native imports, every date comes in through the action.
import { BADGES } from './badges';
import type { CustomGoal, DailyGoal } from './goals';
import { addDays, chestXp } from './goals';
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
  /** EXP from the daily chest, 0 while unopened. */
  chest: number;
  total: number;
}

export type ThemeMode = 'system' | 'dark' | 'light';

export interface AppState {
  version: 2;
  profile: Profile | null;
  xp: number;
  progress: SkillProgress;
  day: DayState;
  history: Record<string, { done: number; total: number }>;
  custom: CustomGoal[];
  warmups: number;
  questsDone: number;
  chests: number;
  bestStreak: number;
  log: XpEvent[];
  /** Highest level the user has already been congratulated for. */
  seenLevel: number;
  /** badge id -> time it was earned. */
  badges: Record<string, number>;
  /** Badges the user has already seen the celebration for. */
  seenBadges: string[];
  settings: { theme: ThemeMode; haptics: boolean };
}

export const STORAGE_KEY = 'calisthenics-awakening/state/v1';

export function initialState(today: string): AppState {
  return {
    version: 2,
    profile: null,
    xp: 0,
    progress: {},
    day: { date: today, done: {}, chest: 0, total: 0 },
    history: {},
    custom: [],
    warmups: 0,
    questsDone: 0,
    chests: 0,
    bestStreak: 0,
    log: [],
    seenLevel: 1,
    badges: {},
    seenBadges: [],
    settings: { theme: 'dark', haptics: true },
  };
}

export type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'rollover'; today: string }
  | { type: 'setProfile'; profile: Profile }
  | { type: 'toggleGoal'; goal: DailyGoal; goals: DailyGoal[]; today: string; now: number }
  | { type: 'completeWarmup'; goals: DailyGoal[]; today: string; now: number }
  | { type: 'claimChest'; goals: DailyGoal[]; today: string; now: number }
  | { type: 'completeStage'; skillId: string; now: number }
  | { type: 'undoStage'; skillId: string; now: number }
  | { type: 'addCustom'; id: string; title: string }
  | { type: 'removeCustom'; id: string; goals: DailyGoal[]; today: string; now: number }
  | { type: 'ackLevel' }
  | { type: 'ackBadge'; id: string }
  | { type: 'setTheme'; theme: ThemeMode }
  | { type: 'setHaptics'; on: boolean }
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
  return { ...state, history, day: { date: today, done: {}, chest: 0, total: 0 } };
}

const isActive = (d: { done: number } | undefined) => !!d && d.done > 0;

/** Days in a row with at least one quest done. Today counts once something is ticked. */
export function streak(state: AppState): number {
  let count = Object.keys(state.day.done).length > 0 ? 1 : 0;
  let key = addDays(state.day.date, -1);
  while (isActive(state.history[key])) {
    count++;
    key = addDays(key, -1);
  }
  return count;
}

/** Last 7 days ending today, for the streak strip. */
export function weekStrip(state: AppState): { date: string; active: boolean; perfect: boolean; today: boolean }[] {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(state.day.date, -i);
    if (i === 0) {
      const done = Object.keys(state.day.done).length;
      out.push({ date, active: done > 0, perfect: state.day.total > 0 && done >= state.day.total, today: true });
    } else {
      const h = state.history[date];
      out.push({ date, active: isActive(h), perfect: !!h && h.total > 0 && h.done >= h.total, today: false });
    }
  }
  return out;
}

/** Keeps best streak and earned badges in sync after every change. */
function settle(state: AppState, now: number): AppState {
  const bestStreak = Math.max(state.bestStreak, streak(state));
  let next = bestStreak === state.bestStreak ? state : { ...state, bestStreak };
  const input = { xp: next.xp, progress: next.progress, warmups: next.warmups, questsDone: next.questsDone, chests: next.chests, bestStreak };
  let badges = next.badges;
  for (const b of BADGES) {
    if (!(b.id in badges) && b.check(input)) badges = { ...badges, [b.id]: now };
  }
  if (badges !== next.badges) next = { ...next, badges };
  return next;
}

function core(state: AppState, action: Action): AppState {
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
        next = { ...next, questsDone: Math.max(0, next.questsDone - 1), day: { ...next.day, done, total: action.goals.length } };
        return addXp(next, -xp, `Unticked: ${goal.title}`, action.now);
      }
      done[goal.id] = goal.xp;
      next = { ...next, questsDone: next.questsDone + 1, day: { ...next.day, done, total: action.goals.length } };
      return addXp(next, goal.xp, goal.title, action.now);
    }
    case 'completeWarmup': {
      let next = rollover(state, action.today);
      next = { ...next, warmups: next.warmups + 1, day: { ...next.day, total: action.goals.length } };
      const goal = action.goals.find((g) => g.kind === 'warmup');
      if (goal && !(goal.id in next.day.done)) {
        next = { ...next, questsDone: next.questsDone + 1, day: { ...next.day, done: { ...next.day.done, [goal.id]: goal.xp } } };
        next = addXp(next, goal.xp, 'Warm-up complete', action.now);
      }
      return next;
    }
    case 'claimChest': {
      const next = rollover(state, action.today);
      const allDone = action.goals.length > 0 && action.goals.every((g) => g.id in next.day.done);
      if (!allDone || next.day.chest > 0) return next;
      const xp = chestXp(action.today);
      return addXp({ ...next, chests: next.chests + 1, day: { ...next.day, chest: xp, total: action.goals.length } }, xp, 'Daily chest', action.now);
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
      const title = action.title.trim().slice(0, 40);
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
        next = addXp({ ...next, questsDone: Math.max(0, next.questsDone - 1), day: { ...next.day, done } }, -xp, 'Removed quest', action.now);
      }
      return { ...next, day: { ...next.day, total: action.goals.filter((g) => g.id !== goalId).length } };
    }
    case 'ackLevel':
      return { ...state, seenLevel: Math.max(state.seenLevel, levelFromXp(state.xp).level) };
    case 'ackBadge':
      return state.seenBadges.includes(action.id) ? state : { ...state, seenBadges: [...state.seenBadges, action.id] };
    case 'setTheme':
      return { ...state, settings: { ...state.settings, theme: action.theme } };
    case 'setHaptics':
      return { ...state, settings: { ...state.settings, haptics: action.on } };
    case 'reset': {
      const fresh = initialState(action.today);
      return { ...fresh, profile: state.profile, settings: state.settings };
    }
    default:
      return state;
  }
}

export function reducer(state: AppState, action: Action): AppState {
  const next = core(state, action);
  if (next === state || action.type === 'hydrate' || action.type === 'ackBadge' || action.type === 'ackLevel') return next;
  const now = 'now' in action ? action.now : Date.now();
  return settle(next, now);
}

/** The next badge celebration to show, if any. */
export function pendingBadge(state: AppState): string | null {
  return Object.keys(state.badges).find((id) => !state.seenBadges.includes(id)) ?? null;
}

/** Makes sure data loaded from storage has every field, so old or partial saves never crash the app. */
export function sanitize(raw: unknown, today: string): AppState {
  const base = initialState(today);
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<AppState> & { day?: Partial<DayState> & { bonus?: number } };
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  const obj = <T,>(v: unknown, d: T): T => (v && typeof v === 'object' && !Array.isArray(v) ? (v as T) : d);
  const progress: SkillProgress = {};
  for (const [k, v] of Object.entries(obj(r.progress, {} as Record<string, unknown>))) {
    if (SKILL_BY_ID[k] && typeof v === 'number' && v > 0) progress[k] = Math.min(Math.floor(v), SKILL_BY_ID[k].stages.length);
  }
  const day: DayState =
    r.day && typeof r.day.date === 'string'
      ? { date: r.day.date, done: obj(r.day.done, {}), chest: num(r.day.chest, num(r.day.bonus, 0)), total: num(r.day.total, 0) }
      : base.day;
  const settings = obj(r.settings, base.settings);
  const theme: ThemeMode = settings.theme === 'light' || settings.theme === 'system' ? settings.theme : 'dark';
  const state: AppState = {
    version: 2,
    profile: obj(r.profile, null as Profile | null),
    xp: Math.max(0, num(r.xp, 0)),
    progress,
    day,
    history: obj(r.history, {}),
    custom: Array.isArray(r.custom) ? r.custom.filter((c) => c && typeof c.id === 'string' && typeof c.title === 'string') : [],
    warmups: num(r.warmups, 0),
    questsDone: num(r.questsDone, 0),
    chests: num(r.chests, 0),
    bestStreak: num(r.bestStreak, 0),
    log: Array.isArray(r.log) ? r.log.slice(0, LOG_LIMIT) : [],
    seenLevel: num(r.seenLevel, 1),
    badges: obj(r.badges, {}),
    seenBadges: Array.isArray(r.seenBadges) ? r.seenBadges.filter((x) => typeof x === 'string') : [],
    settings: { theme, haptics: settings.haptics !== false },
  };
  const settled = settle(rollover(state, today), Date.now());
  // Saves from v1 had no badges: grant them quietly instead of a burst of celebrations.
  return r.version === 2 ? settled : { ...settled, seenBadges: Object.keys(settled.badges) };
}
