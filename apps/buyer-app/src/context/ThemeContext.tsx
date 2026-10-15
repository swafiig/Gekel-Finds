import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useNativeWindScheme } from 'nativewind';

export type ThemePref = 'light' | 'dark' | 'system';
const KEY = 'gekel.theme';

interface Ctx {
  pref: ThemePref;
  /** The scheme actually in effect right now ('system' resolves to the phone's setting). */
  scheme: 'light' | 'dark';
  setPref: (p: ThemePref) => void;
}

const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme, setColorScheme } = useNativeWindScheme();
  const [pref, setPrefState] = useState<ThemePref>('system');

  // Load the saved preference once, then tell NativeWind about it so every `dark:` class responds.
  useEffect(() => {
    (async () => {
      const saved = (await AsyncStorage.getItem(KEY)) as ThemePref | null;
      const p = saved ?? 'system';
      setPrefState(p);
      setColorScheme(p);
    })();
  }, [setColorScheme]);

  const setPref = (p: ThemePref) => {
    setPrefState(p);
    setColorScheme(p);
    void AsyncStorage.setItem(KEY, p);
  };

  const scheme: 'light' | 'dark' = colorScheme === 'dark' ? 'dark' : 'light';

  const value = useMemo(() => ({ pref, scheme, setPref }), [pref, scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const c = useContext(ThemeContext);
  if (!c) throw new Error('useTheme must be used inside <ThemeProvider>');
  return c;
};

/** For the few places that need a raw hex instead of a className (e.g. icon `color` props, StatusBar). */
export function useThemeColors() {
  const { scheme } = useTheme();
  return scheme === 'dark'
    ? { bg: '#1C1714', surface: '#262019', text: '#F2EDE6', textSoft: '#C7BDB2', textMute: '#8A8077', line: '#3A322B', icon: '#F2EDE6', iconMute: '#8A8077' }
    : { bg: '#F9F7F3', surface: '#FFFFFF', text: '#1C1917', textSoft: '#57534E', textMute: '#A8A29E', line: '#E7E2DA', icon: '#1C1917', iconMute: '#57534E' };
}

/** Fallback for any screen rendered before ThemeProvider mounts (should not normally happen). */
export const systemScheme = () => (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
