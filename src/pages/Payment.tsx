import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, IndianRupee, CheckCircle2 } from 'lucide-react'
import Layout from '../components/Layout'
import { api } from '../api/client'
import type { SummaryRow } from '../types'

export default function Payment() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const monthId = Number(params.get('month_id'))
  const flatNo = params.get('flat_no') ?? ''
  const amountParam = params.get('amount')

  const [row, setRow] = useState<SummaryRow | null>(null)
  const [qrUrl, setQrUrl] = useState('/static/images/upi-qr.svg')

  useEffect(() => {
    api.get<{ qr_url: string }>('/settings/qr').then(r => setQrUrl(r.qr_url))
    if (monthId && flatNo) {
      api.get<SummaryRow[]>(`/months/${monthId}/summary`)
        .then(rows => setRow(rows.find(r => r.flat_no === flatNo) ?? null))
    }
  }, [monthId, flatNo])

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
              src={qrUrl}
              alt="UPI QR"
              className="w-56 h-56 mx-auto object-contain"
            />
          </div>

          <p className="text-xs text-gray-400">
            Scan with any UPI app to pay
          </p>
        </div>
      </div>
    </Layout>
  )
}
