'use client'

import { Sparkles } from 'lucide-react'

interface WelcomeScreenProps {
  onSelectSuggestion: (text: string) => void
}

const suggestions = [
  {
    icon: '✨',
    title: 'Kod yozish',
    description: 'Python, JavaScript yoki boshqa til',
  },
  {
    icon: '🧠',
    title: 'Fikr-mulohaza',
    description: 'Murakkab masalalarni yeching',
  },
  {
    icon: '📚',
    title: 'O\'qitish',
    description: 'Yangi narsalarni o\'rganing',
  },
  {
    icon: '🎨',
    title: 'Kreativ fikr',
    description: 'Yangi g\'oyalar yarating',
  },
]

export function WelcomeScreen({ onSelectSuggestion }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-12 py-12 px-4 text-center">
      {/* Main heading */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="animate-pulse">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Bugun sizga <span className="bg-gradient-to-r from-[#00D4FF] to-cyan-300 bg-clip-text text-transparent">qanday</span> yordam bera olaman?
        </h1>
        <p className="text-base text-secondary md:text-lg">
          Masalani batafsil ta&apos;riflab bering yoki quyidagi tavsiyalardan birini tanlang
        </p>
      </div>

      {/* Suggestion cards */}
      <div className="grid w-full max-w-2xl gap-4 md:grid-cols-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() =>
              onSelectSuggestion(
                `Menga ${suggestion.title.toLowerCase()} bilan yordam ber: ${suggestion.description}`
              )
            }
            className="group relative overflow-hidden rounded-xl border border-border bg-card/40 p-5 transition-all hover:border-primary/60 hover:bg-card/80 hover:shadow-xl hover:shadow-primary/15 active:scale-95 hover:-translate-y-0.5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex flex-col items-start gap-3">
              <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{suggestion.icon}</span>
              <div className="space-y-1.5 text-left">
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{suggestion.title}</p>
                <p className="text-xs text-secondary group-hover:text-secondary/90">{suggestion.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
