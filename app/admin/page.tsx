'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Cpu,
  Settings as SettingsIcon,
  BarChart3,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Check,
  X,
  Edit2,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
} from 'lucide-react'

type TabType = 'stats' | 'users' | 'providers' | 'models' | 'settings' | 'errors'

interface User {
  id: string
  name: string
  email: string
  role: string
  banned: boolean
  createdAt: string
}

interface Provider {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  models?: Model[]
  needsMigration?: boolean
}

interface Model {
  id: string
  providerId: string
  modelId: string
  displayName: string
  active: boolean
  priority: number
  provider?: { name: string }
}

interface Stats {
  userCount: number
  chatCount: number
  messageCount: number
  totalTokens: number
  chartData: { date: string; count: number }[]
  modelStats: { modelName: string; count: number; tokens: number }[]
  recentLogs: any[]
  errorLogs: any[]
}

export default function AdminPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('stats')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Data states
  const [users, setUsers] = useState<User[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [rateLimitCount, setRateLimitCount] = useState('25')
  const [rateLimitHours, setRateLimitHours] = useState('3')
  const [bannerMessage, setBannerMessage] = useState('')

  // Search states
  const [userSearch, setUserSearch] = useState('')

  // Form modals / toggle states
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [newProvider, setNewProvider] = useState({ name: '', baseUrl: '', apiKey: '' })
  const [showAddProvider, setShowAddProvider] = useState(false)
  const [showNewProviderApiKey, setShowNewProviderApiKey] = useState(false)
  const [showEditProviderApiKey, setShowEditProviderApiKey] = useState(false)

  const [editingModel, setEditingModel] = useState<Model | null>(null)
  const [newModel, setNewModel] = useState({ providerId: '', modelId: '', displayName: '', priority: 1, active: true })
  const [showAddModel, setShowAddModel] = useState(false)

  // Verify Admin user on load
  useEffect(() => {
    async function verifyAdmin() {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) {
          router.push('/')
          return
        }
        const data = await res.json()
        if (data.user?.role !== 'admin') {
          router.push('/')
          return
        }
        setIsAdmin(true)
      } catch (err) {
        router.push('/')
      } finally {
        setCheckingAdmin(false)
      }
    }
    verifyAdmin()
  }, [router])

  // Load active tab data
  useEffect(() => {
    if (isAdmin) {
      fetchTabData()
    }
  }, [activeTab, isAdmin])

  const fetchTabData = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (activeTab === 'stats') {
        const res = await fetch('/api/admin/stats')
        const data = await res.json()
        if (data.success) {
          setStats(data.stats)
        } else {
          setError(data.error)
        }
      } else if (activeTab === 'users') {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}`)
        const data = await res.json()
        if (data.success) {
          setUsers(data.users)
        } else {
          setError(data.error)
        }
      } else if (activeTab === 'providers') {
        const res = await fetch('/api/admin/providers')
        const data = await res.json()
        if (data.success) {
          setProviders(data.providers)
        } else {
          setError(data.error)
        }
      } else if (activeTab === 'models') {
        // Fetch both models and providers (providers needed for dropdown options)
        const resModels = await fetch('/api/admin/models')
        const dataModels = await resModels.json()
        const resProv = await fetch('/api/admin/providers')
        const dataProv = await resProv.json()

        if (dataModels.success) setModels(dataModels.models)
        if (dataProv.success) setProviders(dataProv.providers)

        if (!dataModels.success || !dataProv.success) {
          setError(dataModels.error || dataProv.error)
        }
      } else if (activeTab === 'settings') {
        const res = await fetch('/api/admin/settings')
        const data = await res.json()
        if (data.success && data.settings) {
          setRateLimitCount(data.settings.rate_limit_count || '25')
          setRateLimitHours(data.settings.rate_limit_hours || '3')
          setBannerMessage(data.settings.banner_message || '')
        } else {
          setError(data.error)
        }
      } else if (activeTab === 'errors') {
        const res = await fetch('/api/admin/stats')
        const data = await res.json()
        if (data.success) {
          setStats(data.stats)
        } else {
          setError(data.error)
        }
      }
    } catch (err: any) {
      setError('Ma\'lumot yuklashda tarmoq xatoligi')
    } finally {
      setLoading(false)
    }
  }

  // --- USER HANDLERS ---
  const handleUserRoleChange = async (userId: string, currentRole: string) => {
    try {
      const nextRole = currentRole === 'admin' ? 'user' : 'admin'
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: nextRole }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('Foydalanuvchi roli muvaffaqiyatli o\'zgartirildi')
        fetchTabData()
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Amal bajarilmadi')
    }
  }

  const handleUserBanToggle = async (userId: string, currentBanned: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, banned: !currentBanned }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(currentBanned ? 'Foydalanuvchi blokdan chiqarildi' : 'Foydalanuvchi bloklandi')
        fetchTabData()
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Amal bajarilmadi')
    }
  }

  // --- PROVIDER HANDLERS ---
  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProvider),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('Yangi provayder qo\'shildi')
        setNewProvider({ name: '', baseUrl: '', apiKey: '' })
        setShowAddProvider(false)
        fetchTabData()
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Tarmoq xatoligi')
    }
  }

  const handleUpdateProvider = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProvider) return
    try {
      const res = await fetch(`/api/admin/providers/${editingProvider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProvider),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('Provayder ma\'lumotlari yangilandi')
        setEditingProvider(null)
        fetchTabData()
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Tarmoq xatoligi')
    }
  }

  const handleDeleteProvider = async (id: string) => {
    if (!confirm('Ushbu provayderni va unga tegishli barcha modellarni o\'chirishni tasdiqlaysizmi?')) return
    try {
      const res = await fetch(`/api/admin/providers/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setSuccess('Provayder o\'chirildi')
        fetchTabData()
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Tarmoq xatoligi')
    }
  }

  // --- MODEL HANDLERS ---
  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModel),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('Yangi model qo\'shildi')
        setNewModel({ providerId: '', modelId: '', displayName: '', priority: 1, active: true })
        setShowAddModel(false)
        fetchTabData()
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Tarmoq xatoligi')
    }
  }

  const handleUpdateModel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingModel) return
    try {
      const res = await fetch(`/api/admin/models/${editingModel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingModel),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('Model yangilandi')
        setEditingModel(null)
        fetchTabData()
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Tarmoq xatoligi')
    }
  }

  const handleDeleteModel = async (id: string) => {
    if (!confirm('Ushbu modelni o\'chirishni tasdiqlaysizmi?')) return
    try {
      const res = await fetch(`/api/admin/models/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setSuccess('Model o\'chirildi')
        fetchTabData()
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Tarmoq xatoligi')
    }
  }

  // --- SETTINGS HANDLER ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rate_limit_count: rateLimitCount,
          rate_limit_hours: rateLimitHours,
          banner_message: bannerMessage,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('Tizim sozlamalari muvaffaqiyatli saqlandi')
        fetchTabData()
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Tarmoq xatoligi')
    }
  }

  if (checkingAdmin) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0B0F19]">
        <Loader2 className="h-10 w-10 animate-spin text-[#00D4FF]" />
      </div>
    )
  }

  if (!isAdmin) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white">
      {/* Top Banner Message Indicator */}
      {bannerMessage && (
        <div className="bg-gradient-to-r from-cyan-600 to-blue-700 py-1.5 px-4 text-center text-xs font-semibold text-white tracking-wide shadow-md">
          E&apos;lon: {bannerMessage}
        </div>
      )}

      {/* Top bar header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/20 px-3 py-1.5 text-xs font-semibold text-[#94A3B8] hover:bg-muted/40 hover:text-white transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Chatga qaytish
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#00D4FF]">TYNEX BOSHQRUV PANELI</h1>
            <p className="text-xs text-[#94A3B8]">Tizim sozlamalari, foydalanuvchilar va AI gateway nazorati</p>
          </div>
        </div>
        <button
          onClick={fetchTabData}
          className="rounded-lg p-2 hover:bg-muted/30 transition-colors"
          title="Yangilash"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <div className="flex flex-col md:flex-row min-h-[calc(100vh-73px)]">
        {/* Sidebar Tabs */}
        <aside className="w-full md:w-64 border-r border-border bg-card/30 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('stats')}
            className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'stats'
                ? 'bg-[#00D4FF]/10 text-[#00D4FF] border-l-2 border-[#00D4FF]'
                : 'text-[#94A3B8] hover:bg-muted/30 hover:text-white'
            }`}
          >
            <BarChart3 className="h-4 w-4" /> Statistika
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'users'
                ? 'bg-[#00D4FF]/10 text-[#00D4FF] border-l-2 border-[#00D4FF]'
                : 'text-[#94A3B8] hover:bg-muted/30 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" /> Foydalanuvchilar
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'providers'
                ? 'bg-[#00D4FF]/10 text-[#00D4FF] border-l-2 border-[#00D4FF]'
                : 'text-[#94A3B8] hover:bg-muted/30 hover:text-white'
            }`}
          >
            <Cpu className="h-4 w-4" /> AI Provayderlar
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'models'
                ? 'bg-[#00D4FF]/10 text-[#00D4FF] border-l-2 border-[#00D4FF]'
                : 'text-[#94A3B8] hover:bg-muted/30 hover:text-white'
            }`}
          >
            <Cpu className="h-4 w-4" /> AI Modellar
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-[#00D4FF]/10 text-[#00D4FF] border-l-2 border-[#00D4FF]'
                : 'text-[#94A3B8] hover:bg-muted/30 hover:text-white'
            }`}
          >
            <SettingsIcon className="h-4 w-4" /> Tizim Sozlamalari
          </button>
          <button
            onClick={() => setActiveTab('errors')}
            className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'errors'
                ? 'bg-[#00D4FF]/10 text-[#00D4FF] border-l-2 border-[#00D4FF]'
                : 'text-[#94A3B8] hover:bg-muted/30 hover:text-white'
            }`}
          >
            <AlertTriangle className="h-4 w-4" /> Xatolar Jurnali
          </button>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
          {/* Messages Alert */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError('')}><X className="h-4 w-4" /></button>
            </div>
          )}
          {success && (
            <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400 flex justify-between items-center">
              <span>{success}</span>
              <button onClick={() => setSuccess('')}><X className="h-4 w-4" /></button>
            </div>
          )}

          {loading && !stats && users.length === 0 && providers.length === 0 && (
            <div className="flex h-60 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#00D4FF]" />
            </div>
          )}

          {/* TAB 1: STATISTICS */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#00D4FF]" /> Tizim Statistikalari
              </h2>

              {/* Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card/60 to-card/40 p-5 backdrop-blur-sm shadow-lg shadow-[#00D4FF]/5 hover:border-[#00D4FF]/30 hover:shadow-[#00D4FF]/10 transition-all">
                  <p className="text-xs text-[#94A3B8] font-semibold uppercase tracking-wider">Foydalanuvchilar</p>
                  <p className="text-3xl font-bold mt-2 text-[#00D4FF]">{stats.userCount}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card/60 to-card/40 p-5 backdrop-blur-sm shadow-lg shadow-cyan-500/5 hover:border-cyan-400/30 hover:shadow-cyan-400/10 transition-all">
                  <p className="text-xs text-[#94A3B8] font-semibold uppercase tracking-wider">Chatlar</p>
                  <p className="text-3xl font-bold mt-2 text-cyan-400">{stats.chatCount}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card/60 to-card/40 p-5 backdrop-blur-sm shadow-lg shadow-blue-500/5 hover:border-blue-400/30 hover:shadow-blue-400/10 transition-all">
                  <p className="text-xs text-[#94A3B8] font-semibold uppercase tracking-wider">Xabarlar</p>
                  <p className="text-3xl font-bold mt-2 text-blue-400">{stats.messageCount}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card/60 to-card/40 p-5 backdrop-blur-sm shadow-lg shadow-teal-500/5 hover:border-teal-400/30 hover:shadow-teal-400/10 transition-all">
                  <p className="text-xs text-[#94A3B8] font-semibold uppercase tracking-wider">Tokenlar</p>
                  <p className="text-3xl font-bold mt-2 text-teal-400">{(stats.totalTokens).toLocaleString()}</p>
                </div>
              </div>

              {/* Daily Chart (CSS-based beautifully structured) */}
              <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card/60 to-card/40 p-6 backdrop-blur-sm mt-6 shadow-lg shadow-black/20">
                <h3 className="text-sm font-semibold text-white mb-6 tracking-wide">Oxirgi 7 kunlik so&apos;rovlar grafigi</h3>
                <div className="flex h-44 items-end gap-3 justify-between pt-4 border-b border-border/40">
                  {stats.chartData.map((d) => {
                    const maxVal = Math.max(...stats.chartData.map((x) => x.count), 1)
                    const percentHeight = (d.count / maxVal) * 100
                    return (
                      <div key={d.date} className="flex flex-col items-center flex-1 group">
                        <span className="text-[10px] text-[#00D4FF] opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-bold">
                          {d.count} ta
                        </span>
                        <div
                          style={{ height: `${percentHeight}%` }}
                          className="w-full max-w-[32px] rounded-t bg-gradient-to-t from-blue-600 to-[#00D4FF] transition-all group-hover:shadow-lg group-hover:shadow-[#00D4FF]/20"
                        />
                        <span className="text-[10px] text-[#94A3B8] mt-2 text-center truncate max-w-full">
                          {d.date.substring(5)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Model usage table */}
              <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card/60 to-card/40 p-6 backdrop-blur-sm shadow-lg shadow-black/20">
                <h3 className="text-sm font-semibold text-white mb-4 tracking-wide">Model Bo&apos;yicha Sarf</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/40 text-[#94A3B8] pb-3 font-semibold uppercase text-[11px] tracking-wider">
                        <th className="py-3 px-2">Model nomi</th>
                        <th className="py-3 px-2">So&apos;rovlar</th>
                        <th className="py-3 px-2">Tokenlar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {stats.modelStats.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-6 text-center text-[#94A3B8]">
                            Sari etilgan so&apos;rovlar mavjud emas
                          </td>
                        </tr>
                      ) : (
                        stats.modelStats.map((ms) => (
                          <tr key={ms.modelName} className="hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-2 font-semibold text-white">{ms.modelName}</td>
                            <td className="py-3 px-2 text-slate-300">{ms.count}</td>
                            <td className="py-3 px-2 text-teal-400 font-medium">{ms.tokens.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#00D4FF]" /> Foydalanuvchilar Ro&apos;yxati
                </h2>

                {/* Search */}
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Ism yoki email bo'yicha qidirish..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchTabData()}
                    className="w-full rounded-lg border border-border bg-muted/30 pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-[#00D4FF]/50"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card/60 to-card/40 overflow-hidden shadow-lg shadow-black/20">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-card/70 border-b border-border/40 text-[#94A3B8] font-semibold uppercase text-[11px] tracking-wider">
                        <th className="p-4">Ism</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Rol</th>
                        <th className="p-4">Holat</th>
                        <th className="p-4 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-[#94A3B8]">
                            Foydalanuvchilar topilmadi
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-4 font-semibold text-white">{u.name}</td>
                            <td className="p-4 text-[#94A3B8]">{u.email}</td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                  u.role === 'admin'
                                    ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40'
                                    : 'bg-blue-500/25 text-blue-300 border border-blue-500/40'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                  u.banned
                                    ? 'bg-red-500/25 text-red-300 border border-red-500/40'
                                    : 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                                }`}
                              >
                                {u.banned ? 'Bloklangan' : 'Faol'}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-1.5">
                              <button
                                onClick={() => handleUserRoleChange(u.id, u.role)}
                                className="px-2.5 py-1 rounded-lg bg-muted/50 text-[#94A3B8] hover:bg-muted/70 hover:text-white transition-all text-xs font-medium"
                                title="Rolni o'zgartirish"
                              >
                                Rol
                              </button>
                              <button
                                onClick={() => handleUserBanToggle(u.id, u.banned)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                  u.banned
                                    ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                                    : 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30'
                                }`}
                              >
                                {u.banned ? 'Ochish' : 'Blok'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROVIDERS */}
          {activeTab === 'providers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-[#00D4FF]" /> AI Provayderlar
                </h2>
                <button
                  onClick={() => setShowAddProvider(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#00D4FF] px-4 py-2 text-xs font-bold text-background hover:shadow-lg hover:shadow-[#00D4FF]/40 active:scale-95 transition-all"
                >
                  <Plus className="h-4 w-4" strokeWidth={3} /> Yangi Provayder
                </button>
              </div>

              {/* Add provider form */}
              {showAddProvider && (
                <form
                  onSubmit={handleAddProvider}
                  className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <h3 className="text-sm font-semibold text-white">Yangi Provayder Qo&apos;shish</h3>
                    <button
                      type="button"
                      onClick={() => setShowAddProvider(false)}
                      className="text-[#94A3B8] hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#94A3B8]">Provayder nomi</label>
                      <input
                        type="text"
                        required
                        value={newProvider.name}
                        onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                        placeholder="Masalan: OpenRouter, Groq"
                        className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-white outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#94A3B8]">Base URL</label>
                      <input
                        type="url"
                        required
                        value={newProvider.baseUrl}
                        onChange={(e) => setNewProvider({ ...newProvider, baseUrl: e.target.value })}
                        placeholder="https://api.openai.com/v1"
                        className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-white outline-none"
                      />
                    </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#94A3B8]">API Key</label>
                  <div className="relative">
                    <input
                      type={showNewProviderApiKey ? 'text' : 'password'}
                      required
                      value={newProvider.apiKey}
                      onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                      placeholder="sk-..."
                      className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 pr-10 text-sm text-white outline-none placeholder:text-muted-foreground focus:border-[#00D4FF]/50 focus:shadow-lg focus:shadow-[#00D4FF]/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewProviderApiKey(!showNewProviderApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#00D4FF] transition-colors p-0.5"
                      title={showNewProviderApiKey ? 'API Keyni berkitish' : 'API Keyni ko\'rish'}
                    >
                      {showNewProviderApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddProvider(false)}
                      className="px-4 py-2 rounded-lg border border-border text-[#94A3B8] hover:bg-muted/10 transition-colors text-xs font-semibold"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-[#00D4FF] text-background hover:shadow-lg text-xs font-bold"
                    >
                      Qo&apos;shish
                    </button>
                  </div>
                </form>
              )}

              {/* Editing provider form */}
              {editingProvider && (
                <form
                  onSubmit={handleUpdateProvider}
                  className="rounded-xl border border-yellow-500/30 bg-card/60 p-6 backdrop-blur-sm space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <h3 className="text-sm font-semibold text-yellow-400 flex items-center gap-1">
                      <Edit2 className="h-4 w-4" /> Provayder Tahrirlash: {editingProvider.name}
                    </h3>
                    <button type="button" onClick={() => setEditingProvider(null)} className="text-[#94A3B8] hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#94A3B8]">Provayder nomi</label>
                      <input
                        type="text"
                        required
                        value={editingProvider.name}
                        onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                        className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-white outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#94A3B8]">Base URL</label>
                      <input
                        type="url"
                        required
                        value={editingProvider.baseUrl}
                        onChange={(e) => setEditingProvider({ ...editingProvider, baseUrl: e.target.value })}
                        className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-white outline-none"
                      />
                    </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#94A3B8]">API Key</label>
                    <div className="relative">
                      <input
                        type={showEditProviderApiKey ? 'text' : 'password'}
                        required
                        value={editingProvider.apiKey}
                        onChange={(e) => setEditingProvider({ ...editingProvider, apiKey: e.target.value })}
                        placeholder="sk-..."
                        className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 pr-10 text-sm text-white outline-none placeholder:text-muted-foreground focus:border-[#00D4FF]/50 focus:shadow-lg focus:shadow-[#00D4FF]/10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditProviderApiKey(!showEditProviderApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#00D4FF] transition-colors p-0.5"
                        title={showEditProviderApiKey ? 'API Keyni berkitish' : 'API Keyni ko\'rish'}
                      >
                        {showEditProviderApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingProvider(null)}
                      className="px-4 py-2 rounded-lg border border-border text-[#94A3B8] hover:bg-muted/10 transition-colors text-xs font-semibold"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-yellow-500 text-background hover:shadow-lg text-xs font-bold"
                    >
                      Yangilash
                    </button>
                  </div>
                </form>
              )}

              {/* Providers List */}
              <div className="grid grid-cols-1 gap-4">
                {providers.length === 0 ? (
                  <div className="rounded-xl border border-border/50 bg-gradient-to-br from-card/60 to-card/40 p-8 text-center text-[#94A3B8] shadow-lg shadow-black/10">
                    Hech qanday provayder ulanmagan. Boshlash uchun tepadan &quot;Yangi Provayder&quot; qo&apos;shing.
                  </div>
                ) : (
                  providers.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl border border-border/50 bg-gradient-to-br from-card/60 to-card/40 p-5 backdrop-blur-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#00D4FF]/40 hover:shadow-lg hover:shadow-[#00D4FF]/10 transition-all shadow-md shadow-black/10"
                    >
                      <div className="space-y-1">
                        <h3 className="font-bold text-white text-base">{p.name}</h3>
                        <p className="text-xs text-[#94A3B8] font-mono break-all">Base URL: {p.baseUrl}</p>
                        <p className="text-xs text-[#94A3B8] font-mono">API Key: sk-••••••••••••</p>
                        {p.needsMigration && (
                          <div className="mt-2 rounded-lg bg-yellow-500/15 border-l-2 border-l-yellow-400 pl-3 pr-2 py-2">
                            <p className="flex items-start gap-2 text-xs font-semibold text-yellow-300">
                              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                              <span>Eski format — &apos;pnpm migrate:encrypt-keys&apos; ishga tushiring</span>
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <button
                          onClick={() => setEditingProvider(p)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 hover:border-yellow-500/60 text-yellow-400 transition-all text-xs font-semibold hover:scale-105"
                        >
                          <Edit2 className="h-3.5 w-3.5" /> Tahrirlash
                        </button>
                        <button
                          onClick={() => handleDeleteProvider(p.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500/60 text-red-400 transition-all text-xs font-semibold hover:scale-105"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> O&apos;chirish
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MODELS */}
          {activeTab === 'models' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-[#00D4FF]" /> AI Modellar
                </h2>
                <button
                  onClick={() => {
                    if (providers.length === 0) {
                      alert("Avval kamida bitta AI Provayder qo'shishingiz shart!")
                      return
                    }
                    setShowAddModel(true)
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-[#00D4FF] px-4 py-2 text-xs font-bold text-background hover:shadow-lg hover:shadow-[#00D4FF]/40 active:scale-95 transition-all"
                >
                  <Plus className="h-4 w-4" strokeWidth={3} /> Yangi Model
                </button>
              </div>

              {/* Add model form */}
              {showAddModel && (
                <form
                  onSubmit={handleAddModel}
                  className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <h3 className="text-sm font-semibold text-white">Yangi Model Qo&apos;shish</h3>
                    <button type="button" onClick={() => setShowAddModel(false)} className="text-[#94A3B8] hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#94A3B8]">Provayder</label>
                      <select
                        required
                        value={newModel.providerId}
                        onChange={(e) => setNewModel({ ...newModel, providerId: e.target.value })}
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-white outline-none"
                      >
                        <option value="">Tanlang...</option>
                        {providers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#94A3B8]">Model ID</label>
                      <input
                        type="text"
                        required
                        value={newModel.modelId}
                        onChange={(e) => setNewModel({ ...newModel, modelId: e.target.value })}
                        placeholder="gpt-4o, deepseek-chat"
                        className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-white outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#94A3B8]">Ko&apos;rinadigan Nom</label>
                      <input
                        type="text"
                        required
                        value={newModel.displayName}
                        onChange={(e) => setNewModel({ ...newModel, displayName: e.target.value })}
                        placeholder="GPT-4o Premium"
                        className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-white outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#94A3B8]">Priority (Tartib)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={newModel.priority}
                        onChange={(e) => setNewModel({ ...newModel, priority: Number(e.target.value) })}
                        className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-white outline-none"
                      />
                    </div>
                    <div className="space-y-1 flex flex-col justify-end">
                      <div className="flex items-center gap-2 py-2">
                        <input
                          type="checkbox"
                          id="new_active"
                          checked={newModel.active}
                          onChange={(e) => setNewModel({ ...newModel, active: e.target.checked })}
                          className="h-4 w-4 rounded border-border bg-muted text-[#00D4FF]"
                        />
                        <label htmlFor="new_active" className="text-xs font-semibold text-[#94A3B8] cursor-pointer">
                          Faol model
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModel(false)}
                      className="px-4 py-2 rounded-lg border border-border text-[#94A3B8] hover:bg-muted/10 transition-colors text-xs font-semibold"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-[#00D4FF] text-background hover:shadow-lg text-xs font-bold"
                    >
                      Qo&apos;shish
                    </button>
                  </div>
                </form>
              )}

              {/* Editing Model Form */}
              {editingModel && (
                <form
                  onSubmit={handleUpdateModel}
                  className="rounded-xl border border-yellow-500/30 bg-card/60 p-6 backdrop-blur-sm space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <h3 className="text-sm font-semibold text-yellow-400 flex items-center gap-1">
                      <Edit2 className="h-4 w-4" /> Model Tahrirlash: {editingModel.displayName}
                    </h3>
                    <button type="button" onClick={() => setEditingModel(null)} className="text-[#94A3B8] hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#94A3B8]">Model ID</label>
                      <input
                        type="text"
                        required
                        value={editingModel.modelId}
                        onChange={(e) => setEditingModel({ ...editingModel, modelId: e.target.value })}
                        className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-white outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#94A3B8]">Ko&apos;rinadigan Nom</label>
                      <input
                        type="text"
                        required
                        value={editingModel.displayName}
                        onChange={(e) => setEditingModel({ ...editingModel, displayName: e.target.value })}
                        className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-white outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#94A3B8]">Priority (Tartib)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={editingModel.priority}
                        onChange={(e) => setEditingModel({ ...editingModel, priority: Number(e.target.value) })}
                        className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-white outline-none"
                      />
                    </div>
                    <div className="space-y-1 flex flex-col justify-end">
                      <div className="flex items-center gap-2 py-2">
                        <input
                          type="checkbox"
                          id="edit_active"
                          checked={editingModel.active}
                          onChange={(e) => setEditingModel({ ...editingModel, active: e.target.checked })}
                          className="h-4 w-4 rounded border-border bg-muted text-[#00D4FF]"
                        />
                        <label htmlFor="edit_active" className="text-xs font-semibold text-[#94A3B8] cursor-pointer">
                          Faol model
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingModel(null)}
                      className="px-4 py-2 rounded-lg border border-border text-[#94A3B8] hover:bg-muted/10 transition-colors text-xs font-semibold"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-yellow-500 text-background hover:shadow-lg text-xs font-bold"
                    >
                      Yangilash
                    </button>
                  </div>
                </form>
              )}

              {/* Models List */}
              <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-card/80 border-b border-border text-[#94A3B8] font-semibold">
                        <th className="p-4">Provayder</th>
                        <th className="p-4">Ko&apos;rinadigan nom</th>
                        <th className="p-4">Model ID</th>
                        <th className="p-4">Priority</th>
                        <th className="p-4">Holat</th>
                        <th className="p-4 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {models.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-[#94A3B8]">
                            AI modellar mavjud emas. Boshlash uchun yangi model qo&apos;shing.
                          </td>
                        </tr>
                      ) : (
                        models.map((m) => (
                          <tr key={m.id} className="hover:bg-muted/10 transition-colors">
                            <td className="p-4 font-semibold text-[#00D4FF]">{m.provider?.name || 'Noma\'lum'}</td>
                            <td className="p-4 font-semibold text-white">{m.displayName}</td>
                            <td className="p-4 text-slate-300 font-mono">{m.modelId}</td>
                            <td className="p-4 text-center font-bold text-purple-400">{m.priority}</td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  m.active
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}
                              >
                                {m.active ? 'Faol' : 'O\'chirilgan'}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-1">
                              <button
                                onClick={() => setEditingModel(m)}
                                className="px-2 py-1 rounded border border-border text-xs text-[#94A3B8] hover:text-white transition-colors"
                              >
                                Tahrirlash
                              </button>
                              <button
                                onClick={() => handleDeleteModel(m.id)}
                                className="px-2 py-1 rounded border border-border text-xs text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-colors"
                              >
                                O&apos;chirish
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GLOBAL SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-[#00D4FF]" /> Tizim Sozlamalari
              </h2>

              <form onSubmit={handleSaveSettings} className="rounded-xl border border-border bg-card/40 p-6 backdrop-blur-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Rate Limit Count */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#94A3B8]">Rate limit xabarlar soni</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={rateLimitCount}
                      onChange={(e) => setRateLimitCount(e.target.value)}
                      placeholder="25"
                      className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-white outline-none focus:border-[#00D4FF]/50"
                    />
                    <p className="text-[10px] text-muted-foreground">Foydalanuvchiga berilgan xabarlar chegarasi miqdori.</p>
                  </div>

                  {/* Rate Limit Hours */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#94A3B8]">Rate limit vaqt oralig&apos;i (soatda)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={rateLimitHours}
                      onChange={(e) => setRateLimitHours(e.target.value)}
                      placeholder="3"
                      className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-white outline-none focus:border-[#00D4FF]/50"
                    />
                    <p className="text-[10px] text-muted-foreground">Chegara o&apos;lchanadigan vaqt oynasi.</p>
                  </div>
                </div>

                {/* Banner message */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#94A3B8]">E&apos;lon va Banner xabari</label>
                  <textarea
                    rows={3}
                    value={bannerMessage}
                    onChange={(e) => setBannerMessage(e.target.value)}
                    placeholder="Barcha foydalanuvchilarga ko'rsatiladigan e'lon matni (bo'sh qoldirsangiz ko'rinmaydi)..."
                    className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-white outline-none resize-none focus:border-[#00D4FF]/50"
                  />
                  <p className="text-[10px] text-muted-foreground">Ushbu xabar barcha chat oynalari yuqorisida ko&apos;rinadi.</p>
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-[#00D4FF] px-6 py-2.5 text-xs font-bold text-background hover:shadow-lg hover:shadow-[#00D4FF]/40 active:scale-95 transition-all"
                  >
                    Sozlamalarni Saqlash
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: ERRORS & FAILURE LOGS */}
          {activeTab === 'errors' && stats && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5 text-red-400" /> Muvozanatsiz & Muvaffaqiyatsiz AI So&apos;rovlari (Xatolar Jurnali)
              </h2>

              <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-card/80 border-b border-border text-[#94A3B8] font-semibold">
                        <th className="p-4">Sana</th>
                        <th className="p-4">Provayder</th>
                        <th className="p-4">Model</th>
                        <th className="p-4">Latency</th>
                        <th className="p-4">Xatolik sababi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {stats.errorLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-[#94A3B8]">
                            Muvaffaqiyatsiz so&apos;rovlar topilmadi. Tizim ajoyib ishlamoqda!
                          </td>
                        </tr>
                      ) : (
                        stats.errorLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                            <td className="p-4 text-[#94A3B8] whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="p-4 font-semibold text-white">{log.providerName}</td>
                            <td className="p-4 text-slate-300">{log.modelName}</td>
                            <td className="p-4 text-slate-300 font-mono">{log.latencyMs} ms</td>
                            <td className="p-4 text-red-400 break-words font-mono max-w-sm">
                              {log.errorMessage || 'Noma\'lum xatolik'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
