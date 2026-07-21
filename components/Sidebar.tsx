'use client'

import {
  Plus,
  Search,
  LogOut,
  ChevronDown,
  X,
  Trash2,
  Edit2,
  Check,
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
        className={`fixed left-0 top-0 z-40 h-screen w-64 transform border-r border-border bg-background transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col overflow-hidden`}
      >
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="text-sm font-semibold text-foreground">TYNEX AI</span>
            <button onClick={onClose} className="md:hidden rounded p-1 hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          </div>

          <button
            onClick={onNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Plus className="h-4 w-4" />
            Yangi chat
          </button>
        </div>

        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm outline-none placeholder:text-muted-foreground text-foreground"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          {Object.entries(groupedChats).map(([date, datechats]) =>
            datechats.length > 0 ? (
              <div key={date} className="mb-6">
                <h3 className="mb-2 px-2 text-[10px] font-medium uppercase text-muted-foreground tracking-wider">
                  {date}
                </h3>
                <div className="space-y-1">
                  {datechats.map((chat) => {
                    const isSelected = chat.id === activeChatId
                    const isEditing = chat.id === editingChatId

                    return (
                      <div
                        key={chat.id}
                        onClick={() => !isEditing && onSelectChat(chat.id)}
                        className={`group relative flex items-center justify-between w-full rounded-lg px-3 py-2 text-left text-sm transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary/10 text-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editTitleValue}
                              onChange={(e) => setEditTitleValue(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(e as any, chat.id)}
                              className="w-full bg-card border border-primary/50 rounded px-1.5 py-0.5 text-xs text-foreground outline-none"
                              autoFocus
                            />
                            <button
                              onClick={(e) => handleSaveRename(e, chat.id)}
                              className="text-green-500 p-0.5 hover:bg-muted rounded"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="truncate pr-10" title={chat.title}>
                              {chat.title}
                            </span>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => handleStartRename(e, chat)}
                                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                title="Nomini o'zgartirish"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteClick(e, chat.id)}
                                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-destructive"
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
          {filteredChats.length === 0 && (
            <p className="text-center text-xs text-muted-foreground mt-4">Chatlar topilmadi</p>
          )}
        </div>

        <div className="border-t border-border p-4 space-y-2">
          <div className="flex w-full flex-col gap-2 px-3 py-3 text-xs text-muted-foreground border border-border rounded-lg bg-card">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Limit</span>
              <span className="text-xs text-muted-foreground">3 soatda 25 ta</span>
            </div>
            <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary w-1/3 rounded-full" />
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setExpandedProfile(!expandedProfile)}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center font-medium text-xs uppercase">
                  {user?.name ? user.name.substring(0, 2) : 'US'}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground truncate max-w-[120px]">
                    {user?.name || 'Foydalanuvchi'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  expandedProfile ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedProfile && (
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-border bg-background shadow-lg z-50">
                <button
                  onClick={onLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Chiqish</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
