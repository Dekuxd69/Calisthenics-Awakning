// Achievement badges. Each one is a pure check on the app state.
import { BRANCHES, isMastered, SKILLS } from './skills';
import { levelFromXp, rankForLevel } from './xp';

export interface BadgeInput {
  xp: number;
  progress: Record<string, number>;
  warmups: number;
  questsDone: number;
  chests: number;
  bestStreak: number;
}

export interface Badge {
  id: string;
  name: string;
  hint: string;
  /** Ionicons glyph name. */
  icon: string;
  color: string;
  check: (s: BadgeInput) => boolean;
}

const mastered = (s: BadgeInput) => SKILLS.filter((k) => isMastered(s.progress, k.id)).length;
const branchDone = (s: BadgeInput, b: string) => SKILLS.filter((k) => k.branch === b).every((k) => isMastered(s.progress, k.id));
const rankAtLeast = (s: BadgeInput, ids: string[]) => ids.includes(rankForLevel(levelFromXp(s.xp).level).id);

export const BADGES: Badge[] = [
  { id: 'first-quest', name: 'First Step', hint: 'Finish a quest', icon: 'footsteps', color: '#34D399', check: (s) => s.questsDone >= 1 },
  { id: 'warm-1', name: 'Warmed Up', hint: 'Do a warm-up', icon: 'flame', color: '#F97316', check: (s) => s.warmups >= 1 },
  { id: 'warm-10', name: 'Ritual', hint: '10 warm-ups', icon: 'bonfire', color: '#F97316', check: (s) => s.warmups >= 10 },
  { id: 'chest-1', name: 'Treasure', hint: 'Open a daily chest', icon: 'gift', color: '#FBBF24', check: (s) => s.chests >= 1 },
  { id: 'streak-3', name: 'On Fire', hint: '3 day streak', icon: 'flash', color: '#FBBF24', check: (s) => s.bestStreak >= 3 },
  { id: 'streak-7', name: 'Week Warrior', hint: '7 day streak', icon: 'calendar', color: '#FBBF24', check: (s) => s.bestStreak >= 7 },
  { id: 'streak-30', name: 'Unbreakable', hint: '30 day streak', icon: 'diamond', color: '#22D3EE', check: (s) => s.bestStreak >= 30 },
  { id: 'master-1', name: 'Skilled', hint: 'Master a skill', icon: 'ribbon', color: '#A78BFA', check: (s) => mastered(s) >= 1 },
  { id: 'master-5', name: 'Technician', hint: 'Master 5 skills', icon: 'medal', color: '#A78BFA', check: (s) => mastered(s) >= 5 },
  ...BRANCHES.map((b) => ({
    id: `branch-${b.id}`,
    name: `${b.name} Master`,
    hint: `Master all ${b.name} skills`,
    icon: 'trophy',
    color: b.color,
    check: (s: BadgeInput) => branchDone(s, b.id),
  })),
  { id: 'level-5', name: 'Rising', hint: 'Reach level 5', icon: 'trending-up', color: '#38BDF8', check: (s) => levelFromXp(s.xp).level >= 5 },
  { id: 'rank-c', name: 'Adept', hint: 'Reach C-Rank', icon: 'shield-half', color: '#38BDF8', check: (s) => rankAtLeast(s, ['C', 'B', 'A', 'S']) },
  { id: 'rank-a', name: 'Ascendant', hint: 'Reach A-Rank', icon: 'shield', color: '#F472B6', check: (s) => rankAtLeast(s, ['A', 'S']) },
];

export const BADGE_BY_ID: Record<string, Badge> = Object.fromEntries(BADGES.map((b) => [b.id, b]));
