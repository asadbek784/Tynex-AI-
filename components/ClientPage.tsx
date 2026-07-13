'use client'

import { useState, useEffect } from 'react'
import { LoginModal } from './LoginModal'
import { ChatPage } from './ChatPage'
import { Loader2 } from 'lucide-react'

export interface UserType {
  id: string
  email: string
  name: string
  role: string
}

export function ClientPage() {
  const [user, setUser] = useState<UserType | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            setUser(data.user)
          }
        }
      } catch (error) {
        // console.error('Failed to check auth:', error)
      } finally {
        setCheckingAuth(false)
      }
    }
    checkAuth()
  }, [])

  const handleLoginSuccess = (loggedInUser: UserType) => {
    setUser(loggedInUser)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
    } catch (error) {
      // console.error('Failed to log out:', error)
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0B0F19]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#00D4FF]" />
          <p className="text-sm font-semibold text-[#94A3B8]">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="relative flex h-screen items-center justify-center overflow-hidden bg-[#0B0F19]">
        {/* Blurred chat background */}
        <div className="absolute inset-0 opacity-20 blur-3xl">
          <div className="absolute top-20 right-20 h-96 w-96 rounded-full bg-[#00D4FF]/30 blur-3xl" />
          <div className="absolute bottom-20 left-20 h-96 w-96 rounded-full bg-[#00D4FF]/20 blur-3xl" />
        </div>

        {/* Login modal */}
        <LoginModal onLogin={handleLoginSuccess} />
      </div>
    )
  }

  return <ChatPage user={user} onLogout={handleLogout} />
}
