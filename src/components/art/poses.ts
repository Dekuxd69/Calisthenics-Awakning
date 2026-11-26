// Athlete poses for pictograms, in a 100 × 100 box (y grows downward).
// Limbs are [joint, joint, joint]: arms are shoulder → elbow → hand, legs are hip → knee → ankle.
// The first arm and leg are the near side, drawn on top; the second are the far side, drawn faded.

export type P = [number, number];

export type Prop =
  | { kind: 'floor'; y: number }
  | { kind: 'bar'; y: number; x1: number; x2: number }
  | { kind: 'dipbars'; y: number }
  | { kind: 'box'; x: number; y: number; w: number; h: number }
  | { kind: 'pole'; x: number }
  | { kind: 'parallettes'; x: number; y: number }
  | { kind: 'bench'; y: number; x1: number; x2: number }
  | { kind: 'wall'; x: number };

export interface Pose {
  head: P;
  shoulder: P;
  hip: P;
  arms: [P, P, P][];
  legs: [P, P, P][];
  props: Prop[];
}

const pose = (p: Pose) => p;

export const POSES = {
  wallPushup: pose({
    head: [36, 30], shoulder: [42, 38], hip: [54, 62],
    arms: [[[44, 38], [32, 40], [22, 36]], [[40, 38], [30, 42], [22, 40]]],
    legs: [[[54, 62], [60, 74], [66, 86]], [[54, 62], [62, 74], [70, 86]]],
    props: [{ kind: 'wall', x: 20 }, { kind: 'floor', y: 88 }],
  }),
  pushup: pose({
    head: [18, 48], shoulder: [28, 52], hip: [58, 60],
    arms: [[[30, 54], [30, 64], [30, 74]], [[26, 54], [25, 64], [24, 74]]],
    legs: [[[58, 60], [73, 67], [88, 74]], [[58, 62], [72, 68], [86, 74]]],
    props: [{ kind: 'floor', y: 76 }],
  }),
  dips: pose({
    head: [50, 18], shoulder: [50, 30], hip: [50, 58],
    arms: [[[54, 32], [60, 42], [62, 52]], [[46, 32], [40, 42], [38, 52]]],
    legs: [[[51, 58], [52, 72], [62, 80]], [[49, 58], [48, 72], [58, 82]]],
    props: [{ kind: 'dipbars', y: 52 }],
  }),
  pike: pose({
    head: [30, 64], shoulder: [36, 56], hip: [54, 30],
    arms: [[[37, 58], [33, 68], [30, 78]], [[35, 58], [30, 68], [26, 78]]],
    legs: [[[55, 31], [66, 54], [76, 78]], [[53, 31], [62, 54], [70, 78]]],
    props: [{ kind: 'floor', y: 80 }],
  }),
  handstand: pose({
    head: [50, 72], shoulder: [50, 62], hip: [50, 36],
    arms: [[[53, 63], [55, 73], [56, 84]], [[47, 63], [45, 73], [44, 84]]],
    legs: [[[51, 36], [52, 24], [53, 12]], [[49, 36], [48, 24], [47, 12]]],
    props: [{ kind: 'floor', y: 86 }],
  }),
  hspu: pose({
    head: [50, 80], shoulder: [50, 68], hip: [50, 42],
    arms: [[[53, 69], [62, 76], [57, 86]], [[47, 69], [38, 76], [43, 86]]],
    legs: [[[51, 42], [52, 29], [53, 16]], [[49, 42], [48, 29], [47, 16]]],
    props: [{ kind: 'floor', y: 88 }, { kind: 'wall', x: 66 }],
  }),
  planche: pose({
    head: [14, 52], shoulder: [26, 56], hip: [56, 56],
    arms: [[[28, 58], [32, 66], [36, 74]], [[24, 58], [28, 66], [31, 74]]],
    legs: [[[56, 55], [72, 55], [90, 54]], [[56, 58], [72, 58], [89, 58]]],
    props: [{ kind: 'parallettes', x: 34, y: 74 }],
  }),
  tuckPlanche: pose({
    head: [22, 54], shoulder: [32, 58], hip: [58, 56],
    arms: [[[34, 60], [38, 68], [42, 76]], [[30, 60], [34, 68], [37, 76]]],
    legs: [[[57, 56], [46, 64], [62, 70]], [[59, 58], [48, 66], [64, 72]]],
    props: [{ kind: 'floor', y: 78 }],
  }),
  pseudoPlanche: pose({
    head: [16, 50], shoulder: [26, 54], hip: [58, 60],
    arms: [[[28, 56], [33, 65], [38, 74]], [[24, 56], [29, 65], [33, 74]]],
    legs: [[[58, 60], [73, 67], [88, 74]], [[58, 62], [72, 68], [86, 74]]],
    props: [{ kind: 'floor', y: 76 }],
  }),
  hang: pose({
    head: [50, 24], shoulder: [50, 33], hip: [50, 60],
    arms: [[[54, 33], [56, 24], [58, 14]], [[46, 33], [44, 24], [42, 14]]],
    legs: [[[51, 60], [52, 73], [53, 86]], [[49, 60], [48, 73], [47, 86]]],
    props: [{ kind: 'bar', y: 13, x1: 22, x2: 78 }],
  }),
  rows: pose({
    head: [22, 50], shoulder: [32, 52], hip: [60, 62],
    arms: [[[33, 50], [36, 42], [34, 34]], [[31, 50], [33, 42], [31, 34]]],
    legs: [[[60, 62], [74, 68], [88, 74]], [[60, 64], [73, 70], [86, 75]]],
    props: [{ kind: 'bar', y: 33, x1: 16, x2: 48 }, { kind: 'floor', y: 77 }],
  }),
  pullup: pose({
    head: [50, 14], shoulder: [50, 26], hip: [50, 54],
    arms: [[[55, 27], [64, 22], [60, 12]], [[45, 27], [36, 22], [40, 12]]],
    legs: [[[51, 54], [51, 68], [60, 78]], [[49, 54], [48, 68], [56, 80]]],
    props: [{ kind: 'bar', y: 11, x1: 22, x2: 78 }],
  }),
  tuckLever: pose({
    head: [30, 46], shoulder: [40, 44], hip: [64, 44],
    arms: [[[41, 42], [45, 28], [50, 14]], [[39, 42], [43, 28], [47, 14]]],
    legs: [[[63, 43], [54, 32], [68, 30]], [[65, 45], [56, 34], [70, 32]]],
    props: [{ kind: 'bar', y: 13, x1: 22, x2: 78 }],
  }),
  frontLever: pose({
    head: [20, 46], shoulder: [32, 44], hip: [60, 44],
    arms: [[[34, 42], [42, 28], [50, 14]], [[31, 42], [39, 28], [47, 14]]],
    legs: [[[60, 43], [76, 43], [92, 42]], [[60, 46], [76, 46], [91, 47]]],
    props: [{ kind: 'bar', y: 13, x1: 22, x2: 78 }],
  }),
  muscleUp: pose({
    head: [50, 18], shoulder: [50, 30], hip: [50, 58],
    arms: [[[54, 31], [57, 41], [58, 52]], [[46, 31], [43, 41], [42, 52]]],
    legs: [[[51, 58], [52, 72], [54, 86]], [[49, 58], [48, 72], [46, 86]]],
    props: [{ kind: 'bar', y: 52, x1: 22, x2: 78 }],
  }),
  plank: pose({
    head: [16, 60], shoulder: [26, 62], hip: [58, 64],
    arms: [[[27, 64], [27, 74], [40, 75]], [[25, 64], [24, 74], [36, 75]]],
    legs: [[[58, 64], [74, 69], [90, 74]], [[58, 66], [73, 70], [88, 75]]],
    props: [{ kind: 'floor', y: 77 }],
  }),
  squat: pose({
    head: [46, 26], shoulder: [44, 38], hip: [38, 62],
    arms: [[[46, 40], [58, 44], [72, 44]], [[42, 40], [54, 46], [68, 46]]],
    legs: [[[39, 62], [60, 66], [50, 84]], [[37, 63], [56, 68], [46, 85]]],
    props: [{ kind: 'floor', y: 87 }],
  }),
  pistol: pose({
    head: [44, 26], shoulder: [42, 38], hip: [36, 62],
    arms: [[[44, 40], [58, 42], [72, 42]], [[40, 40], [54, 44], [68, 44]]],
    legs: [[[38, 62], [62, 60], [86, 56]], [[35, 63], [54, 68], [44, 85]]],
    props: [{ kind: 'floor', y: 87 }],
  }),
  legRaise: pose({
    head: [40, 24], shoulder: [40, 33], hip: [40, 58],
    arms: [[[44, 33], [47, 24], [50, 14]], [[36, 33], [33, 24], [30, 14]]],
    legs: [[[41, 58], [60, 57], [80, 55]], [[39, 60], [58, 60], [78, 60]]],
    props: [{ kind: 'bar', y: 13, x1: 16, x2: 70 }],
  }),
  lsit: pose({
    head: [40, 28], shoulder: [40, 40], hip: [42, 64],
    arms: [[[42, 42], [42, 54], [42, 66]], [[38, 42], [37, 54], [36, 66]]],
    legs: [[[42, 64], [62, 64], [84, 63]], [[42, 66], [62, 66], [83, 67]]],
    props: [{ kind: 'parallettes', x: 39, y: 66 }],
  }),
  dragonFlag: pose({
    head: [19, 73], shoulder: [28, 66], hip: [48, 46],
    arms: [[[27, 64], [17, 60], [9, 70]], [[29, 64], [19, 58], [11, 68]]],
    legs: [[[48, 46], [60, 34], [72, 22]], [[49, 48], [61, 36], [74, 25]]],
    props: [{ kind: 'bench', y: 74, x1: 6, x2: 52 }],
  }),
  humanFlag: pose({
    head: [21, 41], shoulder: [32, 42], hip: [60, 44],
    arms: [[[32, 40], [24, 34], [16, 28]], [[32, 46], [24, 52], [16, 58]]],
    legs: [[[60, 43], [76, 42], [92, 41]], [[60, 46], [76, 47], [91, 49]]],
    props: [{ kind: 'pole', x: 14 }],
  }),
  hollow: pose({
    head: [28, 58], shoulder: [36, 64], hip: [58, 70],
    arms: [[[36, 62], [24, 56], [12, 50]], [[34, 64], [22, 60], [10, 56]]],
    legs: [[[58, 70], [74, 64], [90, 58]], [[58, 71], [74, 66], [89, 61]]],
    props: [{ kind: 'floor', y: 78 }],
  }),
} satisfies Record<string, Pose>;

export type PoseId = keyof typeof POSES;

/** Which pose to draw for each skill. */
export const SKILL_POSE: Record<string, PoseId> = {
  'incline-pushup': 'wallPushup',
  pushup: 'pushup',
  dips: 'dips',
  'pike-pushup': 'pike',
  handstand: 'handstand',
  'pseudo-planche': 'pseudoPlanche',
  hspu: 'hspu',
  'tuck-planche': 'tuckPlanche',
  'dead-hang': 'hang',
  rows: 'rows',
  pullup: 'pullup',
  'chest-to-bar': 'pullup',
  'tuck-fl': 'tuckLever',
  'muscle-up': 'muscleUp',
  'front-lever': 'frontLever',
  plank: 'hollow',
  squat: 'squat',
  'leg-raise': 'legRaise',
  pistol: 'pistol',
  'l-sit': 'lsit',
  'dragon-flag': 'dragonFlag',
  'human-flag': 'humanFlag',
};

export const BRANCH_POSE: Record<string, PoseId> = { push: 'planche', pull: 'frontLever', core: 'humanFlag' };
