'use client'

import { Sparkles } from 'lucide-react'

interface WelcomeScreenProps {
  onSelectSuggestion: (text: string) => void
}

const suggestions = [
  {
    icon: '✦',
    title: 'Kod yozish',
    description: 'Murakkab algoritmlar va dasturlash vazifalarida yordam oling',
  },
  {
    icon: '◈',
    title: 'Fikr-mulohaza',
    description: 'Ma\'lumotlarni tahlil qilish va mantiqiy xulosalar chiqarish',
  },
  {
    icon: '◇',
    title: 'O\'qitish',
    description: 'Yangi mavzularni tushunarli tilda o\'rganing',
  },
  {
    icon: '○',
    title: 'Kreativ fikr',
    description: 'Matn, g\'oya yoki loyiha bo\'yicha ijodiy yondashuvlar',
  },
]

export function WelcomeScreen({ onSelectSuggestion }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-10 py-16 px-4 text-center">
      <div className="space-y-3">
        <div className="flex justify-center">
          <Sparkles className="h-8 w-8 text-primary/70" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Bugun sizga <span className="text-primary">qanday</span> yordam bera olaman?
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Masalani batafsil ta&apos;riflab bering yoki quyidagi tavsiyalardan birini tanlang
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-3 md:grid-cols-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() =>
              onSelectSuggestion(
                `Menga ${suggestion.title.toLowerCase()} bilan yordam ber: ${suggestion.description}`
              )
            }
            className="group rounded-lg border border-border bg-card/50 p-4 text-left transition-all hover:border-primary/30 hover:bg-card"
          >
            <div className="flex flex-col gap-2">
              <span className="text-lg text-primary/60 group-hover:text-primary transition-colors">{suggestion.icon}</span>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{suggestion.title}</p>
                <p className="text-xs text-muted-foreground">{suggestion.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
