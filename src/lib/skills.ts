// Skill tree data and pure progress logic.

export type BranchId = 'push' | 'pull' | 'core';

export interface Branch {
  id: BranchId;
  name: string;
  tagline: string;
  /** The signature skill shown in the branch illustration. */
  signature: string;
  color: string;
}

export const BRANCHES: Branch[] = [
  { id: 'push', name: 'Push', tagline: 'Chest, shoulders, triceps', signature: 'Planche', color: '#F97316' },
  { id: 'pull', name: 'Pull', tagline: 'Back, biceps, grip', signature: 'Front Lever', color: '#38BDF8' },
  { id: 'core', name: 'Core & Legs', tagline: 'Abs, balance, legs', signature: 'Human Flag', color: '#A78BFA' },
];

export interface Stage {
  id: string;
  name: string;
  /** What you must be able to do to tick this stage off. */
  target: string;
}

export interface Skill {
  id: string;
  name: string;
  branch: BranchId;
  /** 1 (beginner) to 5 (elite). Sets the EXP each stage is worth. */
  tier: 1 | 2 | 3 | 4 | 5;
  requires: string[];
  description: string;
  cues: string[];
  stages: Stage[];
}

const s = (id: string, name: string, target: string): Stage => ({ id, name, target });

export const SKILLS: Skill[] = [
  // ---------------- PUSH ----------------
  {
    id: 'incline-pushup', name: 'Incline Push-up', branch: 'push', tier: 1, requires: [],
    description: 'Learn the push-up pattern with less load. Hands on a wall, then a table, then your knees.',
    cues: ['Body in one straight line', 'Elbows about 45° from your body', 'Chest touches the surface'],
    stages: [s('wall', 'Wall push-ups', '3 sets of 15'), s('incline', 'Table incline push-ups', '3 sets of 12'), s('knee', 'Knee push-ups', '3 sets of 12')],
  },
  {
    id: 'pushup', name: 'Push-up', branch: 'push', tier: 2, requires: ['incline-pushup'],
    description: 'The foundation of every pushing skill. Own clean, full range reps.',
    cues: ['Squeeze glutes and abs', 'Lock out at the top', 'Control the way down for 2 seconds'],
    stages: [s('p5', 'Strict push-ups', '3 sets of 5'), s('p10', 'Strict push-ups', '3 sets of 10'), s('p20', 'Strict push-ups', '3 sets of 20')],
  },
  {
    id: 'dips', name: 'Dips', branch: 'push', tier: 2, requires: ['pushup'],
    description: 'Builds the triceps and shoulder strength you need for planche and muscle-ups.',
    cues: ['Shoulders down, away from ears', 'Go until upper arm is parallel', 'Slight forward lean'],
    stages: [s('bench', 'Bench dips', '3 sets of 12'), s('neg', 'Negative dips (5 s down)', '3 sets of 5'), s('full', 'Parallel bar dips', '3 sets of 8')],
  },
  {
    id: 'pike-pushup', name: 'Pike Push-up', branch: 'push', tier: 3, requires: ['pushup'],
    description: 'Vertical pushing for strong shoulders. The road to handstand push-ups.',
    cues: ['Hips high, like an upside-down V', 'Head travels in front of hands', 'Elbows track back'],
    stages: [s('pike', 'Pike push-ups', '3 sets of 8'), s('elevated', 'Feet-elevated pike push-ups', '3 sets of 8')],
  },
  {
    id: 'handstand', name: 'Handstand', branch: 'push', tier: 3, requires: ['pike-pushup'],
    description: 'Balance upside down. Start against the wall, then go free.',
    cues: ['Push the floor away, shoulders by ears', 'Ribs in, body hollow', 'Fingers grip to balance'],
    stages: [s('walk', 'Wall walks', '3 sets of 3'), s('wall30', 'Chest-to-wall hold', '30 seconds'), s('wall60', 'Chest-to-wall hold', '60 seconds'), s('free', 'Freestanding handstand', '10 seconds')],
  },
  {
    id: 'pseudo-planche', name: 'Pseudo Planche Push-up', branch: 'push', tier: 3, requires: ['dips'],
    description: 'Push-ups with hands by your hips and a forward lean. Conditions wrists and straight-arm strength.',
    cues: ['Fingers point to the side or back', 'Shoulders in front of hands', 'Protract at the top'],
    stages: [s('lean', 'Planche lean hold', '3 × 20 seconds'), s('ppp', 'Pseudo planche push-ups', '3 sets of 8')],
  },
  {
    id: 'hspu', name: 'Handstand Push-up', branch: 'push', tier: 4, requires: ['handstand'],
    description: 'Full body weight overhead press. Elite shoulder strength.',
    cues: ['Tripod head position at the bottom', 'Elbows stay over wrists', 'Press up and slightly back'],
    stages: [s('neg', 'Wall HSPU negatives', '3 sets of 3'), s('wall', 'Wall handstand push-ups', '3 sets of 3'), s('wall5', 'Wall handstand push-ups', '3 sets of 5')],
  },
  {
    id: 'tuck-planche', name: 'Tuck Planche', branch: 'push', tier: 5, requires: ['pseudo-planche', 'handstand'],
    description: 'The signature push skill. Hold your body level, balanced on straight arms.',
    cues: ['Arms locked straight', 'Round the upper back hard', 'Lean until hips float'],
    stages: [s('frog', 'Frog stand', '30 seconds'), s('tuck5', 'Tuck planche', '5 seconds'), s('tuck10', 'Tuck planche', '3 × 10 seconds'), s('adv', 'Advanced tuck planche', '5 seconds')],
  },

  // ---------------- PULL ----------------
  {
    id: 'dead-hang', name: 'Dead Hang', branch: 'pull', tier: 1, requires: [],
    description: 'Grip strength and healthy shoulders. Every pull skill starts here.',
    cues: ['Full grip, thumbs around the bar', 'Relax, then gently engage shoulders', 'Breathe slowly'],
    stages: [s('h30', 'Dead hang', '30 seconds'), s('h60', 'Dead hang', '60 seconds'), s('scap', 'Scapular pull-ups', '3 sets of 10')],
  },
  {
    id: 'rows', name: 'Bodyweight Rows', branch: 'pull', tier: 1, requires: [],
    description: 'Horizontal pulling under a table or low bar. Builds the back for pull-ups.',
    cues: ['Body straight like a plank', 'Pull chest to the bar', 'Squeeze shoulder blades'],
    stages: [s('incline', 'Incline rows', '3 sets of 10'), s('australian', 'Australian rows', '3 sets of 12')],
  },
  {
    id: 'pullup', name: 'Pull-up', branch: 'pull', tier: 2, requires: ['dead-hang', 'rows'],
    description: 'The king of upper body pulling. From your first rep to sets of ten.',
    cues: ['Start from a dead hang', 'Drive elbows to your ribs', 'Chin clears the bar'],
    stages: [s('neg', 'Negative pull-ups (5 s down)', '3 sets of 5'), s('first', 'First strict pull-up', '1 rep'), s('p5', 'Strict pull-ups', '3 sets of 5'), s('p10', 'Strict pull-ups', '3 sets of 10')],
  },
  {
    id: 'chest-to-bar', name: 'Explosive Pull-up', branch: 'pull', tier: 3, requires: ['pullup'],
    description: 'Pull high and fast. The power you need for the muscle-up.',
    cues: ['Pull as fast as you can', 'Aim the bar at your lower chest', 'Lean back slightly'],
    stages: [s('c2b', 'Chest-to-bar pull-ups', '3 sets of 5'), s('waist', 'Bar-to-waist pull-ups', '3 sets of 3')],
  },
  {
    id: 'tuck-fl', name: 'Tuck Front Lever', branch: 'pull', tier: 3, requires: ['pullup'],
    description: 'Hang level under the bar with knees tucked. First step to the front lever.',
    cues: ['Straight arms, push the bar down', 'Back parallel to the floor', 'Squeeze knees to chest'],
    stages: [s('t10', 'Tuck front lever', '10 seconds'), s('t20', 'Tuck front lever', '3 × 10 seconds'), s('adv', 'Advanced tuck front lever', '10 seconds')],
  },
  {
    id: 'muscle-up', name: 'Muscle-up', branch: 'pull', tier: 4, requires: ['chest-to-bar', 'dips'],
    description: 'Pull over the bar in one move. The skill that turns heads at the park.',
    cues: ['Kip slightly, then pull explosively', 'Turn wrists over the bar fast', 'Finish with a dip'],
    stages: [s('sbd', 'Straight bar dips', '3 sets of 8'), s('neg', 'Muscle-up negatives', '3 sets of 3'), s('first', 'First muscle-up', '1 rep'), s('m3', 'Muscle-ups', '3 sets of 3')],
  },
  {
    id: 'front-lever', name: 'Front Lever', branch: 'pull', tier: 5, requires: ['tuck-fl'],
    description: 'The signature pull skill. Your whole body held level under the bar.',
    cues: ['Arms straight, lats on fire', 'Hips in line with shoulders', 'Point the toes'],
    stages: [s('onel', 'One-leg front lever', '5 seconds'), s('straddle', 'Straddle front lever', '5 seconds'), s('full', 'Full front lever', '3 seconds')],
  },

  // ---------------- CORE & LEGS ----------------
  {
    id: 'plank', name: 'Plank & Hollow Body', branch: 'core', tier: 1, requires: [],
    description: 'The body tension every calisthenics skill depends on.',
    cues: ['Lower back pressed to the floor (hollow)', 'Squeeze glutes', 'Do not hold your breath'],
    stages: [s('plank', 'Forearm plank', '60 seconds'), s('h30', 'Hollow body hold', '30 seconds'), s('h60', 'Hollow body hold', '60 seconds')],
  },
  {
    id: 'squat', name: 'Squat & Lunge', branch: 'core', tier: 1, requires: [],
    description: 'Strong legs and mobile hips. Do not skip leg day.',
    cues: ['Knees follow your toes', 'Chest up, heels down', 'Hips below knees on squats'],
    stages: [s('air', 'Air squats', '3 sets of 20'), s('lunge', 'Walking lunges', '3 × 10 each leg'), s('bss', 'Bulgarian split squats', '3 × 8 each leg')],
  },
  {
    id: 'leg-raise', name: 'Hanging Leg Raise', branch: 'core', tier: 2, requires: ['plank'],
    description: 'Strong abs and hip flexors for L-sits and levers.',
    cues: ['No swinging', 'Tilt the pelvis up at the top', 'Lower slowly'],
    stages: [s('knee', 'Hanging knee raises', '3 sets of 10'), s('leg', 'Hanging leg raises', '3 sets of 8'), s('t2b', 'Toes-to-bar', '3 sets of 5')],
  },
  {
    id: 'pistol', name: 'Pistol Squat', branch: 'core', tier: 3, requires: ['squat'],
    description: 'A full single-leg squat. Strength, balance and mobility in one move.',
    cues: ['Reach arms forward for balance', 'Keep the heel down', 'Free leg straight and high'],
    stages: [s('assist', 'Assisted pistol (hold a pole)', '3 × 5 each leg'), s('box', 'Box pistol', '3 × 5 each leg'), s('full', 'Full pistol squat', '3 × 3 each leg')],
  },
  {
    id: 'l-sit', name: 'L-sit', branch: 'core', tier: 3, requires: ['leg-raise'],
    description: 'Hold your legs straight out in front with only your hands on the floor or bars.',
    cues: ['Push shoulders down hard', 'Lock the knees', 'Point your toes'],
    stages: [s('tuck', 'Tuck L-sit', '15 seconds'), s('one', 'One-leg L-sit', '10 seconds each'), s('full', 'Full L-sit', '10 seconds'), s('full20', 'Full L-sit', '20 seconds')],
  },
  {
    id: 'dragon-flag', name: 'Dragon Flag', branch: 'core', tier: 4, requires: ['l-sit'],
    description: 'A full body lever on a bench. Brutal core control.',
    cues: ['Only shoulders touch the bench', 'Body stays one straight line', 'Lower slowly'],
    stages: [s('tuck', 'Tuck dragon flag negatives', '3 sets of 5'), s('neg', 'Dragon flag negatives', '3 sets of 3'), s('full', 'Dragon flags', '3 sets of 3')],
  },
  {
    id: 'human-flag', name: 'Human Flag', branch: 'core', tier: 5, requires: ['dragon-flag', 'pullup'],
    description: 'The signature core skill. Hold your body sideways off a pole.',
    cues: ['Top arm pulls, bottom arm pushes', 'Stack your hips', 'Squeeze obliques hard'],
    stages: [s('vertical', 'Vertical flag', '10 seconds'), s('tuck', 'Tuck flag', '5 seconds'), s('straddle', 'Straddle flag', '5 seconds'), s('full', 'Full human flag', '3 seconds')],
  },
];

