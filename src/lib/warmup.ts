export interface WarmupMove {
  id: string;
  name: string;
  seconds: number;
  cue: string;
  /** Which body area the move prepares. */
  area: string;
}

export const WARMUP: WarmupMove[] = [
  { id: 'jacks', name: 'Jumping Jacks', seconds: 45, area: 'Full body', cue: 'Light and bouncy. Get your heart rate up.' },
  { id: 'arm-circles', name: 'Arm Circles', seconds: 30, area: 'Shoulders', cue: '15 s forward, 15 s backward. Make big circles.' },
  { id: 'wrists', name: 'Wrist Rolls & Stretch', seconds: 40, area: 'Wrists', cue: 'Roll both ways, then lean gently over your palms on the floor.' },
  { id: 'cat-cow', name: 'Cat–Cow', seconds: 40, area: 'Spine', cue: 'On hands and knees. Round your back, then arch it. Move with your breath.' },
  { id: 'scap-pushups', name: 'Scapular Push-ups', seconds: 40, area: 'Shoulder blades', cue: 'Arms straight. Squeeze shoulder blades together, then push them apart.' },
  { id: 'hip-circles', name: 'Hip Circles', seconds: 30, area: 'Hips', cue: 'Hands on hips, slow big circles both ways.' },
  { id: 'squat-hold', name: 'Deep Squat Hold', seconds: 40, area: 'Legs & ankles', cue: 'Sit low, heels down, push your knees out with your elbows.' },
  { id: 'inchworms', name: 'Inchworms', seconds: 45, area: 'Hamstrings & core', cue: 'Walk your hands out to a plank, then walk back. Keep legs straight.' },
];

export const WARMUP_TOTAL_SECONDS = WARMUP.reduce((t, m) => t + m.seconds, 0);

export function formatSeconds(total: number): string {
  const s = Math.max(0, Math.round(total));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}
