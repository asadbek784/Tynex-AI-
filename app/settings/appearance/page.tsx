'use client'

import { useState } from 'react'
import { useThemeStore } from '@/lib/theme/store'
import { ACCENT_COLORS } from '@/lib/theme/types'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import type { ThemeSettings, ThemeMode, AccentColor, BackgroundStyle, BorderRadius, AnimationLevel, ChatBubbleStyle, SidebarStyle, Typography, MessageDensity, CodeTheme } from '@/lib/theme/types'

export default function AppearancePage() {
  const settings = useThemeStore((state) => state.settings)
  const updateSettings = useThemeStore((state) => state.updateSettings)
  const resetToDefault = useThemeStore((state) => state.resetToDefault)
  const [customColor, setCustomColor] = useState(settings.customAccentColor || '#3B82F6')

  const handleModeChange = (mode: ThemeMode) => {
    updateSettings({ mode })
  }

  const handleAccentChange = (accent: AccentColor) => {
    updateSettings({ accentColor: accent })
  }

  const handleCustomAccentChange = (color: string) => {
    setCustomColor(color)
    updateSettings({ customAccentColor: color, accentColor: 'custom' })
  }

  const handleBackgroundChange = (bg: BackgroundStyle) => {
    updateSettings({ backgroundColor: bg })
  }

  const handleBorderRadiusChange = (radius: BorderRadius) => {
    updateSettings({ borderRadius: radius })
  }

  const handleAnimationChange = (level: AnimationLevel) => {
    updateSettings({ animationLevel: level })
  }

  const handleChatBubbleChange = (style: ChatBubbleStyle) => {
    updateSettings({ chatBubbleStyle: style })
  }

  const handleSidebarChange = (style: SidebarStyle) => {
    updateSettings({ sidebarStyle: style })
  }

  const handleTypographyChange = (font: Typography) => {
    updateSettings({ typography: font })
  }

  const handleDensityChange = (density: MessageDensity) => {
    updateSettings({ messageDensity: density })
  }

  const handleCodeThemeChange = (theme: CodeTheme) => {
    updateSettings({ codeTheme: theme })
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Appearance</h1>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              Customize how TYNEX AI looks and feels
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetToDefault}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 hover:bg-[var(--color-surface-alt)]"
          >
            <RotateCcw size={18} />
            Reset
          </motion.button>
        </div>

        {/* Theme Settings */}
        <div className="space-y-8">
          {/* Theme Mode */}
          <section className="rounded-lg border border-[var(--color-border)] p-6">
            <h2 className="mb-4 text-xl font-semibold">Theme Mode</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {(['light', 'dark', 'black', 'system'] as ThemeMode[]).map((mode) => (
                <motion.button
                  key={mode}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleModeChange(mode)}
                  className={`rounded-lg border-2 px-4 py-3 text-center capitalize transition-all ${
                    settings.mode === mode
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-lighter)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                  }`}
                >
                  {mode}
                </motion.button>
              ))}
            </div>
          </section>

          {/* Accent Colors */}
          <section className="rounded-lg border border-[var(--color-border)] p-6">
            <h2 className="mb-4 text-xl font-semibold">Accent Color</h2>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
              {Object.keys(ACCENT_COLORS).map((color) => (
                <motion.button
                  key={color}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAccentChange(color as AccentColor)}
                  className={`rounded-lg border-2 px-3 py-3 capitalize transition-all ${
                    settings.accentColor === color
                      ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]'
                      : 'border-[var(--color-border)]'
                  }`}
                >
                  <div
                    className="h-6 w-full rounded"
                    style={{
                      backgroundColor: ACCENT_COLORS[color as Exclude<AccentColor, 'custom'>]['dark'],
                    }}
                  />
                </motion.button>
              ))}
            </div>

            {/* Custom Color Picker */}
            <div className="mt-6 flex items-center gap-4">
              <label className="text-sm font-medium">Custom Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => handleCustomAccentChange(e.target.value)}
                  className="h-10 w-16 cursor-pointer rounded border border-[var(--color-border)]"
                />
                <span className="text-sm text-[var(--color-text-secondary)]">{customColor}</span>
              </div>
            </div>
          </section>

          {/* Background Style */}
          <section className="rounded-lg border border-[var(--color-border)] p-6">
            <h2 className="mb-4 text-xl font-semibold">Background Style</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {(['solid', 'glass', 'aurora', 'gradient', 'blur', 'noise', 'mesh', 'glow'] as BackgroundStyle[]).map((bg) => (
                <motion.button
                  key={bg}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleBackgroundChange(bg)}
                  className={`rounded-lg border-2 px-4 py-3 text-center capitalize transition-all ${
                    settings.backgroundColor === bg
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-lighter)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                  }`}
                >
                  {bg}
                </motion.button>
              ))}
            </div>
          </section>

          {/* Border Radius */}
          <section className="rounded-lg border border-[var(--color-border)] p-6">
            <h2 className="mb-4 text-xl font-semibold">Border Radius</h2>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-3">
              {(['sharp', 'rounded', 'extra-rounded'] as BorderRadius[]).map((radius) => (
                <motion.button
                  key={radius}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleBorderRadiusChange(radius)}
                  className={`rounded-lg border-2 px-4 py-3 text-center capitalize transition-all ${
                    settings.borderRadius === radius
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-lighter)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                  }`}
                >
                  {radius.replace('-', ' ')}
                </motion.button>
              ))}
            </div>
          </section>

          {/* Animation Level */}
          <section className="rounded-lg border border-[var(--color-border)] p-6">
            <h2 className="mb-4 text-xl font-semibold">Animation Level</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {(['off', 'low', 'medium', 'high'] as AnimationLevel[]).map((level) => (
                <motion.button
                  key={level}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnimationChange(level)}
                  className={`rounded-lg border-2 px-4 py-3 text-center capitalize transition-all ${
                    settings.animationLevel === level
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-lighter)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                  }`}
                >
                  {level}
                </motion.button>
              ))}
            </div>
          </section>

          {/* Chat Bubble Style */}
          <section className="rounded-lg border border-[var(--color-border)] p-6">
            <h2 className="mb-4 text-xl font-semibold">Chat Bubble Style</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {(['chatgpt', 'claude', 'gemini', 'minimal', 'rounded', 'compact'] as ChatBubbleStyle[]).map((style) => (
                <motion.button
                  key={style}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChatBubbleChange(style)}
                  className={`rounded-lg border-2 px-4 py-3 text-center capitalize transition-all ${
                    settings.chatBubbleStyle === style
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-lighter)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                  }`}
                >
                  {style}
                </motion.button>
              ))}
            </div>
          </section>

          {/* Sidebar Style */}
          <section className="rounded-lg border border-[var(--color-border)] p-6">
            <h2 className="mb-4 text-xl font-semibold">Sidebar Style</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {(['floating', 'fixed', 'compact', 'expanded', 'hidden'] as SidebarStyle[]).map((style) => (
                <motion.button
                  key={style}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSidebarChange(style)}
                  className={`rounded-lg border-2 px-4 py-3 text-center capitalize transition-all ${
                    settings.sidebarStyle === style
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-lighter)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                  }`}
                >
                  {style}
                </motion.button>
              ))}
            </div>
          </section>

          {/* Typography */}
          <section className="rounded-lg border border-[var(--color-border)] p-6">
            <h2 className="mb-4 text-xl font-semibold">Typography</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {(['inter', 'geist', 'sf-pro', 'plex-sans'] as Typography[]).map((font) => (
                <motion.button
                  key={font}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTypographyChange(font)}
                  className={`rounded-lg border-2 px-4 py-3 text-center capitalize transition-all ${
                    settings.typography === font
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-lighter)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                  }`}
                >
                  {font.replace('-', ' ')}
                </motion.button>
              ))}
            </div>
          </section>

          {/* Message Density */}
          <section className="rounded-lg border border-[var(--color-border)] p-6">
            <h2 className="mb-4 text-xl font-semibold">Message Density</h2>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-3">
              {(['compact', 'comfortable', 'spacious'] as MessageDensity[]).map((density) => (
                <motion.button
                  key={density}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDensityChange(density)}
                  className={`rounded-lg border-2 px-4 py-3 text-center capitalize transition-all ${
                    settings.messageDensity === density
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-lighter)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                  }`}
                >
                  {density}
                </motion.button>
              ))}
            </div>
          </section>

          {/* Code Theme */}
          <section className="rounded-lg border border-[var(--color-border)] p-6">
            <h2 className="mb-4 text-xl font-semibold">Code Theme</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {(['dark', 'light', 'github', 'dracula', 'one-dark'] as CodeTheme[]).map((theme) => (
                <motion.button
                  key={theme}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCodeThemeChange(theme)}
                  className={`rounded-lg border-2 px-4 py-3 text-center capitalize transition-all ${
                    settings.codeTheme === theme
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-lighter)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                  }`}
                >
                  {theme.replace('-', ' ')}
                </motion.button>
              ))}
            </div>
          </section>
        </div>

        {/* Live Preview */}
        <section className="mt-8 rounded-lg border border-[var(--color-border)] p-6">
          <h2 className="mb-4 text-xl font-semibold">Live Preview</h2>
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm text-[var(--color-text-secondary)]">Text Sample</p>
              <h3 className="mt-2 text-lg font-semibold">Heading Example</h3>
            </div>
            <button className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2 text-center font-medium text-white">
              Button Example
            </button>
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
              <code className="text-sm">code_example()</code>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