export const SKILL_BY_ID: Record<string, Skill> = Object.fromEntries(SKILLS.map((k) => [k.id, k]));

const TIER_XP: Record<Skill['tier'], number> = { 1: 20, 2: 35, 3: 50, 4: 80, 5: 120 };

export function stageXp(skill: Skill): number {
  return TIER_XP[skill.tier];
}

/** Bonus EXP for mastering every stage of a skill. */
export function masteryBonus(skill: Skill): number {
  return TIER_XP[skill.tier] * 2;
}

/** How many stages of each skill are done, by skill id. Stages are always done in order. */
export type SkillProgress = Record<string, number>;

export function stagesDone(progress: SkillProgress, skillId: string): number {
  const skill = SKILL_BY_ID[skillId];
  if (!skill) return 0;
  return Math.max(0, Math.min(skill.stages.length, progress[skillId] ?? 0));
}

export function isMastered(progress: SkillProgress, skillId: string): boolean {
  const skill = SKILL_BY_ID[skillId];
  return !!skill && stagesDone(progress, skillId) >= skill.stages.length;
}

export function isUnlocked(progress: SkillProgress, skillId: string): boolean {
  const skill = SKILL_BY_ID[skillId];
  if (!skill) return false;
  return skill.requires.every((r) => isMastered(progress, r));
}

