/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS SF Pro - System Default */
    sans: 'System',
    /** iOS SF Pro Rounded */
    rounded: 'System',
    /** iOS SF Pro Serif */
    serif: 'System',
    /** iOS SF Mono */
    mono: 'Menlo',
  },
  default: {
    /** Android: Roboto (system default) is closest to SF Pro */
    sans: 'Roboto',
    rounded: 'Roboto',
    serif: 'serif',
    mono: 'monospace',
  },
  web: {
    /** Web: SF Pro from system font stack */
    sans: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "-apple-system, BlinkMacSystemFont, 'SF Pro Rounded', 'SF Pro Display', sans-serif",
    mono: "'SF Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Default font family for the entire app
export const defaultFontFamily = Platform.select({
  ios: 'System', // SF Pro on iOS
  android: 'Roboto', // Closest to SF Pro on Android
  web: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  default: 'System',
});
