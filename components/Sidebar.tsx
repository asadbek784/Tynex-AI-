'use client'

import {
  Plus,
  Search,
  LogOut,
  ChevronDown,
  X,
  Trash2,
  Edit3,
  Check,
  MessageSquare,
} from 'lucide-react'
import { useState } from 'react'

interface DBChat {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

interface UserType {
  id: string
  email: string
  name: string
  role: string
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onNewChat: () => void
  onLogout: () => void
  chats: DBChat[]
  activeChatId: string | null
  onSelectChat: (id: string) => void
  onRenameChat: (id: string, newTitle: string) => void
  onDeleteChat: (id: string) => void
  user?: UserType | null
}

export function Sidebar({
  isOpen,
  onClose,
  onNewChat,
  onLogout,
  chats = [],
  activeChatId,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
  user,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedProfile, setExpandedProfile] = useState(false)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitleValue, setEditTitleValue] = useState('')

  const categorizeChats = (chatsList: DBChat[]) => {
    const today: DBChat[] = []
    const yesterday: DBChat[] = []
    const last7Days: DBChat[] = []
    const older: DBChat[] = []

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000)
    const startOf7DaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000)

    chatsList.forEach((chat) => {
      const chatDate = new Date(chat.updatedAt)
      if (chatDate >= startOfToday) today.push(chat)
      else if (chatDate >= startOfYesterday) yesterday.push(chat)
      else if (chatDate >= startOf7DaysAgo) last7Days.push(chat)
      else older.push(chat)
    })

    return {
      Bugun: today,
      Kecha: yesterday,
      'Oxirgi 7 kun': last7Days,
      Oldingi: older,
    }
  }

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const groupedChats = categorizeChats(filteredChats)

  const handleStartRename = (e: React.MouseEvent, chat: DBChat) => {
    e.stopPropagation()
    setEditingChatId(chat.id)
    setEditTitleValue(chat.title)
  }

  const handleSaveRename = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (editTitleValue.trim()) {
      onRenameChat(id, editTitleValue.trim())
    }
    setEditingChatId(null)
  }

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('Ushbu chatni o\'chirishni tasdiqlaysizmi?')) {
      onDeleteChat(id)
    }
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 transform bg-sidebar transition-transform duration-200 ease-linear md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col overflow-hidden`}
      >
        <div className="flex items-center justify-between p-3">
          <button
            onClick={onNewChat}
            className="flex items-center gap-3 rounded-lg border border-sidebar-border px-3 py-2.5 text-sm text-sidebar-foreground hover:bg-muted/30 transition-colors flex-1"
          >
            <Plus className="h-4 w-4" />
            <span>Yangi chat</span>
          </button>
          <button onClick={onClose} className="md:hidden rounded p-2 text-sidebar-foreground hover:bg-muted/30 ml-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-foreground/40" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-transparent pl-9 pr-3 py-2 text-sm outline-none text-sidebar-foreground placeholder:text-sidebar-foreground/40 border border-transparent focus:border-sidebar-border"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1">
          {Object.entries(groupedChats).map(([date, datechats]) =>
            datechats.length > 0 ? (
              <div key={date} className="mb-4">
                <h3 className="px-3 pb-1 text-[11px] font-medium text-sidebar-foreground/40">
                  {date}
                </h3>
                <div className="space-y-0.5">
                  {datechats.map((chat) => {
                    const isSelected = chat.id === activeChatId
                    const isEditing = chat.id === editingChatId

                    return (
                      <div
                        key={chat.id}
                        onClick={() => !isEditing && onSelectChat(chat.id)}
                        className={`group relative flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-muted/50 text-sidebar-foreground'
                            : 'text-sidebar-foreground/70 hover:bg-muted/30 hover:text-sidebar-foreground'
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editTitleValue}
                              onChange={(e) => setEditTitleValue(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(e as any, chat.id)}
                              className="w-full bg-sidebar border border-sidebar-border rounded px-1.5 py-0.5 text-xs text-sidebar-foreground outline-none"
                              autoFocus
                            />
                            <button
                              onClick={(e) => handleSaveRename(e, chat.id)}
                              className="text-sidebar-foreground/60 p-0.5 hover:text-sidebar-foreground"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <MessageSquare className="h-4 w-4 flex-shrink-0 opacity-50" />
                            <span className="truncate flex-1">{chat.title}</span>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button
                                onClick={(e) => handleStartRename(e, chat)}
                                className="p-1 rounded hover:bg-muted/50 text-sidebar-foreground/50 hover:text-sidebar-foreground"
                                title="Nomini o'zgartirish"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteClick(e, chat.id)}
                                className="p-1 rounded hover:bg-muted/50 text-sidebar-foreground/50 hover:text-sidebar-foreground"
                                title="O'chirish"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null
          )}
          {filteredChats.length === 0 && chats.length > 0 && (
            <p className="text-center text-xs text-sidebar-foreground/40 mt-4">Natija topilmadi</p>
          )}
        </div>

        <div className="border-t border-sidebar-border p-3">
          <div className="relative">
            <button
              onClick={() => setExpandedProfile(!expandedProfile)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-sidebar-foreground/70 hover:bg-muted/30 hover:text-sidebar-foreground transition-colors"
            >
              <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center text-xs text-sidebar-foreground/60">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate max-w-[140px]">
                  {user?.name || 'Foydalanuvchi'}
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  expandedProfile ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedProfile && (
              <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-sidebar-border bg-sidebar shadow-lg z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-sidebar-border">
                  <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email || ''}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-muted/30 hover:text-sidebar-foreground transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Chiqish</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
