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
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
        </div>
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
