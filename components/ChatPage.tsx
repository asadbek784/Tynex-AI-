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
  // Navigation & Layout
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Data lists
  const [chats, setChats] = useState<DBChat[]>([])
  const [models, setModels] = useState<AIModelType[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])

  // Global announcements
  const [bannerText, setBannerText] = useState('')

  // Rate Limiting countdown state
  const [rateLimited, setRateLimited] = useState(false)
  const [rateLimitMessage, setRateLimitMessage] = useState('')
  const [countdown, setCountdown] = useState<string>('')

  // Uploaded image state (passed down to ChatInput)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)

  // Abort control for "Stop Generate"
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Initial load: active models, chats list, and settings (for banner text)
  useEffect(() => {
    async function loadInitialData() {
      try {
        // Fetch chats
        const resChats = await fetch('/api/chats')
        const dataChats = await resChats.json()
        if (dataChats.success) setChats(dataChats.chats)

        // Fetch active models
        const resModels = await fetch('/api/models')
        const dataModels = await resModels.json()
        if (dataModels.success && dataModels.models.length > 0) {
          setModels(dataModels.models)
          setSelectedModelId(dataModels.models[0].id)
        }

        // Fetch settings (banner_message)
        const resSettings = await fetch('/api/admin/settings')
        if (resSettings.ok) {
          const dataSettings = await resSettings.json()
          if (dataSettings.success && dataSettings.settings?.banner_message) {
            setBannerText(dataSettings.settings.banner_message)
          }
        }
      } catch (error) {
        console.error('Error loading initial chat data:', error)
      }
    }
    loadInitialData()
  }, [])

  // Load messages whenever activeChatId changes
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
      } catch (error) {
        console.error('Failed to load messages:', error)
      }
    }
    loadMessages()
  }, [activeChatId])

  // Handlers for Chat listing CRUD
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
    } catch (error) {
      console.error('Failed to rename chat:', error)
    }
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
    } catch (error) {
      console.error('Failed to delete chat:', error)
    }
  }

  // Countdown timer for rate limiting
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

  // Stop current streaming generation
  const handleStopGenerate = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
    }
  }

  // Unified stream completion handler
  const executeStream = async (historyMessages: Message[], targetChatId: string) => {
    setIsLoading(true)
    abortControllerRef.current = new AbortController()

    // Add assistant placeholder message
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

      // Handle Rate Limit error (429)
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

      // Read SSE stream chunk by chunk
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

              // Incremental UI text update
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
                )
              )
            } catch (e) {
              // Ignore incomplete JSON stream chunk parsing
            }
          }
        }
      }

      // Convert temp id to permanent id upon successful stream complete
      const finalMsgId = Date.now().toString()
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMsgId ? { ...m, id: finalMsgId, content: accumulatedContent } : m))
      )

      // Refresh chats sidebar list in case updated date or creation changes order
      const resChats = await fetch('/api/chats')
      const dataChats = await resChats.json()
      if (dataChats.success) setChats(dataChats.chats)

      // Clear image attachment state once successfully sent
      setCurrentImageUrl(null)

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Generation stopped by user')
      } else {
        console.error('Generation failed:', err)
        // Set error message under the streaming assistant message or alert
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

  // Handle user sending a new message
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

    // 1. If activeChatId is null, create a new chat first!
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
          // Add newly created chat to sidebar list immediately
          setChats((prev) => [data.chat, ...prev])
        } else {
          throw new Error('Chat yaratib bo\'lmadi')
        }
      } catch (err: any) {
        console.error('Failed to auto-create chat:', err)
        return
      }
    }

    // 2. Execute AI Stream completions
    if (targetChatId) {
      await executeStream(nextMessages, targetChatId)
    }
  }

  // MESSAGE ACTIONS: EDIT
  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!activeChatId) return

    // Find message index to slice the conversation history up to the edited message
    const msgIndex = messages.findIndex((m) => m.id === messageId)
    if (msgIndex === -1) return

    // Replace the user message and remove everything after it
    const updatedUserMsg: Message = { ...messages[msgIndex], content: newContent }
    const truncatedHistory = [...messages.slice(0, msgIndex), updatedUserMsg]
    setMessages(truncatedHistory)

    // Fire generation stream
    await executeStream(truncatedHistory, activeChatId)
  }

  // MESSAGE ACTIONS: REGENERATE
  const handleRegenerateMessage = async () => {
    if (!activeChatId || messages.length < 2) return

    // Slice to the last assistant message (remove it and everything after)
    // Find the last assistant message index
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

    // Fire generation stream
    await executeStream(truncatedHistory, activeChatId)
  }

  // MESSAGE ACTIONS: RETRY
  const handleRetryMessage = async () => {
    // Simply fire the regenerate logic
    await handleRegenerateMessage()
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0F19]">
      {/* Sidebar */}
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

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Banner announcement if present */}
        {bannerText && (
          <div className="bg-gradient-to-r from-cyan-600 to-blue-700 py-1.5 px-4 text-center text-xs font-semibold text-white tracking-wide shadow z-20">
            E&apos;lon: {bannerText}
          </div>
        )}

        {/* Top bar */}
        <TopBar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onNewChat={handleNewChatClick}
          selectedModelId={selectedModelId}
          onModelChange={setSelectedModelId}
          models={models}
          user={user}
        />

        {/* Rate limit banner alert */}
        {rateLimited && (
          <div className="mx-4 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <span>{rateLimitMessage || 'Siz rate limitga kirdingiz.'}</span>
          </div>
        )}

        {/* Messages area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6 md:px-8 bg-gradient-to-b from-[#0B0F19] to-[#0d1321]"
        >
          {hasMessages ? (
            <div className="mx-auto max-w-2xl space-y-4">
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
                <div className="flex justify-start items-center gap-3 py-3">
                  {/* Floating Thinking indicator */}
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00D4FF] to-cyan-500 text-background">
                    <Loader2 className="h-4 w-4 animate-spin text-background" />
                  </div>
                  <span className="text-xs text-[#94A3B8] font-semibold animate-pulse">TYNEX AI fikrlamoqda...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <WelcomeScreen onSelectSuggestion={handleSendMessage} />
          )}
        </div>

        {/* Input area */}
        <div className="relative">
          {/* Stop Generate Button overlay */}
          {isLoading && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10">
              <button
                onClick={handleStopGenerate}
                className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 active:scale-95 transition-all shadow-lg"
              >
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                Generatsiyani to&apos;xtatish
              </button>
            </div>
          )}

          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading || rateLimited}
            currentImageUrl={currentImageUrl}
            onSetImageUrl={setImageUrlPropsHelper => setCurrentImageUrl(setImageUrlPropsHelper)}
          />
        </div>
      </div>
    </div>
  )
}
