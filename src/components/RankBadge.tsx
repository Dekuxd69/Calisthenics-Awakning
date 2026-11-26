import React from 'react';
import Svg, { Defs, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import type { Rank } from '../lib/xp';

/** Hexagon crest with the rank letter. */
export function RankBadge({ rank, size = 64 }: { rank: Rank; size?: number }) {
  const id = `rank-${rank.id}-${size}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel={`Rank ${rank.id}, ${rank.title}`}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={rank.color} stopOpacity="1" />
          <Stop offset="1" stopColor={rank.color} stopOpacity="0.35" />
        </LinearGradient>
      </Defs>
      <Path d="M50 4 L90 27 L90 73 L50 96 L10 73 L10 27 Z" fill="#0E1222" stroke={`url(#${id})`} strokeWidth={6} strokeLinejoin="round" />
      <Path d="M50 16 L80 33 L80 67 L50 84 L20 67 L20 33 Z" fill={rank.color} fillOpacity={0.14} />
      <SvgText x="50" y="64" fontSize="42" fontWeight="900" fontFamily="sans-serif" fill={rank.color} textAnchor="middle">
        {rank.id}
      </SvgText>
    </Svg>
  );
}
