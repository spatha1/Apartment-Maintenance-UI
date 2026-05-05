import { useEffect, useState } from 'react'
import { Download, FileText, Droplets, CreditCard, Database, Eye, X, Loader2 } from 'lucide-react'
import Layout from '../components/Layout'
import { api } from '../api/client'
import type { Month } from '../types'

const BACKEND = import.meta.env.VITE_API_BASE_URL ?? '/api'

async function fetchWithAuth(path: string): Promise<Response> {
  const token = localStorage.getItem('auth_token')
  return fetch(`${BACKEND}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export default function Reports() {
  const [months, setMonths] = useState<Month[]>([])
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    api.get<Month[]>('/months').then(ms => {
      setMonths(ms)
      if (ms.length > 0) setSelectedMonth(ms[0].month_id)
    })
  }, [])

  const isMobile = window.innerWidth < 768

  async function viewPdf(path: string, title: string) {
    setBusy(title + '-view')
    try {
      const res = await fetchWithAuth(path)
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      if (isMobile) {
        // iframe doesn't work on mobile — open in new tab/PDF viewer
        window.open(url, '_blank')
        setTimeout(() => URL.revokeObjectURL(url), 10000)
      } else {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(url)
        setPreviewTitle(title)
      }
    } catch { alert('Failed to load PDF') }
    finally { setBusy(null) }
  }

  async function downloadPdf(path: string, filename: string, title: string) {
    setBusy(title + '-dl')
    try {
      const res = await fetchWithAuth(path)
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
    } catch { alert('Failed to download PDF') }
    finally { setBusy(null) }
  }

  async function downloadCsv(path: string, title: string) {
    setBusy(title + '-csv')
    try {
      const res = await fetchWithAuth(path)
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const cd = res.headers.get('content-disposition') ?? ''
      a.download = cd.match(/filename="([^"]+)"/)?.[1] ?? 'report.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch { alert('Failed to download') }
    finally { setBusy(null) }
  }

  function closePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

  const mid = selectedMonth

  type ReportDef = {
    icon: React.ElementType
    title: string
    desc: string
    color: string
    bg: string
    pdfPath?: string
    pdfFile?: string
    csvPath?: string
    csvLabel?: string
  }

  const monthlyReports: ReportDef[] = mid ? [
    {
      icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50',
      title: 'Payment Collection',
      desc: 'All flats — amounts, status, carried-forward, paid by, references',
      pdfPath: `/months/${mid}/report/collection?format=pdf`,
      pdfFile: `collection-apr2026.pdf`,
      csvPath: `/months/${mid}/report/collection`,
    },
    {
      icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50',
      title: 'Common Expenses',
      desc: 'Itemised list of all common expenses for the month',
      pdfPath: `/months/${mid}/report/expenses?format=pdf`,
      pdfFile: `expenses-apr2026.pdf`,
      csvPath: `/months/${mid}/report/expenses`,
    },
    {
      icon: Droplets, color: 'text-cyan-600', bg: 'bg-cyan-50',
      title: 'Water Readings',
      desc: 'Per-flat meter readings, litres consumed, and charges',
      pdfPath: `/months/${mid}/report/water?format=pdf`,
      pdfFile: `water-apr2026.pdf`,
      csvPath: `/months/${mid}/report/water`,
    },
  ] : []

  const globalReports: ReportDef[] = [
    {
      icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50',
      title: 'Full Payment History',
      desc: 'All months × all flats — complete payment log',
      pdfPath: `/report/payments?format=pdf`,
      pdfFile: `payment-history.pdf`,
      csvPath: `/report/payments`,
    },
    {
      icon: Database, color: 'text-gray-600', bg: 'bg-gray-50',
      title: 'App Data Backup',
      desc: 'Full JSON export of all data — use to restore or migrate',
      csvPath: `/backup`,
      csvLabel: 'JSON',
    },
  ]

  const isLoading = (key: string) => busy === key

  const ReportCard = ({ r }: { r: ReportDef }) => (
    <div className={`card p-4 ${previewTitle === r.title && previewUrl ? 'ring-2 ring-blue-300' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${r.bg} shrink-0 mt-0.5`}>
          <r.icon size={18} className={r.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{r.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{r.desc}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {r.pdfPath && (
              <button
                onClick={() => viewPdf(r.pdfPath!, r.title)}
                disabled={busy !== null}
                className="btn btn-secondary btn-sm gap-1"
              >
                {isLoading(r.title + '-view')
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Eye size={13} />}
                Preview
              </button>
            )}
            {r.pdfPath && r.pdfFile && (
              <button
                onClick={() => downloadPdf(r.pdfPath!, r.pdfFile!, r.title)}
                disabled={busy !== null}
                className="btn btn-primary btn-sm gap-1"
              >
                {isLoading(r.title + '-dl')
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Download size={13} />}
                PDF
              </button>
            )}
            {r.csvPath && (
              <button
                onClick={() => downloadCsv(r.csvPath!, r.title)}
                disabled={busy !== null}
                className="btn btn-secondary btn-sm gap-1"
              >
                {isLoading(r.title + '-csv')
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Download size={13} />}
                {r.csvLabel ?? 'CSV'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Download size={22} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        </div>

        {months.length > 0 && (
          <div className="mb-6">
            <label className="label">Month</label>
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

        {/* PDF Preview Panel */}
        {previewUrl && (
          <div className="card mb-6 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-700">{previewTitle}</span>
              <button onClick={closePreview} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>
            <iframe
              src={previewUrl}
              className="w-full"
              style={{ height: '70vh' }}
              title={previewTitle}
            />
          </div>
        )}

        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Monthly Reports</h2>
        <div className="space-y-3 mb-8">
          {monthlyReports.map(r => <ReportCard key={r.title} r={r} />)}
        </div>

        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">All-Time Reports</h2>
        <div className="space-y-3">
          {globalReports.map(r => <ReportCard key={r.title} r={r} />)}
        </div>
      </div>
    </Layout>
  )
}
