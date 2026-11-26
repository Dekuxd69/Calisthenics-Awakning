import React from 'react';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { BranchId } from '../../lib/skills';

type P = [number, number];

interface Pose {
  head: P;
  shoulder: P;
  hip: P;
  /** [shoulder, elbow, hand] — first is the near arm, second the far arm. */
  arms: [P, P, P][];
  /** [hip, knee, ankle] — first is the near leg, second the far leg. */
  legs: [P, P, P][];
}

/** A tapered limb segment: a quad between two circles. */
function capsule(a: P, b: P, ra: number, rb: number): string {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const pt = (p: P, r: number, sgn: number) => `${(p[0] + nx * r * sgn).toFixed(1)} ${(p[1] + ny * r * sgn).toFixed(1)}`;
  return `M${pt(a, ra, 1)} L${pt(b, rb, 1)} A${rb} ${rb} 0 0 0 ${pt(b, rb, -1)} L${pt(a, ra, -1)} A${ra} ${ra} 0 0 0 ${pt(a, ra, 1)} Z`;
}

const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** A stylised athlete built from tapered segments, with a soft aura behind. */
function Figure({ pose, id, skin, top, glow }: { pose: Pose; id: string; skin: string; top: string; glow: string }) {
  const parts = (limbSkin: string, shade: number, arm: [P, P, P] | undefined, leg: [P, P, P] | undefined) => (
    <G opacity={shade}>
      {leg ? (
        <>
          <Path d={capsule(leg[0], leg[1], 8.5, 6.5)} fill={limbSkin} />
          <Path d={capsule(leg[1], leg[2], 6.5, 4.2)} fill={limbSkin} />
          <Path d={capsule(leg[2], lerp(leg[1], leg[2], 1.16), 4.2, 2.6)} fill="#E2E8F0" />
        </>
      ) : null}
      {arm ? (
        <>
          <Path d={capsule(arm[0], arm[1], 6, 4.6)} fill={limbSkin} />
          <Path d={capsule(arm[1], arm[2], 4.6, 3.6)} fill={limbSkin} />
          <Circle cx={arm[2][0]} cy={arm[2][1]} r={4.4} fill={limbSkin} />
        </>
      ) : null}
    </G>
  );
  const nearLeg = pose.legs[0];
  const shortsEnd = lerp(nearLeg[0], nearLeg[1], 0.45);
  const shortsStart = lerp(pose.hip, pose.shoulder, 0.18);
  const neck = lerp(pose.shoulder, pose.head, 0.45);
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}-skin`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor={skin} />
        </LinearGradient>
        <LinearGradient id={`${id}-top`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={top} />
          <Stop offset="1" stopColor={glow} />
        </LinearGradient>
      </Defs>
      {/* Aura */}
      <G opacity={0.18}>
        <Path d={capsule(pose.shoulder, pose.hip, 24, 22)} fill={glow} />
        {[...pose.arms, ...pose.legs].map((l, i) => (
          <Path key={i} d={`${capsule(l[0], l[1], 14, 13)} ${capsule(l[1], l[2], 13, 11)}`} fill={glow} />
        ))}
        <Circle cx={pose.head[0]} cy={pose.head[1]} r={20} fill={glow} />
      </G>
      {/* Far limbs, darker for depth */}
      {parts(skin, 0.55, pose.arms[1], pose.legs[1])}
      {/* Near leg, then shorts over the hip */}
      {parts(`url(#${id}-skin)`, 1, undefined, nearLeg)}
      {/* Neck and head */}
      <Path d={capsule(pose.shoulder, neck, 5, 4.5)} fill={`url(#${id}-skin)`} />
      <Circle cx={pose.head[0]} cy={pose.head[1]} r={10.5} fill={`url(#${id}-skin)`} />
      {/* Torso: tank top tapering to the waist */}
      <Path d={capsule(pose.shoulder, pose.hip, 11.5, 9)} fill={`url(#${id}-top)`} />
      <Path d={capsule(lerp(pose.shoulder, pose.hip, 0.1), lerp(pose.shoulder, pose.hip, 0.55), 3, 2)} fill="#FFFFFF" opacity={0.25} />
      {/* Shorts */}
      <Path d={capsule(shortsStart, shortsEnd, 10.5, 9.5)} fill="#1E2540" />
      <Path d={capsule(lerp(shortsStart, shortsEnd, 0.15), lerp(shortsStart, shortsEnd, 0.9), 2, 2)} fill={glow} opacity={0.9} />
      {/* Near arm on top */}
      {parts(`url(#${id}-skin)`, 1, pose.arms[0], undefined)}
      <Circle cx={pose.head[0] - 3} cy={pose.head[1] - 3} r={3.2} fill="#FFFFFF" opacity={0.5} />
    </G>
  );
}

