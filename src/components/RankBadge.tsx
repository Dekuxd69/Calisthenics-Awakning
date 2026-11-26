import React from 'react';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import type { Rank } from '../lib/xp';
import { ff, LIME, useTheme } from '../theme';

/** Rounded hexagon crest with the rank letter. Lime when it is the current or a reached rank. */
export function RankBadge({ rank, size = 64, dim }: { rank: Rank; size?: number; dim?: boolean }) {
  const { c } = useTheme();
  const fill = dim ? c.surfaceHigh : LIME;
  const ink = dim ? c.textFaint : '#0A0A0A';
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel={`Rank ${rank.id}, ${rank.title}`}>
      <Path d="M50 6 Q54 6 58 8.4 L84 23.4 Q91 27.4 91 35.4 L91 64.6 Q91 72.6 84 76.6 L58 91.6 Q50 96 42 91.6 L16 76.6 Q9 72.6 9 64.6 L9 35.4 Q9 27.4 16 23.4 L42 8.4 Q46 6 50 6 Z" fill={fill} />
      <Path d="M50 18 L80 35 L80 65 L50 82 L20 65 L20 35 Z" fill="none" stroke={ink} strokeOpacity={0.18} strokeWidth={3} strokeLinejoin="round" />
      <SvgText x="50" y="65" fontSize="44" fontFamily={ff.bold} fontWeight="700" fill={ink} textAnchor="middle">
        {rank.id}
      </SvgText>
    </Svg>
  );
}
