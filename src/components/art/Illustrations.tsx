// Chunky "3D" illustrations drawn in SVG (lime on black, like the references).
// To use your own PNG art instead, drop the file in assets/illustrations/ and add it to CUSTOM, for example
//   trophy: require('../../../assets/illustrations/trophy.png'),
import React, { useId } from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { POSES, type PoseId } from './poses';
import { Body, FarLimbs, Props } from './LayeredArt';

export type IllustrationName = 'trophy' | 'chest' | 'chestOpen' | 'flame' | 'coin';

const CUSTOM: Partial<Record<IllustrationName, ImageSourcePropType>> = {};

const L1 = '#E4FF7A';
const L2 = '#C6F432';
const L3 = '#86AE0E';
const L4 = '#4E6A00';

function useGid() {
  return `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
}

function Lime({ id }: { id: string }) {
  return (
    <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <Stop offset="0" stopColor={L1} />
      <Stop offset="0.45" stopColor={L2} />
      <Stop offset="1" stopColor={L3} />
    </LinearGradient>
  );
}

function Trophy({ id }: { id: string }) {
  return (
    <>
      <Defs>
        <Lime id={`${id}a`} />
        <LinearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3A3A3A" />
          <Stop offset="1" stopColor="#151515" />
        </LinearGradient>
      </Defs>
      <Ellipse cx={50} cy={92} rx={30} ry={5} fill="#000" opacity={0.35} />
      {/* handles */}
      <Path d="M27 26 C10 26 10 50 30 52" stroke={L3} strokeWidth={7} fill="none" strokeLinecap="round" />
      <Path d="M73 26 C90 26 90 50 70 52" stroke={L3} strokeWidth={7} fill="none" strokeLinecap="round" />
      {/* cup */}
      <Path d="M24 16 H76 V34 C76 52 64 62 50 62 C36 62 24 52 24 34 Z" fill={`url(#${id}a)`} />
      <Ellipse cx={50} cy={16} rx={26} ry={5} fill={L1} />
      <Ellipse cx={50} cy={16.5} rx={21} ry={3.2} fill={L4} opacity={0.55} />
      <Path d="M32 24 C32 42 38 52 46 56" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={4} fill="none" strokeLinecap="round" />
      {/* stem and base */}
      <Path d="M44 60 H56 L58 72 H42 Z" fill={L3} />
      <Rect x={30} y={72} width={40} height={16} rx={4} fill={`url(#${id}b)`} />
      <Rect x={30} y={72} width={40} height={4} rx={2} fill="#4A4A4A" />
      <Rect x={40} y={78} width={20} height={5} rx={2} fill={L2} opacity={0.9} />
      {/* star */}
      <Path d="M50 26 L53 33 L60.5 33.6 L54.8 38.4 L56.6 45.8 L50 41.8 L43.4 45.8 L45.2 38.4 L39.5 33.6 L47 33 Z" fill={L4} opacity={0.75} />
    </>
  );
}

function Chest({ id, open }: { id: string; open: boolean }) {
  return (
    <>
      <Defs>
        <Lime id={`${id}a`} />
        <LinearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFF6B0" stopOpacity={0.95} />
          <Stop offset="1" stopColor={L2} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Ellipse cx={50} cy={90} rx={36} ry={5} fill="#000" opacity={0.35} />
      {open ? <Path d="M22 50 L8 6 H92 L78 50 Z" fill={`url(#${id}g)`} /> : null}
      {/* body */}
      <Rect x={14} y={48} width={72} height={40} rx={7} fill={`url(#${id}a)`} />
      <Rect x={14} y={48} width={72} height={8} rx={4} fill={L3} />
      <Rect x={24} y={48} width={8} height={40} fill="#1A1A1A" />
      <Rect x={68} y={48} width={8} height={40} fill="#1A1A1A" />
      {open ? (
        <>
          {/* lid tipped back */}
          <Path d="M16 46 L24 18 H76 L84 46 Z" fill={L3} />
          <Path d="M24 18 H76 L72 26 H28 Z" fill={L4} />
          <Circle cx={40} cy={42} r={6} fill={L1} />
          <Circle cx={54} cy={40} r={7} fill={L2} stroke={L4} strokeWidth={1.5} />
          <Circle cx={64} cy={44} r={5} fill={L1} />
        </>
      ) : (
        <>
          <Path d="M14 50 V36 C14 22 26 16 50 16 C74 16 86 22 86 36 V50 Z" fill={`url(#${id}a)`} />
          <Path d="M24 50 V24 C24 21 28 18 32 17.5 V50 Z" fill="#1A1A1A" />
          <Path d="M68 17.5 C72 18 76 21 76 24 V50 H68 Z" fill="#1A1A1A" />
          <Path d="M22 30 C30 22 42 20 48 20" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={3.5} strokeLinecap="round" fill="none" />
        </>
      )}
      {/* lock */}
      <Rect x={42} y={46} width={16} height={16} rx={4} fill="#1A1A1A" />
      <Circle cx={50} cy={53} r={3} fill={L2} />
    </>
  );
}

