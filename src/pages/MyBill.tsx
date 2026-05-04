import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, CheckCircle2, Clock, QrCode, IndianRupee,
  Droplets, Receipt, ChevronDown, AlertTriangle, ChevronUp,
} from 'lucide-react'
import Layout from '../components/Layout'
import { api } from '../api/client'
import type { MyBillData, WaterSource, WaterReading, ExpensesData } from '../types'

export default function MyBill() {
  const navigate = useNavigate()
  const [data, setData] = useState<MyBillData | null>(null)
  const [selectedMonthId, setSelectedMonthId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const [expenses, setExpenses] = useState<ExpensesData | null>(null)
  const [waterSource, setWaterSource] = useState<WaterSource | null>(null)
  const [myReading, setMyReading] = useState<WaterReading | null>(null)

  useEffect(() => {
    api.get<MyBillData>('/my-bill').then(d => {
      setData(d)
      if (d.month) setSelectedMonthId(d.month.month_id)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedMonthId === null) return
    api.get<MyBillData>(`/my-bill?month_id=${selectedMonthId}`).then(setData)
  }, [selectedMonthId])

  useEffect(() => {
    if (!showDetails || !selectedMonthId) return
    api.get<ExpensesData>(`/months/${selectedMonthId}/expenses`).then(setExpenses).catch(() => null)
    api.get<WaterSource>(`/months/${selectedMonthId}/water-source`).then(setWaterSource).catch(() => null)
    api.get<WaterReading | null>(`/months/${selectedMonthId}/my-reading`).then(setMyReading).catch(() => null)
  }, [showDetails, selectedMonthId])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  const { flat_no, months, month, bill } = data ?? {}

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-2xl mb-4">
            <Building2 size={28} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">My Bill</h1>
          <p className="text-gray-500 text-sm mt-1">Flat {flat_no}</p>
        </div>

        {/* Month selector */}
        {months && months.length > 0 && (
          <div className="mb-6">
            <label className="label">Select Month</label>
            <div className="relative">
              <select
                className="input pr-8 appearance-none"
                value={selectedMonthId ?? ''}
                onChange={e => setSelectedMonthId(Number(e.target.value))}
              >
                {months.map(m => (
                  <option key={m.month_id} value={m.month_id}>{m.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Bill card */}
        {bill ? (
          <>
            <div className="card overflow-hidden shadow-md">
              {/* Status banner */}
              <div className={`px-5 py-3 flex items-center justify-between ${
                bill.status === 'Paid' ? 'bg-emerald-50' : 'bg-amber-50'
              }`}>
                {bill.status === 'Paid' ? (
                  <span className="badge-paid text-sm px-3 py-1"><CheckCircle2 size={14} /> Paid</span>
                ) : bill.status === 'Partial' ? (
                  <span className="badge-pending text-sm px-3 py-1" style={{background:'#fef3c7',color:'#92400e'}}>
                    <AlertTriangle size={14} /> Partial — ₹{bill.paid_amount.toFixed(0)} paid
                  </span>
                ) : (
                  <span className="badge-pending text-sm px-3 py-1"><Clock size={14} /> Payment Pending</span>
                )}
                <span className="text-sm text-gray-500">{month?.name}</span>
              </div>

              {/* Amounts */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="flex items-center gap-2 text-gray-600">
                    <Receipt size={16} className="text-blue-400" /> Common Expenses
                  </span>
                  <span className="font-semibold">₹{bill.common_amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="flex items-center gap-2 text-gray-600">
                    <Droplets size={16} className="text-cyan-400" /> Water Charges
                  </span>
                  <span className="font-semibold">₹{bill.water_amount.toFixed(2)}</span>
                </div>
                {bill.carried_forward > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle size={16} /> Previous Due
                    </span>
                    <span className="font-semibold text-amber-600">₹{bill.carried_forward.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-3 bg-gray-50 rounded-lg px-3">
                  <span className="flex items-center gap-2 font-bold text-gray-900">
                    <IndianRupee size={16} /> Total Due
                  </span>
                  <span className="text-xl font-bold text-blue-700">₹{bill.grand_total.toFixed(2)}</span>
                </div>

                {bill.status === 'Paid' && (
                  <div className="text-sm text-gray-500 space-y-1">
                    {bill.paid_date && <p>Paid on: <span className="font-medium text-gray-700">{bill.paid_date}</span></p>}
                    {bill.paid_by && <p>Paid by: <span className="font-medium text-gray-700">{bill.paid_by}</span></p>}
                    {bill.payment_reference && <p>Ref: <span className="font-mono text-gray-700">#{bill.payment_reference}</span></p>}
                  </div>
                )}
              </div>

              {/* QR button */}
              {bill.status !== 'Paid' && month && (
                <div className="px-5 pb-5">
                  <button
                    onClick={() => navigate(`/payment?month_id=${month.month_id}&flat_no=${flat_no}&amount=${bill.grand_total}`)}
                    className="btn-primary w-full justify-center"
                  >
                    <QrCode size={18} /> Pay via UPI — ₹{bill.grand_total.toFixed(0)}
                  </button>
                </div>
              )}
            </div>

            {/* Bill details toggle */}
            <button
              onClick={() => setShowDetails(v => !v)}
              className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-blue-600 py-2 hover:bg-blue-50 rounded-lg transition-colors"
            >
              {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showDetails ? 'Hide details' : 'View bill details'}
            </button>

            {showDetails && (
              <div className="mt-2 space-y-4">
                {/* Common expenses */}
                {expenses && expenses.rows.length > 0 && (
                  <div className="card p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Receipt size={15} className="text-blue-500" /> Common Expenses
                    </h3>
                    <table className="w-full text-sm">
                      <tbody>
                        {expenses.rows.map(e => (
                          <tr key={e.id} className="border-t border-gray-100 first:border-0">
                            <td className="py-1.5 text-gray-600">{e.type}</td>
                            <td className="py-1.5 text-right font-medium">₹{e.amount.toFixed(0)}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-gray-200">
                          <td className="pt-2 font-semibold text-gray-700">Total</td>
                          <td className="pt-2 text-right font-bold text-gray-900">₹{expenses.total.toFixed(0)}</td>
                        </tr>
                        <tr>
                          <td className="pt-1 text-xs text-gray-400">Your share (÷12 flats)</td>
                          <td className="pt-1 text-right text-xs font-semibold text-blue-600">₹{expenses.per_flat.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Water details */}
                {(waterSource || myReading) && (
                  <div className="card p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Droplets size={15} className="text-cyan-500" /> Water Details
                    </h3>
                    {waterSource && waterSource.total_liters > 0 && (
                      <div className="text-sm text-gray-600 space-y-1 mb-3">
                        <div className="flex justify-between">
                          <span>Total water</span>
                          <span className="font-medium">{waterSource.total_liters.toFixed(0)} L</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rate</span>
                          <span className="font-medium">₹{waterSource.rate_per_liter.toFixed(4)}/L</span>
                        </div>
                        {waterSource.tankers_count > 0 && (
                          <div className="flex justify-between">
                            <span>Tankers</span>
                            <span className="font-medium">{waterSource.tankers_count} × ₹{waterSource.tanker_price.toFixed(0)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {myReading && (
                      <div className="text-sm border-t border-gray-100 pt-3 space-y-1">
                        <p className="font-medium text-gray-700 mb-1">Your Meter Reading</p>
                        <div className="flex justify-between text-gray-600">
                          <span>Previous</span>
                          <span>{myReading.previous_reading.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Current</span>
                          <span>{myReading.current_reading.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-cyan-700">
                          <span>Consumption</span>
                          <span>{Math.max(myReading.current_reading - myReading.previous_reading, 0).toFixed(0)} L</span>
                        </div>
                        <div className="flex justify-between font-semibold text-gray-900">
                          <span>Water charge</span>
                          <span>₹{myReading.amount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="card p-12 text-center text-gray-400">
            <IndianRupee size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {month ? 'Bill not generated yet for this month.' : 'No months available yet.'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
