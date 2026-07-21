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
      } catch {
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
    } catch {}
  }

  if (checkingAuth) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-foreground/40" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <LoginModal onLogin={handleLoginSuccess} />
      </div>
    )
  }

  return <ChatPage user={user} onLogout={handleLogout} />
}
