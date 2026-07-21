'use client'

import { Menu, ShieldAlert } from 'lucide-react'
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
  selectedModelId,
  onModelChange,
  models,
  user,
}: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 min-h-12">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="md:hidden rounded-lg p-1.5 text-foreground/60 hover:bg-muted/50 hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {models.length > 0 && (
          <div className="relative group">
            <button className="flex items-center gap-2 px-2 py-1.5 text-sm text-foreground hover:bg-muted/30 rounded-lg transition-colors">
              <span className="font-semibold">TYNEX AI</span>
              <svg
                className="h-4 w-4 text-foreground/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div className="absolute left-0 top-full mt-1 hidden w-48 rounded-lg border border-border bg-card shadow-lg group-hover:block z-50 overflow-hidden">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => onModelChange(model.id)}
                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                    model.id === selectedModelId
                      ? 'text-foreground bg-muted/30'
                      : 'text-foreground/60 hover:bg-muted/20 hover:text-foreground'
                  }`}
                >
                  {model.displayName}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {user?.role === 'admin' && (
          <Link
            href="/admin"
            className="px-2 py-1.5 text-xs text-foreground/50 hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors"
          >
            <ShieldAlert className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  )
}
