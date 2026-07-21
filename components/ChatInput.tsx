'use client'

import { Paperclip, Mic, Send, X, Loader2 } from 'lucide-react'
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
      const scrollHeight = Math.min(textareaRef.current.scrollHeight, 120)
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
          if (transcript) {
            setValue((prev) => prev + (prev ? ' ' : '') + transcript)
          }
        }
        rec.onerror = () => setIsListening(false)
        setRecognitionInstance(rec)
      }
    }
  }, [])

  const handleMicClick = () => {
    if (!recognitionInstance) {
      alert('Brauzeringiz nutqni aniqlashni qo\'llab-quvvatlamaydi. Chrome yoki Edge ishlatib ko\'ring.')
      return
    }
    if (isListening) {
      recognitionInstance.stop()
    } else {
      recognitionInstance.start()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.url) {
        onSetImageUrl?.(data.url)
      } else {
        alert(data.error || 'Fayl yuklashda xatolik yuz berdi')
      }
    } catch {
      alert('Fayl yuklashda tarmoq xatoligi')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim())
      setValue('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return
    if (e.keyCode === 229) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t border-border bg-background px-4 py-4">
      {currentImageUrl && (
        <div className="mb-3 mx-auto max-w-2xl relative inline-block">
          <div className="rounded-lg overflow-hidden border border-border bg-card p-1 flex items-center gap-2 pr-8">
            <img src={currentImageUrl} alt="Preview" className="h-10 w-10 object-cover rounded" />
            <span className="text-xs text-muted-foreground">Rasm biriktirildi</span>
            <button
              onClick={() => onSetImageUrl?.(null)}
              className="absolute right-1 top-1 text-muted-foreground hover:text-destructive p-0.5 rounded hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl">
        <div className="flex gap-2 items-end">
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
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            title="Fayl/Rasm yuklash"
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
          </button>

          <div className="relative flex flex-1 items-end rounded-xl border border-border bg-card transition-all focus-within:border-primary/50 focus-within:bg-card">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder="TYNEX AI ga xabar yubor..."
              className="min-h-10 max-h-32 flex-1 resize-none bg-transparent px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
              rows={1}
            />

            <div className="flex gap-1 pr-2 pb-1">
              <button
                onClick={handleMicClick}
                disabled={disabled}
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-50 ${
                  isListening
                    ? 'bg-destructive/20 text-destructive'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                title={isListening ? "Eshitilmoqda... To'xtatish" : "Ovozli kiritish"}
              >
                <Mic className="h-4 w-4" />
              </button>

              <button
                onClick={handleSubmit}
                disabled={disabled || !value.trim()}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Yuborish"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          Shift + Enter = yangi qator • {isListening ? 'Uzbek tilida gapiring...' : 'Yozish yoki gapirish orqali muloqot qiling'}
        </p>
      </div>
    </div>
  )
}
