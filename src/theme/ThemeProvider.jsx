import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildColors, PALETTES, THEME_MODES } from './themes';

const STORAGE_KEY = '@photoviewer_theme_v1';
const ThemeContext = createContext(null);

/**
 * 테마 모드(system/light/dark) + 팔레트를 관리하고 AsyncStorage에 저장합니다.
 * system 모드에서는 기기의 라이트/다크 설정을 따라갑니다.
 */
export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState('system');
  const [palette, setPaletteState] = useState('zinc');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (!json) return;
        const saved = JSON.parse(json);
        if (THEME_MODES.includes(saved.mode)) setModeState(saved.mode);
        if (PALETTES[saved.palette]) setPaletteState(saved.palette);
      })
      .catch(() => { });
  }, []);

  const persist = useCallback((next) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => { });
  }, []);

  const setMode = useCallback((m) => {
    setModeState(m);
    persist({ mode: m, palette });
  }, [palette, persist]);

  const setPalette = useCallback((p) => {
    setPaletteState(p);
    persist({ mode, palette: p });
  }, [mode, persist]);

  const isDark = mode === 'system' ? systemScheme !== 'light' : mode === 'dark';
  const colors = useMemo(() => buildColors(palette, isDark), [palette, isDark]);

  const value = useMemo(
    () => ({ colors, isDark, mode, palette, setMode, setPalette }),
    [colors, isDark, mode, palette, setMode, setPalette]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
