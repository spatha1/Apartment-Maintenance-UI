import { useEffect, useState } from 'react'
import { PiggyBank, Plus, Minus, Wallet, Trash2 } from 'lucide-react'
import Layout from '../components/Layout'
import { api } from '../api/client'
import type { PoolTransaction, PoolData } from '../types'

export default function Pool() {
  const [data, setData] = useState<PoolData>({ balance: 0, transactions: [] })
  const [txType, setTxType] = useState<'credit' | 'debit'>('credit')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const d = await api.get<PoolData>('/pool')
    setData(d)
  }

  useEffect(() => { load() }, [])

  async function submit() {
    if (!amount || !description.trim()) { setError('Amount and description are required'); return }
    setSaving(true)
    setError('')
    try {
      await api.post(`/pool/${txType}`, { amount: parseFloat(amount), description, reference })
      setAmount(''); setDescription(''); setReference('')
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: number) {
    if (!confirm('Remove this transaction?')) return
    await api.delete(`/pool/${id}`)
    await load()
  }

  const positive = data.balance >= 0

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <PiggyBank size={22} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Pool</h1>
        </div>

        {/* Balance */}
        <div className={`card p-6 mb-5 border ${positive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Wallet size={14} /> Current Balance
          </div>
          <div className={`text-3xl font-bold ${positive ? 'text-emerald-700' : 'text-red-700'}`}>
            ₹{data.balance.toFixed(2)}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {positive ? 'Available in pool' : 'Pool is in deficit — needs top-up'}
          </p>
        </div>

        {/* Add transaction */}
        <div className="card p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4">Add Transaction</h2>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTxType('credit')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${txType === 'credit' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              <Plus size={14} /> Add to Pool
            </button>
            <button
              onClick={() => setTxType('debit')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${txType === 'debit' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              <Minus size={14} /> Spend from Pool
            </button>
          </div>

          <div className="space-y-3">
            <input
              type="number"
              placeholder="Amount (₹)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="input w-full"
            />
            <input
              type="text"
              placeholder="Description (e.g. Handover from previous secretary)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input w-full"
            />
            <input
              type="text"
              placeholder="Reference / Note (optional)"
              value={reference}
              onChange={e => setReference(e.target.value)}
              className="input w-full"
            />
            <button
              onClick={submit}
              disabled={saving}
              className={`w-full flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${txType === 'credit' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
            >
              {saving ? 'Saving…' : txType === 'credit' ? '+ Add to Pool' : '− Spend from Pool'}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Transaction History</h2>
          {data.transactions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {data.transactions.map((t: PoolTransaction) => (
                <div key={t.id} className={`flex items-center justify-between rounded-lg px-4 py-3 ${t.type === 'credit' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{t.description}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {t.date}
                      {t.reference && ` · ${t.reference}`}
                      {t.created_by && ` · by ${t.created_by}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className={`text-sm font-bold ${t.type === 'credit' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {t.type === 'credit' ? '+' : '−'}₹{t.amount.toFixed(0)}
                    </span>
                    <button onClick={() => remove(t.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
