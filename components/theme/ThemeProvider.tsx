'use client'

import { useEffect, useState } from 'react'
import { useThemeStore } from '@/lib/theme/store'
import { generateThemeCSS } from '@/lib/theme/generator'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const settings = useThemeStore((state) => state.settings)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Generate and inject theme CSS
    const css = generateThemeCSS(settings)
    let styleEl = document.getElementById('tynex-theme-styles')

    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'tynex-theme-styles'
      document.head.appendChild(styleEl)
    }

    styleEl.textContent = css

    // Set data attribute for CSS media queries
    document.documentElement.setAttribute('data-theme-mode', settings.mode)
    document.documentElement.setAttribute('data-accent', settings.accentColor)
    document.documentElement.setAttribute('data-bg-style', settings.backgroundColor)
    document.documentElement.setAttribute('data-bubble-style', settings.chatBubbleStyle)
    document.documentElement.setAttribute('data-sidebar-style', settings.sidebarStyle)
    document.documentElement.setAttribute('data-typography', settings.typography)
  }, [settings, mounted])

  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}
