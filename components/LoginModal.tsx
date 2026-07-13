'use client'

import { useState } from 'react'
import { Zap, Mail, Lock, User, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F19]/80 backdrop-blur-xl p-4">
      <div className="animate-fade-in relative flex w-full max-w-md flex-col items-center rounded-2xl border border-border bg-card/40 p-8 shadow-2xl backdrop-blur-xl">
        {/* Logo */}
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#00D4FF] to-cyan-500">
          <Zap className="h-7 w-7 text-background" strokeWidth={3} />
        </div>

        {/* Title */}
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-white">TYNEX AI</h1>
        <p className="mb-6 text-[#94A3B8] text-sm">
          {isRegister ? 'Yangi hisob yaratish' : 'Xush kelibsiz premium AI chatga'}
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-4 w-full rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-left text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {isRegister && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#94A3B8] flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-[#00D4FF]" /> Ism
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ismingizni kiriting"
                className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-white outline-none placeholder:text-muted-foreground focus:border-[#00D4FF]/50 focus:shadow-lg focus:shadow-[#00D4FF]/10 transition-all"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#94A3B8] flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-[#00D4FF]" /> Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@domain.com"
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-white outline-none placeholder:text-muted-foreground focus:border-[#00D4FF]/50 focus:shadow-lg focus:shadow-[#00D4FF]/10 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#94A3B8] flex items-center gap-1">
              <Lock className="h-3.5 w-3.5 text-[#00D4FF]" /> Parol
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 pr-10 text-sm text-white outline-none placeholder:text-muted-foreground focus:border-[#00D4FF]/50 focus:shadow-lg focus:shadow-[#00D4FF]/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#00D4FF] transition-colors p-0.5"
                title={showPassword ? 'Parolni berkitish' : 'Parolni ko\'rish'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {isRegister && (
            <div className="text-left">
              {!showAdminCode ? (
                <button
                  type="button"
                  onClick={() => setShowAdminCode(true)}
                  className="text-[10px] text-muted-foreground hover:text-[#94A3B8] transition-colors"
                >
                  Admin kodingiz bormi?
                </button>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#94A3B8] flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#00D4FF]" /> Admin kod (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="6 xonali kod"
                    className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-white outline-none placeholder:text-muted-foreground focus:border-[#00D4FF]/50 focus:shadow-lg focus:shadow-[#00D4FF]/10 transition-all"
                  />
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-lg bg-[#00D4FF] py-2.5 font-semibold text-background transition-all duration-300 hover:shadow-lg hover:shadow-[#00D4FF]/50 active:scale-95 disabled:opacity-50 disabled:scale-100 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-background" />
            ) : (
              isRegister ? "Ro'yxatdan o'tish" : "Tizimga kirish"
            )}
          </button>
        </form>

        {/* Toggle Switch */}
        <button
          onClick={() => {
            setIsRegister(!isRegister)
            setError('')
          }}
          className="mt-5 text-xs text-[#00D4FF] hover:underline"
        >
          {isRegister
            ? "Akkauntingiz bormi? Tizimga kiring"
            : "Hali ro'yxatdan o'tmaganmisiz? Ro'yxatdan o'ting"}
        </button>

        {/* Footer text */}
        <p className="mt-6 text-xs text-muted-foreground">
          Kirish orqali siz{' '}
          <span className="text-[#00D4FF]">Foydalanish shartlari</span>ga rozilik bildirasiz
        </p>
      </div>
    </div>
  )
}
