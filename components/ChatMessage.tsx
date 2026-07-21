'use client'

import { Copy, RotateCcw, Edit2, Check, RefreshCw } from 'lucide-react'
import { useState } from 'react'
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
    <div className={`flex gap-4 py-4 ${isUser ? 'justify-end' : 'justify-start'} group/msg relative`}>
      {/* AI Avatar */}
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-medium text-primary">
          AI
        </div>
      )}

      {/* Message Box */}
      <div
        className={`flex max-w-xl flex-col gap-2 ${
          isUser
            ? 'rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-primary-foreground'
            : 'items-start w-full'
        }`}
      >
        {imageUrl && (
          <div className="mb-2 max-w-xs rounded-lg overflow-hidden border border-border">
            <img src={imageUrl} alt="Uploaded attachment" className="w-full h-auto object-cover max-h-48" />
          </div>
        )}

        {isEditing ? (
          <div className="w-full space-y-2 min-w-[280px]">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full min-h-20 rounded-lg border border-border bg-muted/30 p-2 text-sm text-foreground outline-none focus:border-primary/50"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="px-2 py-1 rounded text-xs border border-border text-muted-foreground hover:text-foreground"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-2 py-1 rounded text-xs bg-primary text-primary-foreground font-medium"
              >
                Saqlash
              </button>
            </div>
          </div>
        ) : (
          <div className={`prose prose-invert max-w-none text-sm leading-relaxed break-words ${isUser ? 'text-primary-foreground' : 'text-foreground'} markdown-content`}>
            {isUser ? (
              <p className="whitespace-pre-wrap">{content}</p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const codeString = String(children).replace(/\n$/, '')
                    return match ? (
                      <div className="my-3 w-full rounded-lg border border-border bg-card font-mono text-xs overflow-hidden">
                        <div className="flex items-center justify-between bg-muted px-3 py-2 border-b border-border">
                          <span className="text-muted-foreground font-medium text-[10px] uppercase tracking-wide">{match[1]}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(codeString)
                            }}
                            className="flex items-center gap-1 rounded px-2 py-0.5 text-muted-foreground hover:text-foreground transition-all text-[10px]"
                          >
                            <Copy className="h-2.5 w-2.5" />
                            Nusxa ol
                          </button>
                        </div>
                        <pre className="p-3 overflow-x-auto bg-card m-0">
                          <code className="text-foreground">{codeString}</code>
                        </pre>
                      </div>
                    ) : (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs border border-border" {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {content}
              </ReactMarkdown>
            )}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="mt-1 h-8 w-8 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center font-medium text-xs text-muted-foreground">
          US
        </div>
      )}

      {/* Actions */}
      <div className={`absolute bottom-0 ${isUser ? 'left-0' : 'right-0'} flex gap-1 opacity-0 group-hover/msg:opacity-100 transition-all p-1 bg-card border border-border rounded-lg`}>
        {!isUser && (
          <>
            <button
              onClick={handleCopy}
              className="rounded p-1 text-muted-foreground hover:text-foreground"
              title="Nusxa ol"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={onRegenerate}
              className="rounded p-1 text-muted-foreground hover:text-foreground"
              title="Qayta yaratish"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            {onRetry && (
              <button
                onClick={onRetry}
                className="rounded p-1 text-muted-foreground hover:text-foreground"
                title="Qayta urinish"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        )}

        {isUser && onEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
            title="Tahrirlash"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
