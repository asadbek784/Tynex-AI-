'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { AuthCard } from '@/components/premium/AuthCard'
import { useGoogleAuth } from '@/lib/hooks/useGoogleAuth'

export default function LoginPage() {
  const router = useRouter()
  const { initializeGoogleAuth, loading: googleLoading } = useGoogleAuth()
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async (email: string, password: string) => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Login failed')
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    initializeGoogleAuth()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 aurora-bg flex items-center justify-center px-4 py-8">
      {/* Aurora Background */}
      <div className="aurora-bg-animated" />

      {/* Grid Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-grid-pattern" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full"
      >
        {/* Animated Background Elements */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          {/* Floating Orbs */}
          <motion.div
            animate={{
              y: [0, -20, 0],
              x: [0, 20, 0],
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              y: [0, 20, 0],
              x: [0, -20, 0],
            }}
            transition={{ duration: 12, repeat: Infinity }}
            className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          />
        </div>

        <div className="flex flex-col items-center justify-center gap-8">
          {/* Logo Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
              TYNEX AI
            </h1>
            <p className="text-gray-400 text-lg">Next Generation Intelligence Platform</p>
          </motion.div>

          {/* Auth Card */}
          <AuthCard
            type="login"
            onGoogleLogin={handleGoogleLogin}
            onEmailSubmit={handleEmailLogin}
            loading={loading || googleLoading}
            error={error}
          />

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md"
          >
            {[
              { icon: '⚡', title: 'Lightning Fast', desc: 'Instant responses' },
              { icon: '🔒', title: 'Secure', desc: 'Enterprise encryption' },
              { icon: '✨', title: 'Premium AI', desc: 'Advanced models' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="glass-effect-sm rounded-lg p-4 text-center border border-white/10"
              >
                <div className="text-2xl mb-2">{feature.icon}</div>
                <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
