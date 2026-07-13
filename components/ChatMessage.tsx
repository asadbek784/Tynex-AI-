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
      {/* Avatar */}
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#00D4FF] to-cyan-500 text-background">
          <span className="text-xs font-bold">AI</span>
        </div>
      )}

      {/* Message Box */}
      <div
        className={`flex max-w-xl flex-col gap-2 ${
          isUser
            ? 'items-end rounded-2xl rounded-tr-none bg-[#00D4FF]/15 px-4 py-2.5 text-foreground'
            : 'items-start w-full'
        }`}
      >
        {/* User image attachment if present */}
        {imageUrl && (
          <div className="mb-2 max-w-xs rounded-lg overflow-hidden border border-border bg-card">
            <img src={imageUrl} alt="Uploaded attachment" className="w-full h-auto object-cover max-h-48" />
          </div>
        )}

        {/* Content */}
        {isEditing ? (
          <div className="w-full space-y-2 min-w-[280px]">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full min-h-20 rounded-lg border border-border bg-muted/30 p-2 text-sm text-white outline-none focus:border-[#00D4FF]/50"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="px-2 py-1 rounded text-xs border border-border text-[#94A3B8] hover:text-white"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-2 py-1 rounded text-xs bg-[#00D4FF] text-background font-semibold"
              >
                Saqlash
              </button>
            </div>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none text-sm leading-relaxed break-words text-slate-100 markdown-content">
            {isUser ? (
              <p className="whitespace-pre-wrap">{content}</p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Syntax highlighted custom code block with Copy code button
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const codeString = String(children).replace(/\n$/, '')
                    return match ? (
                      <div className="my-3 w-full rounded-lg border border-border bg-muted/40 font-mono text-xs overflow-hidden">
                        <div className="flex items-center justify-between bg-card/60 px-3 py-1.5 border-b border-border">
                          <span className="text-[#00D4FF] font-semibold text-[10px] uppercase">{match[1]}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(codeString)
                            }}
                            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-muted-foreground hover:bg-muted/50 hover:text-[#00D4FF] transition-colors text-[10px]"
                          >
                            <Copy className="h-2.5 w-2.5" />
                            Nusxa ol
                          </button>
                        </div>
                        <pre className="p-3 overflow-x-auto text-cyan-300 bg-transparent m-0">
                          <code>{codeString}</code>
                        </pre>
                      </div>
                    ) : (
                      <code className="bg-muted px-1 py-0.5 rounded text-cyan-300 font-mono text-xs" {...props}>
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
        <div className="mt-1 h-8 w-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-secondary to-slate-600 flex items-center justify-center font-bold text-xs uppercase text-background">
          US
        </div>
      )}

      {/* Actions (Floating on hover) */}
      <div className={`absolute bottom-0 ${isUser ? 'left-0' : 'right-0'} flex gap-1.5 opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-md`}>
        {!isUser && (
          <>
            <button
              onClick={handleCopy}
              className="rounded p-1 text-muted-foreground hover:bg-muted/50 hover:text-[#00D4FF] transition-colors"
              title="Nusxa ol"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={onRegenerate}
              className="rounded p-1 text-muted-foreground hover:bg-muted/50 hover:text-[#00D4FF] transition-colors"
              title="Qayta yaratish"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            {onRetry && (
              <button
                onClick={onRetry}
                className="rounded p-1 text-muted-foreground hover:bg-muted/50 hover:text-[#00D4FF] transition-colors"
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
            className="rounded p-1 text-muted-foreground hover:bg-muted/50 hover:text-[#00D4FF] transition-colors"
            title="Tahrirlash"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
