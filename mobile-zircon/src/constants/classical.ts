import { useThemeStore } from '@/stores/themeStore';

export interface ZirconPalette {
  bg: string;
  surface: string;
  text: string;
  textMuted: string;
  textSoft: string;
  accent: string;
  accent100: string;
  accent600: string;
  accent700: string;
  accent800: string;
  accent2: string;
  accent2100: string;
  accent2700: string;
  accent2800: string;
  neutral100: string;
  neutral400: string;
  neutral800: string;
  neutral900: string;
  divider: string;
  danger: string;
  overlay: string;
}

export const LIGHT_PALETTE: ZirconPalette = {
  bg: '#f3f2f2',
  surface: '#eae9e9',
  text: '#201f1d',
  textMuted: 'rgba(32, 31, 29, 0.58)',
  textSoft: 'rgba(32, 31, 29, 0.72)',
  accent: '#23899d',
  accent100: '#e2f4f8',
  accent600: '#1a7182',
  accent700: '#125866',
  accent800: '#0c3f49',
  accent2: '#7658b0',
  accent2100: '#efe9fa',
  accent2700: '#4d3483',
  accent2800: '#372460',
  neutral100: '#f8f4f4',
  neutral400: '#bab6b6',
  neutral800: '#444141',
  neutral900: '#2d2b2b',
  divider: 'rgba(32, 31, 29, 0.16)',
  danger: '#b0432c',
  overlay: 'rgba(45, 43, 43, 0.45)',
};

export const DARK_PALETTE: ZirconPalette = {
  bg: '#1c1a1a',
  surface: '#262424',
  text: '#eeecea',
  textMuted: 'rgba(238, 236, 234, 0.58)',
  textSoft: 'rgba(238, 236, 234, 0.74)',
  accent: '#5fc0d2',
  accent100: '#11363e',
  accent600: '#8fd6e3',
  accent700: '#9fdbe7',
  accent800: '#c4ecf3',
  accent2: '#a68ce0',
  accent2100: '#2c2344',
  accent2700: '#cdbdf2',
  accent2800: '#e0d6fa',
  neutral100: '#2d2b2b',
  neutral400: '#bab6b6',
  neutral800: '#d7d3d3',
  neutral900: '#0e0d0d',
  divider: 'rgba(238, 236, 234, 0.15)',
  danger: '#e8907a',
  overlay: 'rgba(14, 13, 13, 0.65)',
};

export const FONTS = {
  heading: 'CormorantGaramond_400Regular',
  headingSemi: 'CormorantGaramond_600SemiBold',
  body: 'Lora_400Regular',
  bodySemi: 'Lora_600SemiBold',
} as const;

export const RADII = {
  sm: 2,
  md: 4,
  lg: 7,
} as const;

export function useZirconTheme(): { palette: ZirconPalette; dark: boolean } {
  const dark = useThemeStore((s) => s.dark);
  return { palette: dark ? DARK_PALETTE : LIGHT_PALETTE, dark };
}
