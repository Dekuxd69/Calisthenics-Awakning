import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ff, useTheme } from '../theme';

/** Initial in a circle with a dashed ring. The lit dashes show level progress. */
export function Avatar({ name, size = 64, progress = 1 }: { name: string; size?: number; progress?: number }) {
  const { c } = useTheme();
  const dashes = 24;
  const lit = Math.round(Math.max(0, Math.min(1, progress)) * dashes);
  const r = size / 2 - 3;
  const circ = 2 * Math.PI * r;
  const seg = circ / dashes;
  const initial = (name.trim()[0] ?? 'A').toUpperCase();
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {Array.from({ length: dashes }, (_, i) => (
          <Circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={i < lit ? c.primary : c.muted}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={`${seg * 0.45} ${circ}`}
            strokeDashoffset={-seg * i}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ))}
      </Svg>
      <View style={{ width: size - 16, height: size - 16, borderRadius: size, backgroundColor: c.surfaceHigh, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
        <Text style={{ color: c.primaryText, fontFamily: ff.bold, fontSize: size * 0.38 }}>{initial}</Text>
      </View>
    </View>
  );
}
