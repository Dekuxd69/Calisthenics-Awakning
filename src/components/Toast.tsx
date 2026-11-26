import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../theme';

type ToastKind = 'xp' | 'info' | 'error';
interface ToastMsg {
  id: number;
  text: string;
  kind: ToastKind;
}

const Ctx = createContext<(text: string, kind?: ToastKind) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback(
    (text: string, kind: ToastKind = 'info') => {
      if (timer.current) clearTimeout(timer.current);
      setMsg({ id: Date.now(), text, kind });
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
      timer.current = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setMsg(null));
      }, 1800);
    },
    [anim],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const bg = msg?.kind === 'xp' ? colors.primarySoft : msg?.kind === 'error' ? '#3A1820' : colors.surfaceHigh;
  const border = msg?.kind === 'xp' ? colors.primary : msg?.kind === 'error' ? colors.danger : colors.border;

  return (
    <Ctx.Provider value={show}>
      {children}
      {msg ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { justifyContent: 'flex-start', alignItems: 'center', paddingTop: insets.top + 10 }]}>
          <Animated.View
            accessibilityLiveRegion="polite"
            style={[
              styles.toast,
              { backgroundColor: bg, borderColor: border, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] },
            ]}
          >
            <Text style={styles.text}>{msg.text}</Text>
          </Animated.View>
        </View>
      ) : null}
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}

const styles = StyleSheet.create({
  toast: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: radius.pill, borderWidth: 1, maxWidth: '90%' },
  text: { color: colors.text, fontWeight: '700', fontSize: 15, textAlign: 'center' },
});
