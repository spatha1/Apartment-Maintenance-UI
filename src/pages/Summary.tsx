import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  RefreshCw, CheckCircle2, Clock, Lock, QrCode,
  CreditCard, AlertCircle, User, Download, AlertTriangle, Pencil, X, Save, Eraser,
} from 'lucide-react'
import Layout from '../components/Layout'
import { api } from '../api/client'
import type { Month, SummaryRow } from '../types'

const SHOP_FLATS = new Set(['S1', 'S2', 'S3', 'S4'])

export default function Summary() {
  const { monthId } = useParams<{ monthId: string }>()
  const mid = Number(monthId)
  const navigate = useNavigate()

  const [month, setMonth] = useState<Month | null>(null)
  const [rows, setRows] = useState<SummaryRow[]>([])
  const [calculating, setCalculating] = useState(false)
  const [payFlat, setPayFlat] = useState<string | null>(null)
  const [payRef, setPayRef] = useState('')
  const [payBy, setPayBy] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [error, setError] = useState('')

  // Edit state
  const [editFlat, setEditFlat] = useState<string | null>(null)
  const [editCommon, setEditCommon] = useState('')
  const [editWater, setEditWater] = useState('')
  const [editCarried, setEditCarried] = useState('')

  useEffect(() => {
    api.get<Month[]>('/months').then(ms => setMonth(ms.find(m => m.month_id === mid) ?? null))
    api.get<SummaryRow[]>(`/months/${mid}/summary`).then(setRows)
  }, [mid])

  async function calculate() {
    setCalculating(true)
    setError('')
    try {
      const r = await api.post<SummaryRow[]>(`/months/${mid}/calculate`)
      setRows(r)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Calculation failed')
    } finally {
      setCalculating(false)
    }
  }

  async function submitPayment(flat_no: string) {
    const row = rows.find(r => r.flat_no === flat_no)
    if (!row) return
    try {
      const updated = await api.post<SummaryRow>(`/months/${mid}/mark-paid`, {
        flat_no,
        payment_reference: payRef,
        paid_by: payBy,
        paid_amount: payAmount ? parseFloat(payAmount) : row.grand_total,
      })
      setRows(prev => prev.map(r => r.flat_no === flat_no ? updated : r))
      setPayFlat(null); setPayRef(''); setPayBy(''); setPayAmount('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function unmarkPaid(flat_no: string) {
    try {
      const updated = await api.post<SummaryRow>(`/months/${mid}/mark-paid`, {
        flat_no, payment_reference: '', paid_by: '', paid_amount: 0,
      })
      setRows(prev => prev.map(r => r.flat_no === flat_no ? updated : r))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  function startEdit(row: SummaryRow) {
    setEditFlat(row.flat_no)
    setEditCommon(row.common_amount.toFixed(2))
    setEditWater(row.water_amount.toFixed(2))
    setEditCarried(row.carried_forward.toFixed(2))
    setPayFlat(null)
  }

  async function saveEdit(flat_no: string) {
    try {
      const updated = await api.put<SummaryRow>(`/months/${mid}/summary/${flat_no}`, {
        common_amount: parseFloat(editCommon) || 0,
        water_amount: parseFloat(editWater) || 0,
        carried_forward: parseFloat(editCarried) || 0,
      })
      setRows(prev => prev.map(r => r.flat_no === flat_no ? updated : r))
      setEditFlat(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  async function resetCarriedForward() {
    if (!confirm('Zero out all "Previous Due" amounts for this month?\n\nThis removes carry-forward from old unpaid months for all flats.')) return
    try {
      const updated = await api.post<SummaryRow[]>(`/months/${mid}/reset-carried-forward`)
      setRows(updated)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  function download(path: string) {
    window.open(`/api${path}`, '_blank')
  }

  const paid = rows.filter(r => r.status === 'Paid').length
  const collected = rows.filter(r => r.status === 'Paid').reduce((s, r) => s + r.paid_amount, 0)
  const grandTotal = rows.reduce((s, r) => s + r.grand_total, 0)
  const isLocked = month?.is_locked ?? false

  async function confirmPayment(flat_no: string) {
    const row = rows.find(r => r.flat_no === flat_no)
    if (!row) return
    try {
      const updated = await api.post<SummaryRow>(`/months/${mid}/mark-paid`, {
        flat_no,
        payment_reference: row.payment_reference ?? '',
        paid_by: row.paid_by ?? '',
        paid_amount: row.grand_total,
      })
      setRows(prev => prev.map(r => r.flat_no === flat_no ? updated : r))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  function statusBadge(row: SummaryRow) {
    if (row.status === 'Paid') return <span className="badge-paid"><CheckCircle2 size={11} /> Paid</span>
    if (row.status === 'Pending Verification') return <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 w-fit" style={{background:'#ede9fe',color:'#6d28d9'}}><Clock size={11} /> Verify</span>
    if (row.status === 'Partial') return <span className="badge-pending" style={{background:'#fef3c7',color:'#92400e'}}><AlertTriangle size={11} /> Partial</span>
    return <span className="badge-pending"><Clock size={11} /> Pending</span>
  }

  return (
    <Layout monthId={mid}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Summary</h1>
          {month && <p className="text-gray-500 text-sm mt-0.5">{month.name}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isLocked && (
            <button onClick={calculate} disabled={calculating} className="btn-secondary btn-sm">
              <RefreshCw size={14} className={calculating ? 'animate-spin' : ''} />
              {calculating ? 'Calculating…' : 'Recalculate'}
            </button>
          )}
          {isLocked && <span className="badge-locked"><Lock size={11} /> Finalized</span>}
          {!isLocked && rows.some(r => r.carried_forward > 0) && (
            <button onClick={resetCarriedForward} className="btn-secondary btn-sm text-amber-700 border-amber-200 hover:bg-amber-50">
              <Eraser size={14} /> Reset Prev.Due
            </button>
          )}
          <button onClick={() => download(`/months/${mid}/report/collection`)} className="btn-secondary btn-sm">
            <Download size={14} /> Collection
          </button>
          <button onClick={() => download(`/months/${mid}/report/expenses`)} className="btn-secondary btn-sm">
            <Download size={14} /> Expenses
          </button>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="stat-card">
            <span className="text-xs text-gray-400">Paid</span>
            <span className="text-xl font-bold text-emerald-600">{paid}/{rows.length}</span>
          </div>
          <div className="stat-card">
            <span className="text-xs text-gray-400">Collected</span>
            <span className="text-xl font-bold text-gray-900">₹{collected.toFixed(0)}</span>
          </div>
          <div className="stat-card">
            <span className="text-xs text-gray-400">Outstanding</span>
            <span className="text-xl font-bold text-amber-600">₹{(grandTotal - collected).toFixed(0)}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 uppercase">
                <th className="px-4 py-3 text-left">Flat</th>
                <th className="px-4 py-3 text-right">Common</th>
                <th className="px-4 py-3 text-right">Water</th>
                <th className="px-4 py-3 text-right">Prev.Due</th>
                <th className="px-4 py-3 text-right font-bold text-gray-600">Total</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-left">Paid by / Ref</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const isShop = SHOP_FLATS.has(row.flat_no)
                const isPaying = payFlat === row.flat_no
                const isEditing = editFlat === row.flat_no
                return (
                  <tr key={row.flat_no} className={`border-t border-gray-100 ${isShop ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-4 py-3 font-semibold">
                      {row.flat_no}
                      {isShop && <span className="ml-1 text-xs text-gray-400">(shop)</span>}
                    </td>

                    {isEditing ? (
                      <>
                        <td className="px-2 py-2">
                          <input className="input text-xs py-1 w-20 text-right" type="number" value={editCommon} onChange={e => setEditCommon(e.target.value)} />
                        </td>
                        <td className="px-2 py-2">
                          <input className="input text-xs py-1 w-20 text-right" type="number" value={editWater} onChange={e => setEditWater(e.target.value)} />
                        </td>
                        <td className="px-2 py-2">
                          <input className="input text-xs py-1 w-20 text-right" type="number" value={editCarried} onChange={e => setEditCarried(e.target.value)} />
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-500 text-xs">
                          ₹{(parseFloat(editCommon||'0') + parseFloat(editWater||'0') + parseFloat(editCarried||'0')).toFixed(0)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-right text-gray-600">₹{row.common_amount.toFixed(0)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">₹{row.water_amount.toFixed(0)}</td>
                        <td className={`px-4 py-3 text-right ${row.carried_forward > 0 ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
                          {row.carried_forward > 0 ? `₹${row.carried_forward.toFixed(0)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">₹{row.grand_total.toFixed(0)}</td>
                      </>
                    )}

                    <td className="px-4 py-3 text-center">
                      {statusBadge(row)}
                      {row.status === 'Partial' && (
                        <div className="text-xs text-amber-600 mt-0.5">₹{row.paid_amount.toFixed(0)} paid</div>
                      )}
                      {row.paid_date && (
                        <div className="text-xs text-gray-400 mt-0.5">{row.paid_date}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {row.paid_by && <div className="flex items-center gap-1"><User size={10} />{row.paid_by}</div>}
                      {row.payment_reference && <div className="text-gray-400">#{row.payment_reference}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-center flex-wrap">
                        {isEditing ? (
                          <>
                            <button onClick={() => saveEdit(row.flat_no)} className="btn btn-success btn-sm">
                              <Save size={12} /> Save
                            </button>
                            <button onClick={() => setEditFlat(null)} className="btn btn-secondary btn-sm">
                              <X size={12} />
                            </button>
                          </>
                        ) : isPaying ? (
                          <div className="flex flex-col gap-1.5 min-w-[140px]">
                            <input className="input text-xs py-1" placeholder="Paid by" value={payBy} onChange={e => setPayBy(e.target.value)} />
                            <input className="input text-xs py-1" placeholder={`Amount (₹${row.grand_total.toFixed(0)})`} type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                            <input className="input text-xs py-1" placeholder="Ref no." value={payRef} onChange={e => setPayRef(e.target.value)} />
                            <div className="flex gap-1">
                              <button onClick={() => submitPayment(row.flat_no)} className="btn-success btn-sm flex-1">
                                <CheckCircle2 size={12} /> Confirm
                              </button>
                              <button onClick={() => { setPayFlat(null); setPayRef(''); setPayBy(''); setPayAmount('') }} className="btn-secondary btn-sm">✕</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {row.status === 'Paid' || row.status === 'Partial' ? (
                              <button onClick={() => unmarkPaid(row.flat_no)} className="btn btn-secondary btn-sm">
                                <CreditCard size={12} /> Unpay
                              </button>
                            ) : row.status === 'Pending Verification' ? (
                              <>
                                <button onClick={() => confirmPayment(row.flat_no)} className="btn btn-success btn-sm">
                                  <CheckCircle2 size={12} /> Confirm
                                </button>
                                <button onClick={() => unmarkPaid(row.flat_no)} className="btn btn-secondary btn-sm">
                                  <X size={12} /> Reject
                                </button>
                              </>
                            ) : (
                              <button onClick={() => { setPayFlat(row.flat_no); setPayRef(''); setPayBy(''); setPayAmount('') }} className="btn btn-success btn-sm">
                                <CreditCard size={12} /> Mark Paid
                              </button>
                            )}
                            <button onClick={() => navigate(`/payment?month_id=${mid}&flat_no=${row.flat_no}`)} className="btn-secondary btn-sm">
                              <QrCode size={12} /> QR
                            </button>
                            {!isLocked && (
                              <button onClick={() => startEdit(row)} className="btn btn-secondary btn-sm">
                                <Pencil size={12} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <RefreshCw size={32} className="mx-auto mb-3 opacity-30" />
            <p>Click Recalculate to generate the summary</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
