import { useEffect, useState } from 'react'
import { Download, FileText, Droplets, CreditCard, Database, Eye } from 'lucide-react'
import Layout from '../components/Layout'
import { api } from '../api/client'
import type { Month } from '../types'

export default function Reports() {
  const [months, setMonths] = useState<Month[]>([])
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  useEffect(() => {
    api.get<Month[]>('/months').then(ms => {
      setMonths(ms)
      if (ms.length > 0) setSelectedMonth(ms[0].month_id)
    })
  }, [])

  function open(url: string) { window.open(`/api${url}`, '_blank') }

  const mid = selectedMonth

  type ReportDef = {
    icon: React.ElementType
    title: string
    desc: string
    color: string
    bg: string
    pdf?: string
    csv: string
    csvLabel?: string
  }

  const monthlyReports: ReportDef[] = mid ? [
    {
      icon: CreditCard,
      title: 'Payment Collection',
      desc: 'All flats — amounts, status, carried-forward, paid by, references',
      color: 'text-emerald-600', bg: 'bg-emerald-50',
      pdf: `/months/${mid}/report/collection?fmt=pdf&inline=true`,
      csv: `/months/${mid}/report/collection`,
    },
    {
      icon: FileText,
      title: 'Common Expenses',
      desc: 'Itemised list of all common expenses for the month',
      color: 'text-blue-600', bg: 'bg-blue-50',
      pdf: `/months/${mid}/report/expenses?fmt=pdf&inline=true`,
      csv: `/months/${mid}/report/expenses`,
    },
    {
      icon: Droplets,
      title: 'Water Readings',
      desc: 'Per-flat meter readings, litres consumed, and charges',
      color: 'text-cyan-600', bg: 'bg-cyan-50',
      pdf: `/months/${mid}/report/water?fmt=pdf&inline=true`,
      csv: `/months/${mid}/report/water`,
    },
  ] : []

  const globalReports: ReportDef[] = [
    {
      icon: CreditCard,
      title: 'Full Payment History',
      desc: 'All months × all flats — complete payment log',
      color: 'text-purple-600', bg: 'bg-purple-50',
      pdf: `/report/payments?fmt=pdf&inline=true`,
      csv: `/report/payments`,
    },
    {
      icon: Database,
      title: 'App Data Backup',
      desc: 'Full JSON export of all data — use to restore or migrate',
      color: 'text-gray-600', bg: 'bg-gray-50',
      csv: `/backup`,
      csvLabel: 'JSON',
    },
  ]

  const ReportRow = ({ r }: { r: ReportDef }) => (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${r.bg} shrink-0 mt-0.5`}>
          <r.icon size={18} className={r.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{r.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{r.desc}</p>
          {/* Buttons on new line — always visible on mobile */}
          <div className="flex flex-wrap gap-2 mt-3">
            {r.pdf && (
              <button onClick={() => open(r.pdf!)} className="btn btn-secondary btn-sm gap-1">
                <Eye size={13} /> View PDF
              </button>
            )}
            <button onClick={() => open(r.csv)} className="btn btn-primary btn-sm gap-1">
              <Download size={13} /> {r.csvLabel ?? 'CSV'}
            </button>
            {r.pdf && (
              <button onClick={() => open(r.pdf!.replace('inline=true', 'inline=false').replace('fmt=pdf&', 'fmt=pdf&'))} className="btn btn-primary btn-sm gap-1">
                <Download size={13} /> PDF
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Download size={22} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        </div>

        {months.length > 0 && (
          <div className="mb-6">
            <label className="label">Month for monthly reports</label>
            <select
              className="input max-w-xs"
              value={selectedMonth ?? ''}
              onChange={e => setSelectedMonth(Number(e.target.value))}
            >
              {months.map(m => (
                <option key={m.month_id} value={m.month_id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Monthly Reports</h2>
        <div className="space-y-3 mb-8">
          {monthlyReports.map(r => <ReportRow key={r.title} r={r} />)}
        </div>

        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">All-Time Reports</h2>
        <div className="space-y-3">
          {globalReports.map(r => <ReportRow key={r.title} r={r} />)}
        </div>
      </div>
    </Layout>
  )
}
