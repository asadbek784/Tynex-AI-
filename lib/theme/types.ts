export type ThemeMode = 'light' | 'dark' | 'black' | 'system'
export type AccentColor =
  | 'blue'
  | 'purple'
  | 'cyan'
  | 'emerald'
  | 'orange'
  | 'red'
  | 'pink'
  | 'yellow'
  | 'custom'

export type BackgroundStyle =
  | 'solid'
  | 'glass'
  | 'aurora'
  | 'gradient'
  | 'blur'
  | 'noise'
  | 'mesh'
  | 'glow'

export type BorderRadius = 'sharp' | 'rounded' | 'extra-rounded'
export type AnimationLevel = 'off' | 'low' | 'medium' | 'high'
export type ChatBubbleStyle =
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'minimal'
  | 'rounded'
  | 'compact'

export type SidebarStyle = 'floating' | 'fixed' | 'compact' | 'expanded' | 'hidden'
export type Typography = 'inter' | 'geist' | 'sf-pro' | 'plex-sans'
export type MessageDensity = 'compact' | 'comfortable' | 'spacious'
export type CodeTheme = 'dark' | 'light' | 'github' | 'dracula' | 'one-dark'

export interface ThemeSettings {
  mode: ThemeMode
  accentColor: AccentColor
  customAccentColor?: string
  backgroundColor: BackgroundStyle
  borderRadius: BorderRadius
  animationLevel: AnimationLevel
  chatBubbleStyle: ChatBubbleStyle
  sidebarStyle: SidebarStyle
  typography: Typography
  messageDensity: MessageDensity
  codeTheme: CodeTheme
}

export interface ThemeContextType {
  settings: ThemeSettings
  updateSettings: (settings: Partial<ThemeSettings>) => void
  resetToDefault: () => void
}

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  mode: 'system',
  accentColor: 'blue',
  backgroundColor: 'solid',
  borderRadius: 'rounded',
  animationLevel: 'medium',
  chatBubbleStyle: 'chatgpt',
  sidebarStyle: 'fixed',
  typography: 'geist',
  messageDensity: 'comfortable',
  codeTheme: 'dark',
}

export const ACCENT_COLORS: Record<
  Exclude<AccentColor, 'custom'>,
  { light: string; dark: string; black: string }
> = {
  blue: {
    light: '#2563EB',
    dark: '#3B82F6',
    black: '#60A5FA',
  },
  purple: {
    light: '#7C3AED',
    dark: '#A78BFA',
    black: '#C4B5FD',
  },
  cyan: {
    light: '#0891B2',
    dark: '#06B6D4',
    black: '#22D3EE',
  },
  emerald: {
    light: '#059669',
    dark: '#10B981',
    black: '#34D399',
  },
  orange: {
    light: '#D97706',
    dark: '#F97316',
    black: '#FB923C',
  },
  red: {
    light: '#DC2626',
    dark: '#EF4444',
    black: '#F87171',
  },
  pink: {
    light: '#DB2777',
    dark: '#EC4899',
    black: '#F472B6',
  },
  yellow: {
    light: '#CA8A04',
    dark: '#EAB308',
    black: '#FACC15',
  },
}
