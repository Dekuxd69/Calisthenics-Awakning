// EXP, levels and ranks. Pure functions, no React Native imports, so they can be unit tested.

/** Total EXP needed to reach `level` (level 1 starts at 0 EXP). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  const n = level - 1;
  // Each level costs 50 EXP more than the last: 50, 100, 150, ...
  return 25 * n * (n + 1);
}

export interface LevelInfo {
  level: number;
  /** EXP earned inside the current level. */
  current: number;
  /** EXP the current level needs in total. */
  needed: number;
  /** 0..1 progress through the current level. */
  progress: number;
}

export function levelFromXp(totalXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const needed = next - base;
  const current = xp - base;
  return { level, current, needed, progress: needed === 0 ? 0 : current / needed };
}

export interface Rank {
  id: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  title: string;
  minLevel: number;
  color: string;
  blurb: string;
}

export const RANKS: Rank[] = [
  { id: 'E', title: 'Awakened', minLevel: 1, color: '#9AA4BF', blurb: 'You have started. Build the habit and learn clean form.' },
  { id: 'D', title: 'Initiate', minLevel: 4, color: '#4ADE80', blurb: 'Foundations are forming. Push-ups, rows and hangs feel solid.' },
  { id: 'C', title: 'Adept', minLevel: 8, color: '#38BDF8', blurb: 'Real strength. Pull-ups and dips are part of your routine.' },
  { id: 'B', title: 'Vanguard', minLevel: 13, color: '#A78BFA', blurb: 'Advanced basics mastered. First static holds are in reach.' },
  { id: 'A', title: 'Ascendant', minLevel: 19, color: '#F472B6', blurb: 'Skills like the muscle-up and L-sit are yours.' },
  { id: 'S', title: 'Monarch', minLevel: 26, color: '#FBBF24', blurb: 'Elite control. Levers, flags and planche progressions.' },
];

export function rankForLevel(level: number): Rank {
  let rank = RANKS[0];
  for (const r of RANKS) if (level >= r.minLevel) rank = r;
  return rank;
}

export function nextRank(level: number): Rank | null {
  return RANKS.find((r) => r.minLevel > level) ?? null;
}