function Flame({ id }: { id: string }) {
  return (
    <>
      <Defs>
        <LinearGradient id={`${id}a`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE36B" />
          <Stop offset="0.6" stopColor="#FF9F1C" />
          <Stop offset="1" stopColor="#FF5A1F" />
        </LinearGradient>
        <LinearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFBE0" />
          <Stop offset="1" stopColor="#FFD23F" />
        </LinearGradient>
      </Defs>
      <Ellipse cx={50} cy={92} rx={22} ry={4} fill="#000" opacity={0.35} />
      <Path d="M50 6 C58 22 76 32 76 58 C76 76 64 90 50 90 C36 90 24 76 24 58 C24 44 32 38 36 28 C40 36 42 40 46 42 C46 30 46 18 50 6 Z" fill={`url(#${id}a)`} />
      <Path d="M50 44 C56 54 64 58 64 70 C64 80 58 86 50 86 C42 86 36 80 36 70 C36 62 42 58 44 52 C46 56 48 58 50 58 Z" fill={`url(#${id}b)`} />
      <Path d="M34 50 C32 58 32 66 36 74" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    </>
  );
}

function Coin({ id }: { id: string }) {
  return (
    <>
      <Defs>
        <RadialGradient id={`${id}a`} cx="35%" cy="30%" r="75%">
          <Stop offset="0" stopColor={L1} />
          <Stop offset="0.6" stopColor={L2} />
          <Stop offset="1" stopColor={L3} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={50} cy={92} rx={26} ry={4} fill="#000" opacity={0.35} />
      <Circle cx={50} cy={50} r={38} fill={L4} />
      <Circle cx={48} cy={47} r={36} fill={`url(#${id}a)`} />
      <Circle cx={48} cy={47} r={27} fill="none" stroke={L3} strokeWidth={3} />
      <Path d="M52 26 L36 51 H48 L44 68 L61 42 H49 Z" fill="#141414" />
      <Path d="M24 38 C27 30 33 24 40 21" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={4} strokeLinecap="round" fill="none" />
    </>
  );
}

/** A big decorative illustration. Uses a custom PNG when one is registered in CUSTOM. */
export function Illustration({ name, size }: { name: IllustrationName; size: number }) {
  const id = useGid();
  const custom = CUSTOM[name];
  if (custom) return <Image source={custom} style={{ width: size, height: size }} resizeMode="contain" accessibilityIgnoresInvertColors />;
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {name === 'trophy' ? <Trophy id={id} /> : name === 'flame' ? <Flame id={id} /> : name === 'coin' ? <Coin id={id} /> : <Chest id={id} open={name === 'chestOpen'} />}
      </Svg>
    </View>
  );
}

/** Flat, static exercise pictogram in a single SVG. Cheap to draw many of. */
export function Pictogram({ pose: poseId, size, color, faint }: { pose: PoseId; size: number; color: string; faint?: string }) {
  const pose = POSES[poseId];
  const back = faint ?? color;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G opacity={0.55}>
        <Props props={pose.props} color={back} />
      </G>
      <G opacity={0.5}>
        <FarLimbs pose={pose} color={back} />
      </G>
      <Body pose={pose} color={color} />
    </Svg>
  );
}
