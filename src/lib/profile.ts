export type Sex = 'male' | 'female';
export type Goal = 'lose' | 'maintain' | 'gain';
export type Activity = 'low' | 'moderate' | 'high';
export type DietType = 'nonveg' | 'veg' | 'vegan';

export interface Profile {
  name: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  activity: Activity;
  diet: DietType;
}

export const LIMITS = {
  age: { min: 13, max: 80 },
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 30, max: 250 },
} as const;

export const GOAL_LABEL: Record<Goal, string> = { lose: 'Lose fat', maintain: 'Stay lean & strong', gain: 'Build muscle' };
export const ACTIVITY_LABEL: Record<Activity, string> = {
  low: 'Mostly sitting',
  moderate: 'On my feet some of the day',
  high: 'Very active job or sport',
};
export const DIET_LABEL: Record<DietType, string> = { nonveg: 'Eat everything', veg: 'Vegetarian', vegan: 'Vegan' };

/** Returns an error message per invalid field. An empty object means the input is valid. */
export function validateProfile(p: {
  name: string;
  age: string;
  heightCm: string;
  weightKg: string;
}): Partial<Record<'name' | 'age' | 'heightCm' | 'weightKg', string>> {
  const errors: Partial<Record<'name' | 'age' | 'heightCm' | 'weightKg', string>> = {};
  if (!p.name.trim()) errors.name = 'Tell us what to call you.';
  const check = (key: 'age' | 'heightCm' | 'weightKg', label: string, unit: string) => {
    const raw = p[key].trim().replace(',', '.');
    const n = Number(raw);
    const { min, max } = LIMITS[key];
    if (!raw || !Number.isFinite(n)) errors[key] = `Enter your ${label}.`;
    else if (n < min || n > max) errors[key] = `${label[0].toUpperCase()}${label.slice(1)} must be between ${min} and ${max}${unit}.`;
  };
  check('age', 'age', '');
  check('heightCm', 'height', ' cm');
  check('weightKg', 'weight', ' kg');
  return errors;
}

export function parseNumber(raw: string): number {
  return Number(raw.trim().replace(',', '.'));
}
