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
    <div className="flex flex-col items-center justify-center h-full px-4 bg-background">
      <div className="flex flex-col items-center gap-6 max-w-xl w-full">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-normal tracking-tight text-foreground">
            Bugun sizga qanday yordam bera olaman?
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg mt-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSelectSuggestion(suggestion)}
              className="p-3 text-left border border-border bg-background hover:bg-muted text-sm text-foreground transition-colors rounded-none"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
