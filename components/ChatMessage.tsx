'use client'

import { Copy, RotateCcw, Edit2, Check, RefreshCw, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatMessageProps {
  id: string
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string | null
  onCopy?: () => void
  onRegenerate?: () => void
  onEdit?: (id: string, newContent: string) => void
  onRetry?: () => void
}

export function ChatMessage({
  id,
  role,
  content,
  imageUrl,
  onCopy,
  onRegenerate,
  onEdit,
  onRetry,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(content)
  const [showActions, setShowActions] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onCopy?.()
  }

  const handleSaveEdit = () => {
    if (editValue.trim() && editValue.trim() !== content) {
      onEdit?.(id, editValue.trim())
    }
    setIsEditing(false)
  }

  const isUser = role === 'user'

  return (
    <div
      className={`group relative py-3 ${isUser ? 'pl-12' : 'pr-12'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isUser && (
        <div className="flex items-center gap-2 mb-1">
          <div className="h-6 w-6 rounded-sm bg-primary flex items-center justify-center">
            <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="text-xs font-semibold text-foreground">TYNEX AI</span>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full min-h-20 rounded-lg border border-border bg-card p-2 text-sm text-foreground outline-none focus:border-primary/50"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 rounded text-xs text-foreground/60 hover:text-foreground border border-border"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-3 py-1 rounded text-xs bg-primary text-white font-medium"
            >
              Saqlash
            </button>
          </div>
        </div>
      ) : (
        <div className={`text-sm leading-7 ${isUser ? 'text-foreground' : 'text-foreground'}`}>
          {imageUrl && (
            <div className="mb-2 max-w-xs rounded-lg overflow-hidden border border-border">
              <img src={imageUrl} alt="Uploaded" className="w-full h-auto object-cover max-h-48" />
            </div>
          )}
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="prose prose-invert max-w-none prose-sm prose-p:leading-7 prose-pre:bg-transparent prose-pre:p-0 prose-code:text-foreground prose-code:bg-muted/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const codeString = String(children).replace(/\n$/, '')
                    return match ? (
                      <div className="my-3 rounded-lg border border-border bg-[#1E1E2E] overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-[#2A2A3E] border-b border-border">
                          <span className="text-xs text-foreground/50">{match[1]}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(codeString)}
                            className="text-xs text-foreground/50 hover:text-foreground transition-colors"
                          >
                            {copied ? 'Nusxa olindi' : 'Nusxa ol'}
                          </button>
                        </div>
                        <pre className="p-4 overflow-x-auto m-0">
                          <code className="text-sm text-foreground/90">{codeString}</code>
                        </pre>
                      </div>
                    ) : (
                      <code className="bg-muted/50 px-1.5 py-0.5 rounded text-sm text-foreground" {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}

      <div
        className={`absolute top-2 flex gap-0.5 transition-opacity ${
          isUser ? 'right-0' : 'left-0 -ml-10'
        } ${showActions ? 'opacity-100' : 'opacity-0'}`}
      >
        {!isUser && (
          <>
            <button
              onClick={handleCopy}
              className="p-1 rounded text-foreground/40 hover:text-foreground hover:bg-muted/50"
              title="Nusxa ol"
            >
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </button>
            <button
              onClick={onRegenerate}
              className="p-1 rounded text-foreground/40 hover:text-foreground hover:bg-muted/50"
              title="Qayta yaratish"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            {onRetry && (
              <button
                onClick={onRetry}
                className="p-1 rounded text-foreground/40 hover:text-foreground hover:bg-muted/50"
                title="Qayta urinish"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </>
        )}
        {isUser && onEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 rounded text-foreground/40 hover:text-foreground hover:bg-muted/50"
            title="Tahrirlash"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
