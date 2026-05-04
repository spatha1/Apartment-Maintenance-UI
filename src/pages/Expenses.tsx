import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Save, AlertCircle, Lock, IndianRupee } from 'lucide-react'
import Layout from '../components/Layout'
import { api } from '../api/client'
import type { ExpensesData, Month } from '../types'

interface Row { type: string; amount: string }

const DEFAULT_ROWS: Row[] = [
  { type: 'Power Bill', amount: '' },
  { type: 'Watchman Salary', amount: '' },
  { type: 'Lift Maintenance', amount: '' },
  { type: 'Garbage Charges', amount: '' },
]

export default function Expenses() {
  const { monthId } = useParams<{ monthId: string }>()
  const mid = Number(monthId)
  const navigate = useNavigate()

  const [month, setMonth] = useState<Month | null>(null)
  const [rows, setRows] = useState<Row[]>(DEFAULT_ROWS)
  const [summary, setSummary] = useState<{ total: number; per_flat: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Month[]>('/months').then(ms => setMonth(ms.find(m => m.month_id === mid) ?? null))
    api.get<ExpensesData>(`/months/${mid}/expenses`).then(data => {
      if (data.rows.length > 0) {
        setRows(data.rows.map(r => ({ type: r.type, amount: String(r.amount) })))
        setSummary({ total: data.total, per_flat: data.per_flat })
      }
    })
  }, [mid])

  function addRow() {
    setRows(prev => [...prev, { type: '', amount: '' }])
  }

  function removeRow(i: number) {
    setRows(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateRow(i: number, field: keyof Row, value: string) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  const total = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
  const perFlat = total / 12

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = rows
        .filter(r => r.type.trim())
        .map(r => ({ type: r.type.trim(), amount: parseFloat(r.amount) || 0 }))
      const data = await api.put<ExpensesData>(`/months/${mid}/expenses`, payload)
      setSummary({ total: data.total, per_flat: data.per_flat })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const isLocked = month?.is_locked ?? false

  return (
    <Layout monthId={mid}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Common Expenses</h1>
          {month && <p className="text-gray-500 text-sm mt-0.5">{month.name}</p>}
        </div>
        {isLocked && <span className="badge-locked"><Lock size={11} /> Finalized</span>}
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        {/* Expense form */}
        <div className="sm:col-span-2">
          <form onSubmit={save} className="card p-5 space-y-3">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_140px_36px] gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
              <span>Expense type</span><span>Amount (₹)</span><span />
            </div>

            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_140px_36px] gap-2 items-center">
                <input
                  className="input"
                  value={row.type}
                  onChange={e => updateRow(i, 'type', e.target.value)}
                  placeholder="Expense name"
                  disabled={isLocked}
                />
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.amount}
                  onChange={e => updateRow(i, 'amount', e.target.value)}
                  placeholder="0.00"
                  disabled={isLocked}
                />
                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}

            {!isLocked && (
              <button
                type="button"
                onClick={addRow}
                className="btn-secondary btn-sm w-full justify-center mt-1"
              >
                <Plus size={14} /> Add Row
              </button>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {!isLocked && (
              <button
                type="submit"
                disabled={saving}
                className={`btn w-full justify-center ${saved ? 'btn-success' : 'btn-primary'}`}
              >
                <Save size={16} />
                {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Expenses'}
              </button>
            )}
          </form>
        </div>

        {/* Summary panel */}
        <div className="space-y-3">
          <div className="card p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Live Total</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Expenses</span>
                <span className="font-bold text-gray-900">₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-100 pt-2">
                <span className="text-sm text-gray-600">Per Flat (÷12)</span>
                <span className="font-bold text-blue-600">₹{perFlat.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {summary && (
            <div className="card p-4 bg-emerald-50 border-emerald-200">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                <IndianRupee size={12} /> Saved Values
              </p>
              <div className="text-sm text-emerald-800">
                <div className="flex justify-between"><span>Total</span><span className="font-bold">₹{summary.total.toFixed(2)}</span></div>
                <div className="flex justify-between mt-1"><span>Per flat</span><span className="font-bold">₹{summary.per_flat.toFixed(2)}</span></div>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate(`/water/${mid}`)}
            className="btn-primary w-full justify-center"
          >
            Next: Water Readings →
          </button>
        </div>
      </div>
    </Layout>
  )
}
