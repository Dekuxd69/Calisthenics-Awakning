import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AppState as RNAppState } from 'react-native';
import { dateKey, generateGoals, type DailyGoal } from './lib/goals';
import { initialState, reducer, sanitize, STORAGE_KEY, type Action, type AppState } from './lib/state';
import { levelFromXp, rankForLevel, type LevelInfo, type Rank } from './lib/xp';

interface Store {
  state: AppState;
  dispatch: (a: Action) => void;
  ready: boolean;
  today: string;
  goals: DailyGoal[];
  level: LevelInfo;
  rank: Rank;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(dateKey(new Date())));
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState(() => dateKey(new Date()));
  const hydrated = useRef(false);

  // Load saved progress once.
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!alive) return;
        if (raw) {
          try {
            dispatch({ type: 'hydrate', state: sanitize(JSON.parse(raw), dateKey(new Date())) });
          } catch {
            // Corrupt save: start fresh rather than crash.
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!alive) return;
        hydrated.current = true;
        setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Save after every change (only once loaded, so we never overwrite a save with the empty state).
  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  // New day: when the app comes back to the foreground, and once a minute while open.
  useEffect(() => {
    const check = () => {
      const k = dateKey(new Date());
      setToday((prev) => (prev === k ? prev : k));
    };
    const sub = RNAppState.addEventListener('change', (s) => s === 'active' && check());
    const id = setInterval(check, 60_000);
    return () => {
      sub.remove();
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (ready && state.day.date !== today) dispatch({ type: 'rollover', today });
  }, [ready, today, state.day.date]);

  const level = useMemo(() => levelFromXp(state.xp), [state.xp]);
  const goals = useMemo(
    () => generateGoals({ date: new Date(), profile: state.profile, level: level.level, progress: state.progress, custom: state.custom }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today, state.profile, level.level, state.progress, state.custom],
  );

  const value = useMemo<Store>(
    () => ({ state, dispatch, ready, today, goals, level, rank: rankForLevel(level.level) }),
    [state, ready, today, goals, level],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}

export function useNewId() {
  return useCallback(() => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`, []);
}
