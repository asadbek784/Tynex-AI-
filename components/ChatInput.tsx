'use client'

import { ArrowUp, Paperclip, Mic, X, Loader2 } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  currentImageUrl?: string | null
  onSetImageUrl?: (url: string | null) => void
}

export function ChatInput({
  onSend,
  disabled = false,
  currentImageUrl,
  onSetImageUrl,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = Math.min(textareaRef.current.scrollHeight, 200)
      textareaRef.current.style.height = scrollHeight + 'px'
    }
  }, [value])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const rec = new SpeechRecognition()
        rec.continuous = false
        rec.interimResults = false
        rec.lang = 'uz-UZ'
        rec.onstart = () => setIsListening(true)
        rec.onend = () => setIsListening(false)
        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          if (transcript) setValue((prev) => prev + (prev ? ' ' : '') + transcript)
        }
        rec.onerror = () => setIsListening(false)
        setRecognitionInstance(rec)
      }
    }
  }, [])

  const handleMicClick = () => {
    if (!recognitionInstance) {
      alert('Brauzeringiz nutqni aniqlashni qo\'llab-quvvatlamaydi.')
      return
    }
    isListening ? recognitionInstance.stop() : recognitionInstance.start()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok && data.url) onSetImageUrl?.(data.url)
      else alert(data.error || 'Xatolik')
    } catch {
      alert('Tarmoq xatoligi')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim())
      setValue('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const hasValue = value.trim().length > 0

  return (
    <div className="border-t border-border/50 bg-background px-4 py-3">
      {currentImageUrl && (
        <div className="mb-3 mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-card rounded-lg px-3 py-1.5 border border-border">
            <img src={currentImageUrl} alt="Preview" className="h-8 w-8 object-cover rounded" />
            <span className="text-xs text-foreground/60">1 rasm</span>
            <button
              onClick={() => onSetImageUrl?.(null)}
              className="ml-1 text-foreground/40 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl">
        <div className="relative rounded-xl border border-border/60 bg-card shadow-sm transition-shadow focus-within:shadow-md focus-within:border-border">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="TYNEX AI ga xabar yubor..."
            className="w-full resize-none bg-transparent px-4 pt-3 pb-10 text-sm text-foreground outline-none placeholder:text-foreground/40 disabled:opacity-50 max-h-52"
            rows={1}
          />

          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-muted/50 disabled:opacity-50 transition-colors"
                title="Fayl biriktirish"
              >
                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
              </button>
              <button
                onClick={handleMicClick}
                disabled={disabled}
                className={`p-1.5 rounded-lg transition-colors ${
                  isListening
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground/40 hover:text-foreground hover:bg-muted/50'
                } disabled:opacity-50`}
                title={isListening ? "To'xtatish" : 'Ovozli kiritish'}
              >
                <Mic className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={disabled || !hasValue}
              className={`p-1.5 rounded-lg transition-all ${
                hasValue
                  ? 'bg-primary text-white hover:opacity-90'
                  : 'bg-muted/50 text-foreground/40'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title="Yuborish"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-foreground/30">
          TYNEX AI xato qilishi mumkin. Muhim ma&apos;lumotlarni tekshiring.
        </p>
      </div>
    </div>
  )
}
