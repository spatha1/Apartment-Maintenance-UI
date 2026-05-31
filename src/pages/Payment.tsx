import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, IndianRupee, CheckCircle2, Copy, Check } from 'lucide-react'
import Layout from '../components/Layout'
import { api, staticUrl } from '../api/client'
import type { SummaryRow } from '../types'

export default function Payment() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const monthId = Number(params.get('month_id'))
  const flatNo = params.get('flat_no') ?? ''
  const amountParam = params.get('amount')

  const [row, setRow] = useState<SummaryRow | null>(null)
  const [qrUrl, setQrUrl] = useState('/static/images/upi-qr.svg')
  const [mobile, setMobile] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.get<{ qr_url: string; upi_mobile: string }>('/settings/qr').then(r => {
      setQrUrl(r.qr_url)
      setMobile(r.upi_mobile ?? '')
    })
    if (monthId && flatNo) {
      api.get<SummaryRow[]>(`/months/${monthId}/summary`)
        .then(rows => setRow(rows.find(r => r.flat_no === flatNo) ?? null))
    }
  }, [monthId, flatNo])

  function copyMobile() {
    if (!mobile) return
    navigator.clipboard.writeText(mobile).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const displayAmount = row
    ? row.grand_total
    : amountParam ? parseFloat(amountParam) : null

  return (
    <Layout>
      <div className="max-w-xs mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-6"
        >
          <ArrowLeft size={15} /> Back
        </button>

        <div className="card p-6 text-center shadow-md">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Pay Maintenance</h1>
          <p className="text-gray-500 text-sm mb-4">Flat {flatNo}</p>

          {displayAmount !== null && (
            <div className="mb-5 bg-blue-50 rounded-xl px-4 py-3">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-blue-700">
                <IndianRupee size={20} />
                {displayAmount.toFixed(2)}
              </div>
              {row?.carried_forward !== undefined && row.carried_forward > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Includes ₹{row.carried_forward.toFixed(0)} previous due
                </p>
              )}
              {row?.status === 'Paid' && (
                <div className="mt-2 flex items-center justify-center gap-1 text-emerald-600 text-sm font-semibold">
                  <CheckCircle2 size={14} /> Already Paid
                </div>
              )}
            </div>
          )}

          {/* QR code */}
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 mb-4">
            <img
              src={staticUrl(qrUrl)}
              alt="UPI QR"
              className="w-56 h-56 mx-auto object-contain"
            />
          </div>

          <p className="text-xs text-gray-400 mb-4">
            Scan with any UPI app to pay
          </p>

          {/* Mobile number with copy */}
          {mobile && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div className="text-left">
                <p className="text-xs text-gray-400 mb-0.5">Or pay to mobile number</p>
                <p className="text-base font-semibold text-gray-900 tracking-wider">{mobile}</p>
              </div>
              <button
                onClick={copyMobile}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors shrink-0"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
