import { useEffect, useState } from 'react'
import {
  CheckCircle2, Circle, Calendar, IndianRupee, CreditCard,
  Banknote, Plus, Pencil, Trash2, ClipboardList, TrendingDown, TrendingUp,
  ChevronDown, RefreshCw,
} from 'lucide-react'
import Layout from '../components/Layout'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import type { Activity, Month } from '../types'

const MODE_ICON: Record<string, React.ReactNode> = {
  online: <CreditCard size={13} className="text-blue-500" />,
  cash: <Banknote size={13} className="text-amber-600" />,
}

function dueLine(a: Activity) {
  if (!a.due_day) return null
  const d1 = `${a.due_day}${ordinal(a.due_day)}`
  return a.due_day_end
    ? `By ${d1}–${a.due_day_end}${ordinal(a.due_day_end)}`
    : `By ${d1}`
}

function ordinal(n: number) {
  if (n === 1 || n === 21 || n === 31) return 'st'
  if (n === 2 || n === 22) return 'nd'
  if (n === 3 || n === 23) return 'rd'
  return 'th'
}

interface EditState {
  id?: number
  title: string
  description: string
  amount: string
  due_day: string
  due_day_end: string
  category: 'payment' | 'collection'
  payment_mode: string
  sort_order: string
}

const EMPTY_EDIT: EditState = {
  title: '', description: '', amount: '', due_day: '', due_day_end: '',
  category: 'payment', payment_mode: 'online', sort_order: '0',
}

