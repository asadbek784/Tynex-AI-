'use client'

interface WelcomeScreenProps {
  onSelectSuggestion: (text: string) => void
}

const suggestions = [
  'Kod yozishda yordam ber',
  'Matn tahlil qil',
  'Fikr-mulohaza bildir',
  'Yangi narsa o\'rgat',
]

export function WelcomeScreen({ onSelectSuggestion }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="flex flex-col items-center gap-8 max-w-lg">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Bugun sizga qanday yordam bera olaman?
          </h1>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSelectSuggestion(suggestion)}
              className="px-4 py-2 rounded-full border border-border text-sm text-foreground/70 hover:bg-muted/30 hover:text-foreground hover:border-border transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
