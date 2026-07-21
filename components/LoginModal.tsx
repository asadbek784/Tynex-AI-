'use client'

import { useState } from 'react'
import { Mail, Lock, User, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react'

interface LoginModalProps {
  onLogin: (user: any) => void
}

export function LoginModal({ onLogin }: LoginModalProps) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showAdminCode, setShowAdminCode] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
      const payload = isRegister
        ? { email, password, name, ...(adminCode ? { adminCode } : {}) }
        : { email, password }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Xatolik yuz berdi')
      onLogin(data.user)
    } catch (err: any) {
      setError(err.message || 'Tarmoq xatoligi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center">
      <div className="text-center mb-8">
        <div className="h-10 w-10 rounded-lg bg-primary mx-auto mb-4 flex items-center justify-center">
          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-foreground">TYNEX AI ga xush kelibsiz</h1>
        <p className="text-sm text-foreground/50 mt-1">
          {isRegister ? 'Yangi hisob yaratish' : 'Tizimga kirish'}
        </p>
      </div>

      {error && (
        <div className="mb-4 w-full rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-3">
        {isRegister && (
          <div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ism"
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-foreground/40 focus:border-primary/50 transition-colors"
            />
          </div>
        )}

        <div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-foreground/40 focus:border-primary/50 transition-colors"
          />
        </div>

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parol"
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 pr-10 text-sm text-foreground outline-none placeholder:text-foreground/40 focus:border-primary/50 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {isRegister && (
          <div>
            {!showAdminCode ? (
              <button
                type="button"
                onClick={() => setShowAdminCode(true)}
                className="text-xs text-foreground/40 hover:text-foreground"
              >
                Admin kodingiz bormi?
              </button>
            ) : (
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Admin kod (ixtiyoriy)"
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-foreground/40 focus:border-primary/50 transition-colors"
              />
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 mt-1 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            isRegister ? "Ro'yxatdan o'tish" : "Tizimga kirish"
          )}
        </button>
      </form>

      <button
        onClick={() => { setIsRegister(!isRegister); setError('') }}
        className="mt-4 text-sm text-foreground/50 hover:text-foreground"
      >
        {isRegister
          ? "Akkauntingiz bormi? Tizimga kiring"
          : "Hisobingiz yo'qmi? Ro'yxatdan o'ting"}
      </button>
    </div>
  )
}