export default function Activity() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [months, setMonths] = useState<Month[]>([])
  const [monthId, setMonthId] = useState<number | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Month[]>('/months').then(ms => {
      setMonths(ms)
      if (ms.length) setMonthId(ms[0].month_id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const qs = monthId ? `?month_id=${monthId}` : ''
    api.get<Activity[]>(`/activities${qs}`)
      .then(setActivities)
      .catch(() => setActivities([]))
      .finally(() => setLoading(false))
  }, [monthId])

  async function toggle(a: Activity) {
    if (!monthId) return
    setToggling(a.id)
    try {
      const updated = await api.post<Activity>(`/activities/${a.id}/toggle/${monthId}`, { notes: '' })
      setActivities(prev => prev.map(x => x.id === a.id ? updated : x))
    } catch {
      setError('Failed to update')
    } finally {
      setToggling(null)
    }
  }

  async function seedDefaults() {
    setSeeding(true)
    setError('')
    try {
      const res = await api.post<{seeded: number; message: string}>('/activities/seed-defaults', {})
      if (res.seeded > 0) {
        const qs = monthId ? `?month_id=${monthId}` : ''
        const updated = await api.get<Activity[]>(`/activities${qs}`)
        setActivities(updated)
      } else {
        setError(res.message)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to seed')
    } finally {
      setSeeding(false)
    }
  }

  async function saveActivity() {
    if (!editForm || !editForm.title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')
    try {
      const body = {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        amount: editForm.amount ? parseFloat(editForm.amount) : null,
        due_day: editForm.due_day ? parseInt(editForm.due_day) : null,
        due_day_end: editForm.due_day_end ? parseInt(editForm.due_day_end) : null,
        category: editForm.category,
        payment_mode: editForm.payment_mode || null,
        sort_order: parseInt(editForm.sort_order || '0'),
      }
      if (editForm.id) {
        await api.put(`/activities/${editForm.id}`, body)
      } else {
        await api.post('/activities', body)
      }
      setEditForm(null)
      if (monthId) {
        const updated = await api.get<Activity[]>(`/activities?month_id=${monthId}`)
        setActivities(updated)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function deleteActivity(id: number) {
    if (!confirm('Delete this activity?')) return
    try {
      await api.delete(`/activities/${id}`)
      setActivities(prev => prev.filter(a => a.id !== id))
    } catch {
      setError('Failed to delete')
    }
  }

  const payments = activities.filter(a => a.category === 'payment')
  const collections = activities.filter(a => a.category === 'collection')
  const completedCount = activities.filter(a => a.completed).length
  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <ClipboardList size={22} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Monthly Activities</h1>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              {activities.length === 0 && (
                <button
                  onClick={seedDefaults}
                  disabled={seeding}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  <RefreshCw size={15} className={seeding ? 'animate-spin' : ''} />
                  {seeding ? 'Seeding…' : 'Load Defaults'}
                </button>
              )}
              <button
                onClick={() => setEditForm({ ...EMPTY_EDIT })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Plus size={15} /> Add Activity
              </button>
            </div>
          )}
        </div>

        {/* Month selector */}
        <div className="card p-4 mb-5 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={15} className="text-blue-500" />
            <span className="font-medium">Month:</span>
          </div>
          <div className="relative">
            <select
              value={monthId ?? ''}
              onChange={e => setMonthId(Number(e.target.value))}
              className="appearance-none border border-gray-200 rounded-lg px-3 py-1.5 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            >
              {months.map(m => (
                <option key={m.month_id} value={m.month_id}>{m.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {activities.length > 0 && (
            <span className="ml-auto text-sm text-gray-500">
              {completedCount}/{activities.length} done
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-12 text-sm">Loading…</div>
        ) : (
          <>
            {/* Payments section */}
            <Section
              title="Payments to Make"
              icon={<TrendingDown size={16} className="text-red-500" />}
              items={payments}
              monthId={monthId}
              isAdmin={isAdmin}
              toggling={toggling}
              onToggle={toggle}
              onEdit={a => setEditForm({ id: a.id, title: a.title, description: a.description ?? '', amount: a.amount?.toString() ?? '', due_day: a.due_day?.toString() ?? '', due_day_end: a.due_day_end?.toString() ?? '', category: a.category, payment_mode: a.payment_mode ?? 'online', sort_order: a.sort_order.toString() })}
              onDelete={deleteActivity}
            />

            {/* Collections section */}
            <Section
              title="Collections to Receive"
              icon={<TrendingUp size={16} className="text-emerald-600" />}
              items={collections}
              monthId={monthId}
              isAdmin={isAdmin}
              toggling={toggling}
              onToggle={toggle}
              onEdit={a => setEditForm({ id: a.id, title: a.title, description: a.description ?? '', amount: a.amount?.toString() ?? '', due_day: a.due_day?.toString() ?? '', due_day_end: a.due_day_end?.toString() ?? '', category: a.category, payment_mode: a.payment_mode ?? 'online', sort_order: a.sort_order.toString() })}
              onDelete={deleteActivity}
            />

            {activities.length === 0 && (
              <div className="text-center text-gray-400 py-12 text-sm">No activities configured yet.</div>
            )}
          </>
        )}

        {/* Add/Edit modal */}
        {editForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editForm.id ? 'Edit Activity' : 'New Activity'}
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                  <input className="input w-full" value={editForm.title} onChange={e => setEditForm(f => f && ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <input className="input w-full" value={editForm.description} onChange={e => setEditForm(f => f && ({ ...f, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
                    <input className="input w-full" type="number" value={editForm.amount} onChange={e => setEditForm(f => f && ({ ...f, amount: e.target.value }))} placeholder="Optional" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                    <select className="input w-full" value={editForm.category} onChange={e => setEditForm(f => f && ({ ...f, category: e.target.value as 'payment' | 'collection' }))}>
                      <option value="payment">Payment</option>
                      <option value="collection">Collection</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Due Day</label>
                    <input className="input w-full" type="number" min="1" max="31" value={editForm.due_day} onChange={e => setEditForm(f => f && ({ ...f, due_day: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">To Day</label>
                    <input className="input w-full" type="number" min="1" max="31" value={editForm.due_day_end} onChange={e => setEditForm(f => f && ({ ...f, due_day_end: e.target.value }))} placeholder="Optional" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Mode</label>
                    <select className="input w-full" value={editForm.payment_mode} onChange={e => setEditForm(f => f && ({ ...f, payment_mode: e.target.value }))}>
                      <option value="online">Online</option>
                      <option value="cash">Cash</option>
                      <option value="any">Any</option>
                    </select>
                  </div>
                </div>
              </div>
              {error && <p className="text-red-600 text-xs mt-3">{error}</p>}
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => { setEditForm(null); setError('') }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                <button onClick={saveActivity} disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

interface SectionProps {
  title: string
  icon: React.ReactNode
  items: Activity[]
  monthId: number | null
  isAdmin: boolean
  toggling: number | null
  onToggle: (a: Activity) => void
  onEdit: (a: Activity) => void
  onDelete: (id: number) => void
}

function Section({ title, icon, items, isAdmin, toggling, onToggle, onEdit, onDelete }: SectionProps) {
  if (items.length === 0) return null
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-base font-semibold text-gray-700">{title}</h2>
        <span className="ml-auto text-xs text-gray-400">{items.filter(a => a.completed).length}/{items.length} done</span>
      </div>
      <div className="space-y-2">
        {items.map(a => (
          <ActivityCard
            key={a.id}
            activity={a}
            isAdmin={isAdmin}
            toggling={toggling === a.id}
            onToggle={() => onToggle(a)}
            onEdit={() => onEdit(a)}
            onDelete={() => onDelete(a.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface CardProps {
  activity: Activity
  isAdmin: boolean
  toggling: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

function ActivityCard({ activity: a, isAdmin, toggling, onToggle, onEdit, onDelete }: CardProps) {
  const due = dueLine(a)
  return (
    <div className={`card p-4 flex items-start gap-3 transition-all ${a.completed ? 'bg-gray-50 opacity-80' : 'bg-white'}`}>
      {/* Toggle */}
      <button
        onClick={onToggle}
        disabled={!isAdmin || toggling}
        className={`mt-0.5 shrink-0 transition-colors ${isAdmin ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
      >
        {a.completed
          ? <CheckCircle2 size={20} className="text-emerald-500" />
          : <Circle size={20} className="text-gray-300" />
        }
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-sm ${a.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {a.title}
        </div>
        {a.description && (
          <div className="text-xs text-gray-500 mt-0.5">{a.description}</div>
        )}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {a.amount != null && (
            <span className="flex items-center gap-1 text-xs font-semibold text-gray-700">
              <IndianRupee size={11} />₹{a.amount.toLocaleString()}
              {a.auto_amount && (
                <span className="text-xs text-blue-500 font-normal">(auto)</span>
              )}
            </span>
          )}
          {a.amount == null && a.auto_amount && (
            <span className="text-xs text-amber-600 italic">Amount not yet available</span>
          )}
          {due && (
            <span className="flex items-center gap-1 text-xs text-blue-600">
              <Calendar size={11} />{due}
            </span>
          )}
          {a.payment_mode && MODE_ICON[a.payment_mode] && (
            <span className="flex items-center gap-1 text-xs text-gray-500 capitalize">
              {MODE_ICON[a.payment_mode]}{a.payment_mode}
            </span>
          )}
          {a.completed && a.completed_date && (
            <span className="text-xs text-emerald-600">Done {a.completed_date}</span>
          )}
        </div>
      </div>

      {/* Admin actions */}
      {isAdmin && (
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
            <Pencil size={13} />
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
