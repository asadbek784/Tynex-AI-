'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Plus, Folder, MessageSquare, Search, Settings, LogOut, Menu, X } from 'lucide-react'

export interface SidebarItem {
  id: string
  title: string
  icon: React.ReactNode
  href: string
  active?: boolean
  count?: number
}

interface SidebarProps {
  items?: SidebarItem[]
  onNewChat?: () => void
  onLogout?: () => void
  userEmail?: string
  isOpen?: boolean
  onToggle?: (open: boolean) => void
}

export function Sidebar({
  items = [],
  onNewChat,
  onLogout,
  userEmail = 'user@example.com',
  isOpen = true,
  onToggle,
}: SidebarProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => onToggle?.(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 glass-effect p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 20 }}
            className="lg:static fixed left-0 top-0 h-screen w-64 glass-effect-lg border-r border-white/10 flex flex-col z-40 lg:z-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                TYNEX AI
              </h1>
              <p className="text-xs text-gray-400 mt-1">Premium AI Workspace</p>
            </div>

            {/* New Chat Button */}
            <div className="p-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onNewChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-medium text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
              >
                <Plus size={18} />
                New Chat
              </motion.button>
            </div>

            {/* Search */}
            <div className="px-4 pb-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                />
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto px-3 space-y-2">
              {items.map((item) => (
                <motion.div key={item.id} whileHover={{ x: 4 }}>
                  <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    item.active
                      ? 'bg-white/10 text-cyan-400'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}>
                    {item.icon}
                    <span className="flex-1 text-left text-sm truncate">{item.title}</span>
                    {item.count && (
                      <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                        {item.count}
                      </span>
                    )}
                  </button>
                </motion.div>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 space-y-2">
              <motion.button
                whileHover={{ x: 4 }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all text-sm"
              >
                <Settings size={16} />
                Settings
              </motion.button>
              <motion.button
                whileHover={{ x: 4 }}
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/5 transition-all text-sm"
              >
                <LogOut size={16} />
                Logout
              </motion.button>

              {/* User Info */}
              <div className="pt-2 px-3">
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onToggle?.(false)}
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
        />
      )}
    </>
  )
}
