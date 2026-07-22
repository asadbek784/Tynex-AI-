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
      className={`group relative py-6 px-4 border-b border-border ${
        isUser ? 'bg-background' : 'bg-muted/40'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="max-w-3xl mx-auto flex gap-4">
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="h-7 w-7 bg-foreground text-background flex items-center justify-center text-xs font-medium rounded-none">
              Siz
            </div>
          ) : (
            <div className="h-7 w-7 bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium rounded-none">
              AI
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2 overflow-hidden">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full min-h-20 rounded-none border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-foreground"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 rounded-none text-xs text-foreground/70 hover:text-foreground border border-border bg-background"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 rounded-none text-xs bg-primary text-primary-foreground font-medium"
                >
                  Saqlash
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm leading-7 text-foreground">
              {imageUrl && (
                <div className="mb-2 max-w-xs rounded-none overflow-hidden border border-border">
                  <img src={imageUrl} alt="Uploaded" className="w-full h-auto object-cover max-h-48" />
                </div>
              )}
              {isUser ? (
                <p className="whitespace-pre-wrap">{content}</p>
              ) : (
                <div className="prose max-w-none prose-sm prose-p:leading-7 prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-none prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded-none prose-code:before:content-none prose-code:after:content-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        const codeString = String(children).replace(/\n$/, '')
                        return match ? (
                          <div className="my-3 rounded-none border border-border bg-muted overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2 bg-background border-b border-border">
                              <span className="text-xs text-foreground/60 font-mono">{match[1]}</span>
                              <button
                                onClick={() => navigator.clipboard.writeText(codeString)}
                                className="text-xs text-foreground/60 hover:text-foreground transition-colors"
                              >
                                {copied ? 'Nusxa olindi' : 'Nusxa ol'}
                              </button>
                            </div>
                            <pre className="p-4 overflow-x-auto m-0 bg-muted">
                              <code className="text-sm text-foreground">{codeString}</code>
                            </pre>
                          </div>
                        ) : (
                          <code className="bg-muted px-1.5 py-0.5 rounded-none text-sm text-foreground font-mono" {...props}>
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
        </div>

        <div
          className={`flex gap-1 items-start transition-opacity ${
            showActions ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {!isUser && (
            <>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-none text-foreground/55 hover:text-foreground hover:bg-border/40"
                title="Nusxa ol"
              >
                {copied ? <Check className="h-4 w-4 text-foreground" /> : <Copy className="h-4 w-4" />}
              </button>
              <button
                onClick={onRegenerate}
                className="p-1.5 rounded-none text-foreground/55 hover:text-foreground hover:bg-border/40"
                title="Qayta yaratish"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </>
          )}
          {isUser && onEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-none text-foreground/55 hover:text-foreground hover:bg-border/40"
              title="Tahrirlash"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
