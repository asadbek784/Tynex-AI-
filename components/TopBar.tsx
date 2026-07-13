'use client'

import { Menu, Plus, Settings, Bot, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

interface AIModelType {
  id: string
  modelId: string
  displayName: string
}

interface TopBarProps {
  onMenuClick: () => void
  onNewChat: () => void
  selectedModelId: string
  onModelChange: (id: string) => void
  models: AIModelType[]
  user?: { role: string } | null
}

export function TopBar({
  onMenuClick,
  onNewChat,
  selectedModelId,
  onModelChange,
  models,
  user,
}: TopBarProps) {
  const activeModel = models.find((m) => m.id === selectedModelId)

  return (
    <div className="flex items-center justify-between border-b border-border bg-[#0B0F19]/80 backdrop-blur-sm px-4 py-3 z-20">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Menu button (mobile) */}
        <button
          onClick={onMenuClick}
          className="md:hidden rounded-lg p-2 text-secondary hover:bg-muted hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Model selector */}
        {models.length > 0 && (
          <div className="relative group">
            <button className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 hover:border-primary/50 transition-all group-hover:shadow-lg group-hover:shadow-primary/10">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="font-semibold tracking-wide text-xs">TYNEX AI</span>
              <svg
                className="h-4 w-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </button>

            {/* Dropdown */}
            <div className="absolute left-0 top-full mt-1 hidden w-48 rounded-lg border border-border bg-card/95 shadow-xl backdrop-blur-sm group-hover:block z-50">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => onModelChange(model.id)}
                  className="flex w-full items-center gap-2 border-b border-border/50 px-4 py-2.5 text-left text-sm text-secondary hover:bg-muted/50 hover:text-foreground transition-colors last:border-b-0"
                >
                  <div
                    className={`h-2 w-2 rounded-full ${
                      model.id === selectedModelId
                        ? 'bg-[#00D4FF]'
                        : 'bg-muted'
                    }`}
                  />
                  {model.displayName}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Center section */}
      <div className="hidden md:block">
        <h1 className="text-center text-sm font-semibold text-foreground tracking-wide">
          TYNEX AI
        </h1>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Admin panel link */}
        {user?.role === 'admin' && (
          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-400 hover:bg-purple-500/20 transition-all shadow-sm"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Admin Panel
          </Link>
        )}

        {/* New chat button (desktop) */}
        <button
          onClick={onNewChat}
          className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yangi chat
        </button>
      </div>
    </div>
  )
}
