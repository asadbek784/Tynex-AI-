'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from '@/components/premium/Sidebar'
import { ChatMessage } from '@/components/premium/ChatMessage'
import { PromptComposer } from '@/components/premium/PromptComposer'
import { MessageSquare, Folder, Star, Clock } from 'lucide-react'

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string }>>([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to TYNEX AI! 🚀 I\'m your premium AI assistant. How can I help you today?',
    },
  ])
  const [loading, setLoading] = useState(false)

  const sidebarItems = [
    { id: '1', title: 'Today\'s Chats', icon: <Clock size={18} />, href: '#', count: 3 },
    { id: '2', title: 'Saved Items', icon: <Star size={18} />, href: '#', count: 12 },
    { id: '3', title: 'Projects', icon: <Folder size={18} />, href: '#', active: true },
  ]

  const handleSendMessage = async (message: string) => {
    // Add user message
    const userId = Date.now().toString()
    setMessages((prev) => [...prev, { id: userId, role: 'user', content: message }])
    setLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Add AI response
    const responses = [
      'That\'s a great question! Let me help you with that.',
      'I can definitely assist you with that. Here\'s what I think...',
      'Interesting! Here\'s my perspective on this topic.',
    ]

    const randomResponse = responses[Math.floor(Math.random() * responses.length)]
    const aiId = (Date.now() + 1).toString()
    setMessages((prev) => [...prev, { id: aiId, role: 'assistant', content: randomResponse }])
    setLoading(false)
  }

  const handleNewChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Starting a new conversation. What would you like to discuss?',
      },
    ])
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 aurora-bg">
      {/* Aurora Background */}
      <div className="aurora-bg-animated" />

      {/* Sidebar */}
      <Sidebar
        items={sidebarItems}
        onNewChat={handleNewChat}
        userEmail="user@tynex.ai"
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10">
        {/* Top Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect-sm border-b border-white/10 px-6 py-4"
        >
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Project Discussion</h1>
            <button className="px-4 py-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-sm">
              Share
            </button>
          </div>
        </motion.div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto w-full"
          >
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                timestamp={new Date()}
                hasCode={msg.content.includes('```')}
                onCopy={() => {}}
                onRetry={() => {}}
                onShare={() => {}}
                onBookmark={() => {}}
              />
            ))}

            {/* Loading Indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white text-sm font-bold">
                  AI
                </div>
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 bg-cyan-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-cyan-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-cyan-400 rounded-full"
                  />
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto w-full px-6 pb-8"
        >
          <PromptComposer
            onSubmit={handleSendMessage}
            loading={loading}
            placeholder="Ask me anything about your project..."
          />
        </motion.div>
      </main>
    </div>
  )
}
