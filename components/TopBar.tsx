'use client'

import { Menu, Plus, ShieldAlert } from 'lucide-react'
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
  return (
    <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {models.length > 0 && (
          <div className="relative group">
            <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted transition-all">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="font-medium text-xs">TYNEX AI</span>
              <svg
                className="h-4 w-4 text-muted-foreground"
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

            <div className="absolute left-0 top-full mt-1 hidden w-48 rounded-lg border border-border bg-card shadow-lg group-hover:block z-50">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => onModelChange(model.id)}
                  className="flex w-full items-center gap-2 border-b border-border/50 px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors last:border-b-0"
                >
                  <div
                    className={`h-2 w-2 rounded-full ${
                      model.id === selectedModelId ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                  {model.displayName}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <h1 className="text-center text-sm font-medium text-foreground">
          TYNEX AI
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {user?.role === 'admin' && (
          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Admin Panel
          </Link>
        )}

        <button
          onClick={onNewChat}
          className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yangi chat
        </button>
      </div>
    </div>
  )
}
