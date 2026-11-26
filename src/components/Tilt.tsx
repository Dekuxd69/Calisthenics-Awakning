import { Accelerometer } from 'expo-sensors';
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';

/** Device tilt in the range -1..1 on both axes, smoothed. Drives parallax layers. */
const Ctx = createContext<Animated.ValueXY | null>(null);

export function TiltProvider({ children }: { children: React.ReactNode }) {
  const tilt = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    let drift: Animated.CompositeAnimation | null = null;
    let cancelled = false;
    const startDrift = () => {
      // No sensor (web, simulator): a slow figure-eight drift keeps the layers alive.
      drift = Animated.loop(
        Animated.sequence([
          Animated.timing(tilt, { toValue: { x: 0.6, y: -0.3 }, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
          Animated.timing(tilt, { toValue: { x: -0.6, y: 0.3 }, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        ]),
      );
      drift.start();
    };
    if (Platform.OS === 'web') {
      startDrift();
    } else {
      Accelerometer.isAvailableAsync()
        .then((ok) => {
          if (cancelled) return;
          if (!ok) return startDrift();
          Accelerometer.setUpdateInterval(60);
          let sx = 0;
          let sy = 0;
          sub = Accelerometer.addListener(({ x, y }) => {
            // Low-pass filter, then clamp. y is offset because people hold phones tilted towards them.
            sx = sx * 0.8 + x * 0.2;
            sy = sy * 0.8 + (y + 0.5) * 0.2;
            tilt.setValue({ x: Math.max(-1, Math.min(1, sx * 2)), y: Math.max(-1, Math.min(1, sy * 2)) });
          });
        })
        .catch(() => !cancelled && startDrift());
    }
    return () => {
      cancelled = true;
      sub?.remove();
      drift?.stop();
    };
  }, [tilt]);

  return <Ctx.Provider value={tilt}>{children}</Ctx.Provider>;
}

const ZERO = new Animated.ValueXY({ x: 0, y: 0 });

export function useTilt(): Animated.ValueXY {
  return useContext(Ctx) ?? ZERO;
}

/** Transform for a parallax layer: depth > 0 moves with the tilt, < 0 against it. */
export function parallax(tilt: Animated.ValueXY, depth: number) {
  return [
    { translateX: tilt.x.interpolate({ inputRange: [-1, 1], outputRange: [-depth, depth] }) },
    { translateY: tilt.y.interpolate({ inputRange: [-1, 1], outputRange: [-depth, depth] }) },
  ];
}
