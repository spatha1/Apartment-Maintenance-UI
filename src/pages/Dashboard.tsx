import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Receipt, Droplets, BarChart3, Lock, LockOpen,
  IndianRupee, Droplet, Users, CheckCircle2, ChevronDown, Building2,
} from 'lucide-react'
import Layout from '../components/Layout'
import { api } from '../api/client'
import type { Month, MonthStats } from '../types'

export default function Dashboard() {
  const navigate = useNavigate()
  const [months, setMonths] = useState<Month[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [stats, setStats] = useState<MonthStats | null>(null)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [locking, setLocking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Month[]>('/months').then(ms => {
      setMonths(ms)
      if (ms.length > 0) setActiveId(ms[0].month_id)
    })
  }, [])

  useEffect(() => {
    if (!activeId) { setStats(null); return }
    api.get<MonthStats>(`/months/${activeId}/stats`).then(setStats).catch(() => setStats(null))
  }, [activeId])

  async function createMonth(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError('')
    try {
      const m = await api.post<Month>('/months', { name: newName.trim() })
      setMonths(prev => [m, ...prev])
      setActiveId(m.month_id)
      setNewName('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create month')
    } finally {
      setCreating(false)
    }
  }

  async function lockMonth() {
    if (!activeId) return
    if (!confirm('Finalize this month? All calculations will be frozen and no edits allowed.')) return
    setLocking(true)
    try {
      const m = await api.post<Month>(`/months/${activeId}/lock`)
      setMonths(prev => prev.map(x => x.month_id === m.month_id ? m : x))
      setStats(prev => prev ? { ...prev, month: m } : prev)
    } finally {
      setLocking(false)
    }
  }

  const activeMonth = months.find(m => m.month_id === activeId)

  return (
    <Layout monthId={activeId ?? undefined}>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Create + select month */}
      <div className="card p-4 mb-6 flex flex-wrap gap-3 items-end">
        <form onSubmit={createMonth} className="flex gap-2 items-end flex-1 min-w-48">
          <div className="flex-1">
            <label className="label">New month</label>
            <input
              className="input"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Apr 2026"
            />
          </div>
          <button type="submit" disabled={creating} className="btn-primary">
            <Plus size={16} />
            Create
          </button>
        </form>

        {months.length > 0 && (
          <div className="flex-1 min-w-40">
            <label className="label">Active month</label>
            <div className="relative">
              <select
                className="input pr-8 appearance-none"
                value={activeId ?? ''}
                onChange={e => setActiveId(Number(e.target.value))}
              >
                {months.map(m => (
                  <option key={m.month_id} value={m.month_id}>{m.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm w-full">{error}</p>}
      </div>

      {/* Month status badge + lock action */}
      {activeMonth && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-lg font-semibold text-gray-800">{activeMonth.name}</span>
          {activeMonth.is_locked ? (
            <span className="badge-locked"><Lock size={11} /> Finalized</span>
          ) : (
            <>
              <span className="badge-pending"><LockOpen size={11} /> Open</span>
              <button
                onClick={lockMonth}
                disabled={locking}
                className="btn-secondary btn-sm ml-auto"
              >
                <Lock size={14} />
                Finalize Month
              </button>
            </>
          )}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="stat-card">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <IndianRupee size={12} /> Common Total
            </span>
            <span className="text-xl font-bold text-gray-900">₹{stats.common_total.toFixed(0)}</span>
            <span className="text-xs text-gray-500">₹{stats.common_per_flat.toFixed(0)}/flat</span>
          </div>
          <div className="stat-card">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Droplet size={12} /> Water Rate
            </span>
            <span className="text-xl font-bold text-gray-900">
              ₹{stats.water_source.rate_per_liter.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500">per litre</span>
          </div>
          <div className="stat-card">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <CheckCircle2 size={12} /> Paid
            </span>
            <span className="text-xl font-bold text-gray-900">
              {stats.paid_count}/{stats.flat_count}
            </span>
            <span className="text-xs text-gray-500">flats</span>
          </div>
          <div className="stat-card">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Users size={12} /> Flats
            </span>
            <span className="text-xl font-bold text-gray-900">{stats.residential_count}</span>
            <span className="text-xs text-gray-500">residential</span>
          </div>
        </div>
      )}

      {/* Action grid */}
      {activeId && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => navigate(`/expenses/${activeId}`)}
            className="card p-5 text-left hover:shadow-md transition-shadow group"
          >
            <Receipt size={24} className="text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-semibold text-gray-900">Common Expenses</p>
            <p className="text-sm text-gray-500 mt-1">Add power, watchman, lift, and more</p>
          </button>
          <button
            onClick={() => navigate(`/water/${activeId}`)}
            className="card p-5 text-left hover:shadow-md transition-shadow group"
          >
            <Droplets size={24} className="text-cyan-500 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-semibold text-gray-900">Water Readings</p>
            <p className="text-sm text-gray-500 mt-1">Upload meter images with OCR detection</p>
          </button>
          <button
            onClick={() => navigate(`/summary/${activeId}`)}
            className="card p-5 text-left hover:shadow-md transition-shadow group"
          >
            <BarChart3 size={24} className="text-emerald-500 mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-semibold text-gray-900">Summary</p>
            <p className="text-sm text-gray-500 mt-1">View bills and mark payments</p>
          </button>
        </div>
      )}

      {months.length === 0 && (
        <div className="card p-12 text-center text-gray-400">
          <Building2 size={40} className="mx-auto mb-3 opacity-30" />
          <p>Create a month above to get started</p>
        </div>
      )}
    </Layout>
  )
}
