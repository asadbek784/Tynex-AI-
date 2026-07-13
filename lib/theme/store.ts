import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeSettings, ThemeContextType } from './types'
import { DEFAULT_THEME_SETTINGS } from './types'

interface ThemeStore extends ThemeContextType {
  hydrateFromStorage: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_THEME_SETTINGS,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      resetToDefault: () =>
        set({
          settings: DEFAULT_THEME_SETTINGS,
        }),
      hydrateFromStorage: () => {
        // This is called after hydration from localStorage
      },
    }),
    {
      name: 'tynex-theme-settings',
      version: 1,
    }
  )
)
