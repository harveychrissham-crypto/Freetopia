import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'freetopia.appearance';

const DEFAULTS = {
  theme: 'dark',
  accent: 'blue',
  textSize: 'default',
  density: 'comfortable',
  animations: 'on',
};

const ACCENTS = {
  blue: '#4B78A8',
  purple: '#7C3AED',
  green: '#22C55E',
  orange: '#F59E0B',
  pink: '#D946EF',
};

const DARK = { bg:'#060B12', panel:'#0A121C', panel2:'#0E1824', line:'#182533', text:'#E9EEF4', muted:'#7F8D9D', nav:'#050A11' };
const LIGHT = { bg:'#F4F7FA', panel:'#FFFFFF', panel2:'#E9EFF5', line:'#D6E0EA', text:'#17212B', muted:'#5D6B79', nav:'#FFFFFF' };

const AppearanceContext = createContext(null);

export function AppearanceProvider({ children }) {
  const [appearance, setAppearance] = useState(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try { setAppearance((current) => ({ ...current, ...JSON.parse(raw) })); } catch {}
    });
  }, []);

  const updateAppearance = (patch) => {
    const next = { ...appearance, ...patch };
    setAppearance(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const value = useMemo(() => {
    const isLight = appearance.theme === 'light';
    const colors = isLight ? LIGHT : DARK;
    const accent = ACCENTS[appearance.accent] || ACCENTS.blue;
    return {
      appearance, updateAppearance, isLight, accent,
      colors: { ...colors, accent },
      textScale: { small:0.9, default:1, large:1.1, xl:1.2 }[appearance.textSize] || 1,
      densityScale: { compact:0.9, comfortable:1, spacious:1.1 }[appearance.density] || 1,
      reduceMotion: appearance.animations !== 'on',
    };
  }, [appearance]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error('useAppearance must be used inside AppearanceProvider');
  return value;
}