export type SkillStatus = 'locked' | 'available' | 'in-progress' | 'mastered';

export function skillStatus(progress: SkillProgress, skillId: string): SkillStatus {
  if (isMastered(progress, skillId)) return 'mastered';
  if (!isUnlocked(progress, skillId)) return 'locked';
  return stagesDone(progress, skillId) > 0 ? 'in-progress' : 'available';
}

/** Skills that list `skillId` as a requirement. */
export function dependents(skillId: string): Skill[] {
  return SKILLS.filter((k) => k.requires.includes(skillId));
}

export type StageCheck = { ok: true; xp: number; mastered: boolean } | { ok: false; reason: string };

/** Can the next stage of this skill be ticked off, and what is it worth? */
export function canCompleteNextStage(progress: SkillProgress, skillId: string): StageCheck {
  const skill = SKILL_BY_ID[skillId];
  if (!skill) return { ok: false, reason: 'Unknown skill.' };
  if (!isUnlocked(progress, skillId)) return { ok: false, reason: 'Master the required skills first.' };
  const done = stagesDone(progress, skillId);
  if (done >= skill.stages.length) return { ok: false, reason: 'Already mastered.' };
  const mastered = done + 1 === skill.stages.length;
  return { ok: true, xp: stageXp(skill) + (mastered ? masteryBonus(skill) : 0), mastered };
}

