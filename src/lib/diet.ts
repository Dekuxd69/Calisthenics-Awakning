import type { DietType, Profile } from './profile';

export interface DietPlan {
  bmi: number;
  bmiLabel: string;
  bmr: number;
  tdee: number;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  waterL: number;
  meals: MealSlot[];
  notes: string[];
}

export interface MealSlot {
  id: string;
  name: string;
  time: string;
  calories: number;
  proteinG: number;
  options: string[][];
}

const ACTIVITY_FACTOR = { low: 1.375, moderate: 1.55, high: 1.725 } as const;

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiLabel(value: number): string {
  if (value < 18.5) return 'Underweight';
  if (value < 25) return 'Healthy';
  if (value < 30) return 'Overweight';
  return 'Obese';
}

/** Mifflin-St Jeor resting energy. */
export function bmr(p: Pick<Profile, 'sex' | 'weightKg' | 'heightCm' | 'age'>): number {
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161);
}

const round = (n: number, step = 1) => Math.round(n / step) * step;

export function buildDietPlan(p: Profile): DietPlan {
  const b = bmr(p);
  const tdee = b * ACTIVITY_FACTOR[p.activity];
  const floor = p.sex === 'male' ? 1500 : 1200;
  let calories = tdee;
  if (p.goal === 'lose') calories = Math.max(tdee - 450, floor, b);
  if (p.goal === 'gain') calories = tdee + 300;
  calories = round(calories, 10);

  const bmiValue = bmi(p.weightKg, p.heightCm);
  // For high body fat, base protein on the weight at a BMI of 25 so the target stays realistic.
  const proteinWeight = bmiValue > 30 ? 25 * (p.heightCm / 100) ** 2 : p.weightKg;
  const perKg = p.goal === 'lose' ? 2.0 : p.goal === 'gain' ? 1.8 : 1.6;
  const proteinG = round(proteinWeight * perKg);
  const fatG = round((calories * 0.25) / 9);
  const carbsG = Math.max(0, round((calories - proteinG * 4 - fatG * 9) / 4));
  const waterL = Math.round(((p.weightKg * 35 + 500) / 1000) * 10) / 10;

  const split = [
    { id: 'breakfast', name: 'Breakfast', time: '7–9 AM', share: 0.25 },
    { id: 'lunch', name: 'Lunch', time: '12–2 PM', share: 0.35 },
    { id: 'snack', name: 'Post-workout snack', time: 'After training', share: 0.15 },
    { id: 'dinner', name: 'Dinner', time: '7–9 PM', share: 0.25 },
  ];
  const meals: MealSlot[] = split.map((m) => ({
    id: m.id,
    name: m.name,
    time: m.time,
    calories: round(calories * m.share, 10),
    proteinG: round(proteinG * m.share),
    options: MEAL_IDEAS[p.diet][m.id as keyof MealIdeas],
  }));

  const notes: string[] = [];
  if (p.goal === 'lose') notes.push('A gentle 450 kcal deficit keeps your strength up while you lose fat.');
  if (p.goal === 'gain') notes.push('A small 300 kcal surplus builds muscle without much fat gain.');
  if (p.goal === 'maintain') notes.push('Eating at maintenance lets you recomp: get stronger while staying lean.');
  if (p.age < 18) notes.push('You are under 18. Eat to fuel growth, never under-eat, and check with a parent or doctor before changing your diet a lot.');
  if (bmiValue < 18.5) notes.push('Your BMI is under 18.5. Focus on eating enough before trying to lose weight.');
  notes.push('Weigh yourself weekly. If your weight is not moving the way you want after 2 weeks, adjust by about 150 kcal.');

  return {
    bmi: Math.round(bmiValue * 10) / 10,
    bmiLabel: bmiLabel(bmiValue),
    bmr: round(b, 10),
    tdee: round(tdee, 10),
    calories,
    proteinG,
    fatG,
    carbsG,
    waterL,
    meals,
    notes,
  };
}

type MealIdeas = Record<'breakfast' | 'lunch' | 'snack' | 'dinner', string[][]>;

const MEAL_IDEAS: Record<DietType, MealIdeas> = {
  nonveg: {
    breakfast: [
      ['3 eggs, scrambled', '2 slices whole-grain toast', '1 banana'],
      ['Oats (60 g) cooked in milk', '1 scoop whey or 150 g Greek yogurt', 'Handful of berries'],
    ],
    lunch: [
      ['Grilled chicken breast (150 g)', 'Rice or 2 rotis', 'Big mixed salad with olive oil'],
      ['Tuna or salmon (130 g)', 'Potatoes or quinoa', 'Steamed vegetables'],
    ],
    snack: [
      ['Greek yogurt (200 g)', 'Honey and a few nuts'],
      ['Protein shake with milk', '1 banana'],
    ],
    dinner: [
      ['Lean beef or chicken curry (150 g)', 'Rice or rotis', 'Sautéed greens'],
      ['Omelette (3 eggs) with veggies', 'Whole-grain wrap', 'Side salad'],
    ],
  },
  veg: {
    breakfast: [
      ['Paneer bhurji (100 g)', '2 whole-grain rotis or toast', '1 fruit'],
      ['Oats (60 g) in milk', 'Greek yogurt (150 g)', 'Peanut butter (1 tbsp)'],
    ],
    lunch: [
      ['Dal (1 bowl) + rajma or chole', 'Rice or 2 rotis', 'Curd and salad'],
      ['Paneer or tofu stir-fry (120 g)', 'Quinoa or rice', 'Vegetables'],
    ],
    snack: [
      ['Greek yogurt or curd (200 g)', 'Roasted chana (30 g)'],
      ['Milk or whey shake', '1 banana'],
    ],
    dinner: [
      ['Egg-free soya chunk curry (50 g dry)', 'Rotis', 'Mixed veg'],
      ['Moong dal chilla (3)', 'Paneer filling', 'Mint chutney and salad'],
    ],
  },
  vegan: {
    breakfast: [
      ['Tofu scramble (150 g)', 'Whole-grain toast', '1 fruit'],
      ['Oats (60 g) in soy milk', 'Pea protein scoop', 'Chia seeds and berries'],
    ],
    lunch: [
      ['Lentil or chickpea curry (1.5 bowls)', 'Rice or rotis', 'Big salad'],
      ['Tempeh or tofu bowl (150 g)', 'Quinoa', 'Roasted vegetables and tahini'],
    ],
    snack: [
      ['Soy yogurt (200 g)', 'Mixed nuts (20 g)'],
      ['Pea protein shake in soy milk', '1 banana'],
    ],
    dinner: [
      ['Soya chunk stir-fry (50 g dry)', 'Noodles or rice', 'Greens'],
      ['Black bean tacos (2–3)', 'Guacamole', 'Corn and salsa'],
    ],
  },
};
