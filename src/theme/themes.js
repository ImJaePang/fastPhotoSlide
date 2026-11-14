/**
 * shadcn/ui 스타일의 디자인 토큰.
 * base(라이트/다크 공통 뉴트럴) + palette(포인트 컬러) 조합으로 최종 색상을 만듭니다.
 */

const BASE = {
  light: {
    background: '#ffffff',
    foreground: '#09090b',
    card: '#ffffff',
    cardForeground: '#09090b',
    secondary: '#f4f4f5',
    secondaryForeground: '#18181b',
    muted: '#f4f4f5',
    mutedForeground: '#71717a',
    accent: '#f4f4f5',
    accentForeground: '#18181b',
    border: '#e4e4e7',
    input: '#e4e4e7',
    destructive: '#ef4444',
    scrim: 'rgba(0,0,0,0.45)',
  },
  dark: {
    background: '#09090b',
    foreground: '#fafafa',
    card: '#111113',
    cardForeground: '#fafafa',
    secondary: '#27272a',
    secondaryForeground: '#fafafa',
    muted: '#27272a',
    mutedForeground: '#a1a1aa',
    accent: '#27272a',
    accentForeground: '#fafafa',
    border: '#2a2a2e',
    input: '#2a2a2e',
    destructive: '#f87171',
    scrim: 'rgba(0,0,0,0.65)',
  },
};

export const PALETTES = {
  zinc: {
    label: 'Zinc',
    swatch: '#52525b',
    light: { primary: '#18181b', primaryForeground: '#fafafa', ring: '#a1a1aa' },
    dark: { primary: '#fafafa', primaryForeground: '#18181b', ring: '#71717a' },
  },
  blue: {
    label: 'Blue',
    swatch: '#2563eb',
    light: { primary: '#2563eb', primaryForeground: '#ffffff', ring: '#93c5fd' },
    dark: { primary: '#3b82f6', primaryForeground: '#ffffff', ring: '#1d4ed8' },
  },
  green: {
    label: 'Green',
    swatch: '#16a34a',
    light: { primary: '#16a34a', primaryForeground: '#ffffff', ring: '#86efac' },
    dark: { primary: '#22c55e', primaryForeground: '#052e16', ring: '#15803d' },
  },
  rose: {
    label: 'Rose',
    swatch: '#e11d48',
    light: { primary: '#e11d48', primaryForeground: '#ffffff', ring: '#fda4af' },
    dark: { primary: '#fb7185', primaryForeground: '#4c0519', ring: '#be123c' },
  },
  orange: {
    label: 'Orange',
    swatch: '#ea580c',
    light: { primary: '#ea580c', primaryForeground: '#ffffff', ring: '#fdba74' },
    dark: { primary: '#f97316', primaryForeground: '#431407', ring: '#c2410c' },
  },
  violet: {
    label: 'Violet',
    swatch: '#7c3aed',
    light: { primary: '#7c3aed', primaryForeground: '#ffffff', ring: '#c4b5fd' },
    dark: { primary: '#8b5cf6', primaryForeground: '#ffffff', ring: '#6d28d9' },
  },
};

export const THEME_MODES = ['system', 'light', 'dark'];

export function buildColors(paletteId, isDark) {
  const scheme = isDark ? 'dark' : 'light';
  const palette = PALETTES[paletteId] || PALETTES.zinc;
  return { ...BASE[scheme], ...palette[scheme] };
}

export const RADIUS = { sm: 6, md: 8, lg: 12, xl: 16 };