/**
 * Can the last ticked stage be unticked? Not allowed when it would un-master a skill
 * that other skills you have already started depend on.
 */
export function canUndoLastStage(progress: SkillProgress, skillId: string): StageCheck {
  const skill = SKILL_BY_ID[skillId];
  if (!skill) return { ok: false, reason: 'Unknown skill.' };
  const done = stagesDone(progress, skillId);
  if (done === 0) return { ok: false, reason: 'Nothing to undo.' };
  const wasMastered = done === skill.stages.length;
  if (wasMastered) {
    const blocking = dependents(skillId).filter((d) => stagesDone(progress, d.id) > 0);
    if (blocking.length > 0) {
      return { ok: false, reason: `You already started ${blocking.map((b) => b.name).join(', ')}, which needs this skill.` };
    }
  }
  return { ok: true, xp: stageXp(skill) + (wasMastered ? masteryBonus(skill) : 0), mastered: false };
}

export function branchSkills(branch: BranchId): Skill[] {
  return SKILLS.filter((k) => k.branch === branch);
}

export function branchProgress(progress: SkillProgress, branch: BranchId): { done: number; total: number } {
  const list = branchSkills(branch);
  return { done: list.filter((k) => isMastered(progress, k.id)).length, total: list.length };
}

/** Depth of a skill in the tree (0 for skills with no requirements). Used to lay out tiers. */
export function skillDepth(skillId: string, seen: Set<string> = new Set()): number {
  const skill = SKILL_BY_ID[skillId];
  if (!skill || skill.requires.length === 0 || seen.has(skillId)) return 0;
  seen.add(skillId);
  const sameBranch = skill.requires.filter((r) => SKILL_BY_ID[r]?.branch === skill.branch);
  if (sameBranch.length === 0) return 0;
  return 1 + Math.max(...sameBranch.map((r) => skillDepth(r, new Set(seen))));
}
