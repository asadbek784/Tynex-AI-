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

      if (!response.ok) {
        throw new Error(data.error || 'Xatolik yuz berdi')
      }

      onLogin(data.user)
    } catch (err: any) {
      setError(err.message || 'Tarmoq xatoligi yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center rounded-xl border border-border bg-card p-8">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-foreground">TYNEX AI</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isRegister ? 'Yangi hisob yaratish' : 'Xush kelibsiz'}
        </p>
      </div>

      {error && (
        <div className="mb-4 w-full rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-left text-xs text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {isRegister && (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> Ism
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ismingizni kiriting"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 transition-all"
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" /> Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@domain.com"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="h-3.5 w-3.5" /> Parol
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
              title={showPassword ? 'Parolni berkitish' : 'Parolni ko\'rish'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {isRegister && (
          <div className="text-left">
            {!showAdminCode ? (
              <button
                type="button"
                onClick={() => setShowAdminCode(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Admin kodingiz bormi?
              </button>
            ) : (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Admin kod (ixtiyoriy)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6 xonali kod"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 transition-all"
                />
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group relative w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 mt-2 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            isRegister ? "Ro'yxatdan o'tish" : "Tizimga kirish"
          )}
        </button>
      </form>

      <button
        onClick={() => {
          setIsRegister(!isRegister)
          setError('')
        }}
        className="mt-5 text-xs text-primary hover:underline"
      >
        {isRegister
          ? "Akkauntingiz bormi? Tizimga kiring"
          : "Hali ro'yxatdan o'tmaganmisiz? Ro'yxatdan o'ting"}
      </button>

      <p className="mt-6 text-xs text-muted-foreground">
        Kirish orqali siz{' '}
        <span className="text-primary">Foydalanish shartlari</span>ga rozilik bildirasiz
      </p>
    </div>
  )
}
