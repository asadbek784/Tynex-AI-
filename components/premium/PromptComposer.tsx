'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, Paperclip, Mic, Plus, Sparkles } from 'lucide-react'

interface PromptComposerProps {
  onSubmit: (message: string) => void
  onAttach?: (files: File[]) => void
  loading?: boolean
  placeholder?: string
  maxHeight?: string
}

export function PromptComposer({
  onSubmit,
  onAttach,
  loading = false,
  placeholder = 'Ask anything...',
  maxHeight = 'max-h-40',
}: PromptComposerProps) {
  const [message, setMessage] = useState('')
  const [rows, setRows] = useState(1)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target
    setMessage(target.value)

    // Auto-grow textarea
    target.style.height = 'auto'
    const newRows = Math.min(Math.max(1, Math.ceil(target.scrollHeight / 24)), 5)
    setRows(newRows)
    target.style.height = `${target.scrollHeight}px`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !loading) {
      onSubmit(message)
      setMessage('')
      setRows(1)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onAttach?.(Array.from(e.target.files))
    }
  }

  return (
    <div className="w-full glass-effect-lg rounded-2xl p-4 border border-white/10">
      {/* AI Suggestions */}
      <div className="mb-4 flex gap-2 flex-wrap hidden md:flex">
        {['Analyze', 'Brainstorm', 'Explain', 'Create'].map((suggestion) => (
          <motion.button
            key={suggestion}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMessage(suggestion + ': ')}
            className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-cyan-400 rounded-full transition-all border border-white/10"
          >
            {suggestion}
          </motion.button>
        ))}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={rows}
            className={`w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none border-b border-white/10 pb-2 focus:border-cyan-500 transition-colors ${maxHeight}`}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors"
              title="Attach file"
            >
              <Paperclip size={18} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => {
                // Voice input handler
              }}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors"
              title="Voice input"
            >
              <Mic size={18} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => {
                // AI suggestions handler
              }}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-purple-400 transition-colors"
              title="AI suggestions"
            >
              <Sparkles size={18} />
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading || !message.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Send
                <Send size={16} />
              </>
            )}
          </motion.button>
        </div>
      </form>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,.pdf,.txt,.doc,.docx"
      />

      {/* Character Counter */}
      <div className="text-xs text-gray-500 mt-2">
        {message.length} characters
      </div>
    </div>
  )
}
