import React, { useId } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { parallax, useTilt } from '../Tilt';
import { POSES, type P, type Pose, type PoseId, type Prop } from './poses';

function capsule(a: P, b: P, ra: number, rb: number): string {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const pt = (p: P, r: number, sgn: number) => `${(p[0] + nx * r * sgn).toFixed(2)} ${(p[1] + ny * r * sgn).toFixed(2)}`;
  return `M${pt(a, ra, 1)} L${pt(b, rb, 1)} A${rb} ${rb} 0 0 0 ${pt(b, rb, -1)} L${pt(a, ra, -1)} A${ra} ${ra} 0 0 0 ${pt(a, ra, 1)} Z`;
}

const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function limbPath(l: [P, P, P], leg: boolean): string {
  const [a, b, c] = l;
  if (leg) return `${capsule(a, b, 5.2, 3.9)} ${capsule(b, c, 3.9, 2.8)} ${capsule(c, lerp(b, c, 1.14), 2.8, 1.8)}`;
  return `${capsule(a, b, 3.6, 2.9)} ${capsule(b, c, 2.9, 2.3)}`;
}

/** Far-side limbs only. */
export function FarLimbs({ pose, color }: { pose: Pose; color: string }) {
  return (
    <G>
      {pose.legs[1] ? <Path d={limbPath(pose.legs[1], true)} fill={color} /> : null}
      {pose.arms[1] ? <Path d={limbPath(pose.arms[1], false)} fill={color} /> : null}
    </G>
  );
}

/** Head, torso and near limbs as one silhouette. */
export function Body({ pose, color }: { pose: Pose; color: string }) {
  const neck = lerp(pose.shoulder, pose.head, 0.5);
  const d = [
    limbPath(pose.legs[0], true),
    capsule(pose.shoulder, pose.hip, 6.8, 5.4),
    capsule(pose.shoulder, neck, 2.8, 2.6),
    limbPath(pose.arms[0], false),
  ].join(' ');
  return (
    <G>
      <Path d={d} fill={color} />
      <Circle cx={pose.head[0]} cy={pose.head[1]} r={6.4} fill={color} />
    </G>
  );
}

export function Props({ props, color }: { props: Prop[]; color: string }) {
  return (
    <G>
      {props.map((p, i) => {
        switch (p.kind) {
          case 'floor':
            return <Line key={i} x1={6} y1={p.y} x2={94} y2={p.y} stroke={color} strokeWidth={2.4} strokeLinecap="round" />;
          case 'bar':
            return (
              <G key={i}>
                <Line x1={p.x1} y1={p.y} x2={p.x2} y2={p.y} stroke={color} strokeWidth={3} strokeLinecap="round" />
              </G>
            );
          case 'dipbars':
            return (
              <G key={i}>
                <Line x1={30} y1={p.y} x2={70} y2={p.y} stroke={color} strokeWidth={3} strokeLinecap="round" />
                <Line x1={32} y1={p.y} x2={32} y2={92} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
                <Line x1={68} y1={p.y} x2={68} y2={92} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
              </G>
            );
          case 'box':
            return <Rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx={2} fill={color} />;
          case 'pole':
            return <Line key={i} x1={p.x} y1={4} x2={p.x} y2={96} stroke={color} strokeWidth={3.6} strokeLinecap="round" />;
          case 'parallettes':
            return (
              <G key={i}>
                <Line x1={p.x - 9} y1={p.y} x2={p.x + 9} y2={p.y} stroke={color} strokeWidth={3} strokeLinecap="round" />
                <Line x1={p.x - 7} y1={p.y} x2={p.x - 9} y2={p.y + 8} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
                <Line x1={p.x + 7} y1={p.y} x2={p.x + 9} y2={p.y + 8} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
              </G>
            );
          case 'bench':
            return (
              <G key={i}>
                <Line x1={p.x1} y1={p.y} x2={p.x2} y2={p.y} stroke={color} strokeWidth={4} strokeLinecap="round" />
                <Line x1={p.x1 + 6} y1={p.y} x2={p.x1 + 6} y2={p.y + 14} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
                <Line x1={p.x2 - 6} y1={p.y} x2={p.x2 - 6} y2={p.y + 14} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
              </G>
            );
          case 'wall':
            return <Line key={i} x1={p.x} y1={6} x2={p.x} y2={94} stroke={color} strokeWidth={3} strokeLinecap="round" />;
          default:
            return null;
        }
      })}
    </G>
  );
}

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amount > 0 ? (255 - v) * amount : v * amount))));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export type ArtState = 'locked' | 'open' | 'done';

