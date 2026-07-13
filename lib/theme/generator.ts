import type { ThemeSettings, AccentColor } from './types'
import { ACCENT_COLORS } from './types'

type TextContent = string

const getAccentColor = (
  accentColor: AccentColor,
  mode: 'light' | 'dark' | 'black',
  customColor?: string
): string => {
  if (accentColor === 'custom' && customColor) {
    return customColor
  }
  const colors = ACCENT_COLORS[accentColor as Exclude<AccentColor, 'custom'>]
  return colors?.[mode] || colors?.dark
}

const getBaseColors = (
  mode: 'light' | 'dark' | 'black'
): Record<string, string> => {
  const colors: Record<'light' | 'dark' | 'black', Record<string, string>> = {
    light: {
      background: '#FFFFFF',
      surface: '#F9FAFB',
      surfaceAlt: '#F3F4F6',
      text: '#000000',
      textSecondary: '#4B5563',
      textTertiary: '#9CA3AF',
      border: '#E5E7EB',
      borderAlt: '#D1D5DB',
    },
    dark: {
      background: '#0F1117',
      surface: '#161B22',
      surfaceAlt: '#21262D',
      text: '#E6EDF3',
      textSecondary: '#C9D1D9',
      textTertiary: '#8B949E',
      border: '#30363D',
      borderAlt: '#21262D',
    },
    black: {
      background: '#000000',
      surface: '#0A0A0A',
      surfaceAlt: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#E0E0E0',
      textTertiary: '#A0A0A0',
      border: '#2A2A2A',
      borderAlt: '#1A1A1A',
    },
  }
  return colors[mode]
}

const getBorderRadiusValues = (
  radius: 'sharp' | 'rounded' | 'extra-rounded'
): Record<string, string> => {
  const radiusMap = {
    sharp: {
      xs: '0px',
      sm: '2px',
      base: '4px',
      lg: '6px',
      xl: '8px',
      '2xl': '12px',
      full: '999px',
    },
    rounded: {
      xs: '4px',
      sm: '6px',
      base: '8px',
      lg: '12px',
      xl: '16px',
      '2xl': '20px',
      full: '999px',
    },
    'extra-rounded': {
      xs: '8px',
      sm: '12px',
      base: '16px',
      lg: '20px',
      xl: '24px',
      '2xl': '32px',
      full: '999px',
    },
  }
  return radiusMap[radius]
}

const getAnimationDuration = (
  level: 'off' | 'low' | 'medium' | 'high'
): Record<string, string> => {
  const durations = {
    off: {
      base: '0ms',
      slow: '0ms',
      slower: '0ms',
    },
    low: {
      base: '150ms',
      slow: '300ms',
      slower: '500ms',
    },
    medium: {
      base: '200ms',
      slow: '400ms',
      slower: '600ms',
    },
    high: {
      base: '300ms',
      slow: '500ms',
      slower: '800ms',
    },
  }
  return durations[level]
}

const getMessageDensitySpacing = (
  density: 'compact' | 'comfortable' | 'spacious'
): Record<string, string> => {
  const spacing = {
    compact: {
      py: '0.5rem',
      px: '1rem',
      gap: '0.5rem',
      lineHeight: '1.4',
    },
    comfortable: {
      py: '0.75rem',
      px: '1.25rem',
      gap: '0.75rem',
      lineHeight: '1.5',
    },
    spacious: {
      py: '1rem',
      px: '1.5rem',
      gap: '1rem',
      lineHeight: '1.6',
    },
  }
  return spacing[density]
}

export const generateThemeCSS = (settings: ThemeSettings): string => {
  const mode = settings.mode === 'system' ? 'dark' : settings.mode
  const baseColors = getBaseColors(mode as 'light' | 'dark' | 'black')
  const accentColor = getAccentColor(
    settings.accentColor,
    mode as 'light' | 'dark' | 'black',
    settings.customAccentColor
  )
  const borderRadius = getBorderRadiusValues(settings.borderRadius)
  const animationDuration = getAnimationDuration(settings.animationLevel)
  const messageDensity = getMessageDensitySpacing(settings.messageDensity)

  const css: TextContent = `
    :root {
      /* Base Colors */
      --color-background: ${baseColors.background};
      --color-surface: ${baseColors.surface};
      --color-surface-alt: ${baseColors.surfaceAlt};
      --color-text: ${baseColors.text};
      --color-text-secondary: ${baseColors.textSecondary};
      --color-text-tertiary: ${baseColors.textTertiary};
      --color-border: ${baseColors.border};
      --color-border-alt: ${baseColors.borderAlt};

      /* Accent Color */
      --color-accent: ${accentColor};
      --color-accent-light: ${accentColor}20;
      --color-accent-lighter: ${accentColor}10;

      /* Border Radius */
      --radius-xs: ${borderRadius.xs};
      --radius-sm: ${borderRadius.sm};
      --radius-base: ${borderRadius.base};
      --radius-lg: ${borderRadius.lg};
      --radius-xl: ${borderRadius.xl};
      --radius-2xl: ${borderRadius['2xl']};
      --radius-full: ${borderRadius.full};

      /* Animation Duration */
      --duration-base: ${animationDuration.base};
      --duration-slow: ${animationDuration.slow};
      --duration-slower: ${animationDuration.slower};

      /* Message Density */
      --message-py: ${messageDensity.py};
      --message-px: ${messageDensity.px};
      --message-gap: ${messageDensity.gap};
      --message-line-height: ${messageDensity.lineHeight};
    }

    body {
      background-color: var(--color-background);
      color: var(--color-text);
      transition: background-color var(--duration-base), color var(--duration-base);
    }

    /* Premium Black & White Default */
    .tynex-surface {
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
    }

    .tynex-button-primary {
      background-color: var(--color-accent);
      color: ${mode === 'black' || mode === 'dark' ? '#000000' : '#FFFFFF'};
      border-radius: var(--radius-base);
      transition: opacity var(--duration-base);
    }

    .tynex-button-primary:hover {
      opacity: 0.9;
    }

    .tynex-message-bubble {
      padding: var(--message-py) var(--message-px);
      border-radius: var(--radius-lg);
      line-height: var(--message-line-height);
      gap: var(--message-gap);
    }
  `

  return css
}
