'use client'

import { motion } from 'framer-motion'
import { Copy, Check, RotateCcw, Share2, Bookmark } from 'lucide-react'
import { useState } from 'react'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  hasCode?: boolean
  avatar?: string
  timestamp?: Date
  onCopy?: () => void
  onRetry?: () => void
  onShare?: () => void
  onBookmark?: () => void
}

export function ChatMessage({
  role,
  content,
  hasCode,
  avatar,
  timestamp,
  onCopy,
  onRetry,
  onShare,
  onBookmark,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onCopy?.()
  }

  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-4 mb-6 ${isUser ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
        isUser
          ? 'bg-gradient-to-br from-cyan-400 to-purple-500'
          : 'bg-gradient-to-br from-purple-500 to-cyan-400'
      } flex items-center justify-center text-white text-sm font-bold`}>
        {avatar ? avatar[0] : (isUser ? 'U' : 'AI')}
      </div>

      <div className={`flex-1 flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Message Container */}
        <div className={`max-w-2xl rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-cyan-500/10 border-l-2 border-cyan-500' 
            : 'glass-effect border border-white/10'
        }`}>
          {/* Content */}
          <div className="text-sm leading-relaxed text-gray-100 break-words">
            {hasCode && content.includes('```') ? (
              <div className="space-y-3">
                {content.split('```').map((block, i) => (
                  <div key={i}>
                    {i % 2 === 0 ? (
                      <p>{block}</p>
                    ) : (
                      <pre className="bg-black/30 border border-white/10 rounded-lg overflow-x-auto p-3">
                        <code className="text-cyan-400 text-xs font-mono">{block}</code>
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>{content}</p>
            )}
          </div>
        </div>

        {/* Timestamp */}
        {timestamp && (
          <p className="text-xs text-gray-500">
            {timestamp.toLocaleTimeString()}
          </p>
        )}

        {/* Action Buttons */}
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopy}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors"
              title="Copy"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </motion.button>

            {!isUser && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onRetry}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors"
                  title="Retry"
                >
                  <RotateCcw size={16} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onShare}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors"
                  title="Share"
                >
                  <Share2 size={16} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onBookmark}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors"
                  title="Bookmark"
                >
                  <Bookmark size={16} />
                </motion.button>
              </>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
