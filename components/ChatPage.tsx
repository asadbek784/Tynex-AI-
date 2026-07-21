'use client'

import { useState, useRef, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { WelcomeScreen } from './WelcomeScreen'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { AlertCircle, Loader2 } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string | null
}

interface DBChat {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

interface AIModelType {
  id: string
  modelId: string
  displayName: string
}

interface UserType {
  id: string
  email: string
  name: string
  role: string
}

interface ChatPageProps {
  user?: UserType
  onLogout?: () => void
}

export function ChatPage({ user, onLogout }: ChatPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [chats, setChats] = useState<DBChat[]>([])
  const [models, setModels] = useState<AIModelType[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])

  const [bannerText, setBannerText] = useState('')

  const [rateLimited, setRateLimited] = useState(false)
  const [rateLimitMessage, setRateLimitMessage] = useState('')
  const [countdown, setCountdown] = useState<string>('')

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    async function loadInitialData() {
      try {
        const resChats = await fetch('/api/chats')
        const dataChats = await resChats.json()
        if (dataChats.success) setChats(dataChats.chats)

        const resModels = await fetch('/api/models')
        const dataModels = await resModels.json()
        if (dataModels.success && dataModels.models.length > 0) {
          setModels(dataModels.models)
          setSelectedModelId(dataModels.models[0].id)
        }

        const resSettings = await fetch('/api/admin/settings')
        if (resSettings.ok) {
          const dataSettings = await resSettings.json()
          if (dataSettings.success && dataSettings.settings?.banner_message) {
            setBannerText(dataSettings.settings.banner_message)
          }
        }
      } catch {}
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    if (!activeChatId) {
      setMessages([])
      return
    }
    async function loadMessages() {
      try {
        const res = await fetch(`/api/chats/${activeChatId}/messages`)
        const data = await res.json()
        if (data.success) {
          setMessages(
            data.messages.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              imageUrl: m.imageUrl,
            }))
          )
        }
      } catch {}
    }
    loadMessages()
  }, [activeChatId])

  const handleSelectChat = (id: string) => {
    setActiveChatId(id)
    setSidebarOpen(false)
  }

  const handleNewChatClick = () => {
    setActiveChatId(null)
    setMessages([])
    setSidebarOpen(false)
  }

  const handleRenameChat = async (id: string, newTitle: string) => {
    try {
      const res = await fetch(`/api/chats/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      })
      const data = await res.json()
      if (data.success) {
        setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)))
      }
    } catch {}
  }

  const handleDeleteChat = async (id: string) => {
    try {
      const res = await fetch(`/api/chats/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setChats((prev) => prev.filter((c) => c.id !== id))
        if (activeChatId === id) {
          setActiveChatId(null)
          setMessages([])
        }
      }
    } catch {}
  }

  useEffect(() => {
    if (!countdown) return
    const timer = setInterval(() => {
      const resetTime = new Date(countdown).getTime()
      const diff = resetTime - Date.now()
      if (diff <= 0) {
        setRateLimited(false)
        setRateLimitMessage('')
        setCountdown('')
        clearInterval(timer)
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        setRateLimitMessage(`Rate limitga yetdingiz. Iltimos, ${minutes} daqiqa ${seconds} soniya kuting.`)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleStopGenerate = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
    }
  }

  const executeStream = async (historyMessages: Message[], targetChatId: string) => {
    setIsLoading(true)
    abortControllerRef.current = new AbortController()

    const assistantMsgId = 'assistant-streaming-temp'
    setMessages((prev) => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: targetChatId,
          messages: historyMessages.map((m) => ({ role: m.role, content: m.content })),
          modelId: selectedModelId,
          imageUrl: currentImageUrl,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (res.status === 429) {
        const errorData = await res.json()
        setRateLimited(true)
        setCountdown(errorData.resetAt)
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId))
        setIsLoading(false)
        return
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Server xatoligi yuz berdi')
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('Oqim ma\'lumotlari o\'qib bo\'lmadi')

      let accumulatedContent = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunkText = decoder.decode(value, { stream: true })
        const lines = chunkText.split('\n')

        for (const line of lines) {
          const cleanLine = line.trim()
          if (cleanLine.startsWith('data: ') && cleanLine !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(cleanLine.slice(6))
              const content = parsed.choices?.[0]?.delta?.content || ''
              accumulatedContent += content
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
                )
              )
            } catch {}
          }
        }
      }

      const finalMsgId = Date.now().toString()
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMsgId ? { ...m, id: finalMsgId, content: accumulatedContent } : m))
      )

      const resChats = await fetch('/api/chats')
      const dataChats = await resChats.json()
      if (dataChats.success) setChats(dataChats.chats)

      setCurrentImageUrl(null)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: `Xatolik yuz berdi: ${err.message || 'Ulanish xatosi'}` }
              : m
          )
        )
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleSendMessage = async (content: string) => {
    if (rateLimited) return

    let targetChatId = activeChatId
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      imageUrl: currentImageUrl,
    }

    const nextMessages = [...messages, newUserMessage]
    setMessages(nextMessages)

    if (!targetChatId) {
      try {
        const titleStr = content.substring(0, 30) + (content.length > 30 ? '...' : '')
        const res = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: titleStr }),
        })
        const data = await res.json()
        if (data.success && data.chat) {
          targetChatId = data.chat.id
          setActiveChatId(targetChatId)
          setChats((prev) => [data.chat, ...prev])
        } else {
          throw new Error('Chat yaratib bo\'lmadi')
        }
      } catch {
        return
      }
    }

    if (targetChatId) {
      await executeStream(nextMessages, targetChatId)
    }
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!activeChatId) return
    const msgIndex = messages.findIndex((m) => m.id === messageId)
    if (msgIndex === -1) return

    const updatedUserMsg: Message = { ...messages[msgIndex], content: newContent }
    const truncatedHistory = [...messages.slice(0, msgIndex), updatedUserMsg]
    setMessages(truncatedHistory)
    await executeStream(truncatedHistory, activeChatId)
  }

  const handleRegenerateMessage = async () => {
    if (!activeChatId || messages.length < 2) return
    let lastAssistantIdx = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        lastAssistantIdx = i
        break
      }
    }
    if (lastAssistantIdx === -1) return
    const truncatedHistory = messages.slice(0, lastAssistantIdx)
    setMessages(truncatedHistory)
    await executeStream(truncatedHistory, activeChatId)
  }

  const handleRetryMessage = async () => {
    await handleRegenerateMessage()
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChatClick}
        onLogout={onLogout || (() => window.location.reload())}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        user={user}
      />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {bannerText && (
          <div className="bg-card border-b border-border py-1.5 px-4 text-center text-xs text-foreground/60">
            {bannerText}
          </div>
        )}

        <TopBar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onNewChat={handleNewChatClick}
          selectedModelId={selectedModelId}
          onModelChange={setSelectedModelId}
          models={models}
          user={user}
        />

        {rateLimited && (
          <div className="mx-4 mt-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{rateLimitMessage || 'Siz rate limitga kirdingiz.'}</span>
          </div>
        )}

        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto"
        >
          {hasMessages ? (
            <div className="mx-auto max-w-3xl px-4 py-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  id={message.id}
                  role={message.role}
                  content={message.content}
                  imageUrl={message.imageUrl}
                  onCopy={() => {}}
                  onRegenerate={handleRegenerateMessage}
                  onEdit={handleEditMessage}
                  onRetry={handleRetryMessage}
                />
              ))}

              {isLoading && (
                <div className="flex items-center gap-3 py-4 pl-12">
                  <div className="h-6 w-6 rounded-sm bg-primary/20 flex items-center justify-center">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  </div>
                  <span className="text-xs text-foreground/50">Fikrlamoqda...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <WelcomeScreen onSelectSuggestion={handleSendMessage} />
          )}
        </div>

        <div className="relative">
          {isLoading && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10">
              <button
                onClick={handleStopGenerate}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1 text-xs text-foreground/60 hover:text-foreground transition-colors shadow-sm"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                To&apos;xtatish
              </button>
            </div>
          )}

          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading || rateLimited}
            currentImageUrl={currentImageUrl}
            onSetImageUrl={(url) => setCurrentImageUrl(url)}
          />
        </div>
      </div>
    </div>
  )
}
