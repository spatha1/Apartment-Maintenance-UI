import { useEffect, useRef, useState } from 'react'
import { Settings2, Upload, CheckCircle2, AlertCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { api, staticUrl } from '../api/client'

export default function Settings() {
  const [qrUrl, setQrUrl] = useState('/static/images/upi-qr.svg')
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get<{ qr_url: string }>('/settings/qr').then(r => setQrUrl(r.qr_url))
  }, [])

  async function uploadQR(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    setSaved(false)
    try {
      const fd = new FormData()
      fd.append('qr_image', file)
      const r = await api.postForm<{ qr_url: string }>('/settings/qr', fd)
      setQrUrl(r.qr_url + '?t=' + Date.now())
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Settings2 size={22} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Payment QR Code</h2>
          <p className="text-sm text-gray-500 mb-5">
            Upload the UPI QR code that residents will scan to pay. You can change it anytime.
          </p>

          {/* Current QR preview */}
          <div className="flex justify-center mb-5">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
              <img
                src={staticUrl(qrUrl)}
                alt="Current QR"
                className="w-48 h-48 object-contain"
              />
            </div>
          </div>

          {saved && (
            <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm mb-4">
              <CheckCircle2 size={15} /> QR updated successfully
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={uploadQR}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn-primary w-full justify-center"
          >
            <Upload size={16} />
            {uploading ? 'Uploading…' : 'Upload New QR Image'}
          </button>
          <p className="text-xs text-gray-400 text-center mt-3">
            PNG, JPG or SVG — will replace the current QR immediately
          </p>
        </div>
      </div>
    </Layout>
  )
}