interface Props {
  pose: PoseId;
  color: string;
  size: number;
  /** locked = grey and dim, open = dark disc with coloured figure, done = solid colour disc. */
  state?: ArtState;
  /** Parallax strength in px at full tilt; 0 turns parallax off. */
  depth?: number;
  sparkles?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Extra tilt source (for example the tree pan), added on top of device tilt. */
  tilt?: Animated.ValueXY;
  surface?: string;
}

/**
 * A round illustration built from stacked layers (halo, disc, equipment, far limbs, body, sparkles).
 * Each layer shifts a different amount when the phone tilts, which gives the parallax depth.
 */
export function LayeredArt({ pose: poseId, color, size, state = 'done', depth = 6, sparkles = false, style, tilt: extra, surface = '#10141F' }: Props) {
  const rawId = useId();
  const id = `a${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const deviceTilt = useTilt();
  const tilt = extra ?? deviceTilt;
  const pose = POSES[poseId];
  const locked = state === 'locked';
  const base = locked ? '#5B6378' : color;
  const disc = state === 'done' ? base : surface;
  const figure = state === 'done' ? '#FFFFFF' : locked ? '#7B8399' : shade(color, 0.25);
  const far = state === 'done' ? 'rgba(255,255,255,0.55)' : locked ? 'rgba(123,131,153,0.5)' : shade(color, -0.25);
  const propColor = state === 'done' ? 'rgba(255,255,255,0.6)' : locked ? 'rgba(123,131,153,0.55)' : shade(color, -0.1);

  const layer = (d: number, children: React.ReactNode, key: string, viewBox = '0 0 100 100') => (
    <Animated.View key={key} pointerEvents="none" style={{ position: 'absolute', width: size, height: size, transform: depth ? parallax(tilt, d * depth) : [] }}>
      <Svg width={size} height={size} viewBox={viewBox}>
        {children}
      </Svg>
    </Animated.View>
  );

  // Figure sits in the middle of the disc.
  const inner = (children: React.ReactNode) => <G transform="translate(13 13) scale(0.74)">{children}</G>;

  return (
    <View style={[{ width: size, height: size }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {layer(
        -0.5,
        <>
          <Defs>
            <RadialGradient id={`${id}h`} cx="50%" cy="50%" r="50%">
              <Stop offset="0.55" stopColor={base} stopOpacity={locked ? 0 : 0.35} />
              <Stop offset="1" stopColor={base} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={50} cy={50} r={50} fill={`url(#${id}h)`} />
        </>,
        'halo',
      )}
      {layer(
        0,
        <>
          <Defs>
            <LinearGradient id={`${id}d`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={state === 'done' ? shade(base, 0.2) : disc} />
              <Stop offset="1" stopColor={state === 'done' ? shade(base, -0.25) : disc} />
            </LinearGradient>
          </Defs>
          <Circle cx={50} cy={50} r={40} fill={`url(#${id}d)`} stroke={state === 'open' ? base : 'none'} strokeWidth={2.5} strokeOpacity={0.9} />
          <Circle cx={50} cy={50} r={34} fill="none" stroke={state === 'done' ? '#FFFFFF' : base} strokeOpacity={0.14} strokeWidth={1.2} />
        </>,
        'disc',
      )}
      {layer(0.35, inner(<Props props={pose.props} color={propColor} />), 'props')}
      {layer(0.7, inner(<FarLimbs pose={pose} color={far} />), 'far')}
      {layer(1, inner(<Body pose={pose} color={figure} />), 'body')}
      {sparkles && !locked
        ? layer(
            1.8,
            <G>
              <Path d="M84 14 L85.6 19.4 L91 21 L85.6 22.6 L84 28 L82.4 22.6 L77 21 L82.4 19.4 Z" fill={shade(base, 0.4)} />
              <Circle cx={14} cy={78} r={2} fill={shade(base, 0.4)} />
              <Circle cx={88} cy={74} r={1.4} fill="#FFFFFF" opacity={0.7} />
              <Circle cx={18} cy={22} r={1.4} fill="#FFFFFF" opacity={0.7} />
            </G>,
            'spark',
          )
        : null}
    </View>
  );
}