function Backdrop({ id, color }: { id: string; color: string }) {
  return (
    <>
      <Defs>
        <RadialGradient id={`${id}-glow`} cx="50%" cy="55%" r="55%">
          <Stop offset="0" stopColor={color} stopOpacity="0.45" />
          <Stop offset="0.6" stopColor={color} stopOpacity="0.08" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#141A31" />
          <Stop offset="1" stopColor="#0B0F1E" />
        </LinearGradient>
      </Defs>
      <Rect x="-200" y="0" width="720" height="200" fill={`url(#${id}-bg)`} />
      <Circle cx="160" cy="110" r="120" fill={`url(#${id}-glow)`} />
      {/* Concentric rings, like an aura */}
      <Circle cx="160" cy="110" r="74" stroke={color} strokeOpacity={0.18} strokeWidth={1.5} fill="none" />
      <Circle cx="160" cy="110" r="98" stroke={color} strokeOpacity={0.1} strokeWidth={1.5} fill="none" strokeDasharray="4 8" />
      {/* Sparkles */}
      {[
        [40, 40, 2.5], [276, 34, 2], [292, 150, 2.5], [30, 150, 2], [70, 86, 1.5], [250, 70, 1.5], [200, 30, 1.8],
      ].map(([x, y, r], i) => (
        <Circle key={i} cx={x} cy={y} r={r} fill="#ffffff" opacity={0.55} />
      ))}
      <Path d="M276 26 L278 34 L286 36 L278 38 L276 46 L274 38 L266 36 L274 34 Z" fill={color} opacity={0.7} />
      <Path d="M44 128 L45.5 133 L50.5 134.5 L45.5 136 L44 141 L42.5 136 L37.5 134.5 L42.5 133 Z" fill={color} opacity={0.6} />
    </>
  );
}

function Planche() {
  const id = 'planche';
  const pose: Pose = {
    head: [100, 110],
    shoulder: [124, 117],
    hip: [196, 115],
    arms: [
      [[127, 119], [137, 141], [147, 160]],
      [[121, 119], [130, 141], [139, 160]],
    ],
    legs: [
      [[196, 114], [240, 112], [280, 110]],
      [[196, 118], [240, 118], [279, 118]],
    ],
  };
  return (
    <>
      <Backdrop id={id} color="#F97316" />
      <Ellipse cx="190" cy="176" rx="110" ry="7" fill="#000" opacity={0.35} />
      {/* Parallettes */}
      <Rect x="126" y="162" width="36" height="6" rx="3" fill="#E2E8F0" opacity={0.85} />
      <Line x1="130" y1="168" x2="128" y2="176" stroke="#94A3B8" strokeWidth={4} strokeLinecap="round" />
      <Line x1="158" y1="168" x2="160" y2="176" stroke="#94A3B8" strokeWidth={4} strokeLinecap="round" />
      {/* Speed lines */}
      <Line x1="292" y1="98" x2="306" y2="98" stroke="#FDBA74" strokeWidth={3} strokeLinecap="round" opacity={0.6} />
      <Line x1="296" y1="124" x2="312" y2="124" stroke="#FDBA74" strokeWidth={3} strokeLinecap="round" opacity={0.45} />
      <Figure pose={pose} id={id} skin="#FDBA74" top="#FB923C" glow="#EA580C" />
    </>
  );
}

function FrontLever() {
  const id = 'lever';
  const pose: Pose = {
    head: [104, 107],
    shoulder: [128, 105],
    hip: [200, 106],
    arms: [
      [[131, 102], [142, 74], [153, 47]],
      [[125, 102], [136, 74], [146, 47]],
    ],
    legs: [
      [[200, 104], [243, 103], [283, 102]],
      [[200, 108], [243, 109], [282, 110]],
    ],
  };
  return (
    <>
      <Backdrop id={id} color="#38BDF8" />
      {/* Bar and posts */}
      <Line x1="60" y1="44" x2="250" y2="44" stroke="#E2E8F0" strokeWidth={6} strokeLinecap="round" />
      <Line x1="66" y1="44" x2="66" y2="186" stroke="#475569" strokeWidth={6} strokeLinecap="round" />
      <Line x1="244" y1="44" x2="244" y2="186" stroke="#475569" strokeWidth={6} strokeLinecap="round" />
      <Ellipse cx="170" cy="184" rx="100" ry="6" fill="#000" opacity={0.35} />
      <Line x1="96" y1="128" x2="290" y2="128" stroke="#7DD3FC" strokeWidth={2} strokeDasharray="2 10" strokeLinecap="round" opacity={0.6} />
      <Figure pose={pose} id={id} skin="#7DD3FC" top="#38BDF8" glow="#0284C7" />
    </>
  );
}

function HumanFlag() {
  const id = 'flag';
  const pose: Pose = {
    head: [104, 90],
    shoulder: [122, 90],
    hip: [192, 92],
    arms: [
      [[122, 85], [108, 70], [95, 55]],
      [[122, 96], [108, 113], [95, 130]],
    ],
    legs: [
      [[192, 89], [236, 87], [276, 85]],
      [[192, 95], [236, 97], [275, 99]],
    ],
  };
  return (
    <>
      <Backdrop id={id} color="#A78BFA" />
      <Ellipse cx="150" cy="186" rx="100" ry="6" fill="#000" opacity={0.35} />
      {/* Pole */}
      <Rect x="86" y="18" width="10" height="170" rx="5" fill="#CBD5E1" />
      <Rect x="86" y="18" width="4" height="170" rx="2" fill="#ffffff" opacity={0.5} />
      <Path d="M292 70 Q300 86 292 104" stroke="#C4B5FD" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.6} />
      <Path d="M302 62 Q314 86 302 112" stroke="#C4B5FD" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.35} />
      <Figure pose={pose} id={id} skin="#C4B5FD" top="#A78BFA" glow="#7C3AED" />
    </>
  );
}

export function SkillIllustration({ branch, height = 180 }: { branch: BranchId; height?: number }) {
  return (
    <Svg width="100%" height={height} viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice">
      {branch === 'push' ? <Planche /> : branch === 'pull' ? <FrontLever /> : <HumanFlag />}
    </Svg>
  );
}
