import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Camera, Save, AlertCircle, Lock, ChevronDown,
  Droplets, ZoomIn, CheckCircle2,
} from 'lucide-react'
import Layout from '../components/Layout'
import { api } from '../api/client'
import type { Month, WaterReadingsData, WaterSource } from '../types'

interface WaterSourceBody { tankers_count: number; tanker_price: number; other_water_cost: number; total_liters: number }

export default function Water() {
  const { monthId } = useParams<{ monthId: string }>()
  const mid = Number(monthId)
  const navigate = useNavigate()

  const [month, setMonth] = useState<Month | null>(null)
  const [data, setData] = useState<WaterReadingsData | null>(null)
  const [source, setSource] = useState<WaterSource | null>(null)
  const [sourceForm, setSourceForm] = useState<WaterSourceBody>({
    tankers_count: 0, tanker_price: 0, other_water_cost: 0, total_liters: 0,
  })
  const [selectedFlat, setSelectedFlat] = useState<string>('')
  const [prevReadingInput, setPrevReadingInput] = useState<string>('0')
  const [currentReading, setCurrentReading] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [savingReading, setSavingReading] = useState(false)
  const [savingSource, setSavingSource] = useState(false)
  const [savedSource, setSavedSource] = useState(false)
  const [savedReading, setSavedReading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get<Month[]>('/months').then(ms => setMonth(ms.find(m => m.month_id === mid) ?? null))
    api.get<WaterSource>(`/months/${mid}/water-source`).then(s => {
      setSource(s)
      setSourceForm({
        tankers_count: s.tankers_count,
        tanker_price: s.tanker_price,
        other_water_cost: s.other_water_cost,
        total_liters: s.total_liters,
      })
    })
    api.get<WaterReadingsData>(`/months/${mid}/water-readings`).then(d => {
      setData(d)
      const first = d.flats[0] ?? ''
      setSelectedFlat(first)
      if (first) {
        const existing = d.readings[first]
        setPrevReadingInput(String(existing?.previous_reading ?? d.previous[first] ?? 0))
        setCurrentReading(existing ? String(existing.current_reading) : '')
      }
    })
  }, [mid])

  const isLocked = month?.is_locked ?? false

  function selectFlat(flat: string) {
    setSelectedFlat(flat)
    setImageUrl('')
    setError('')
    if (data) {
      const existing = data.readings[flat]
      setPrevReadingInput(String(existing?.previous_reading ?? data.previous[flat] ?? 0))
      setCurrentReading(existing ? String(existing.current_reading) : '')
    }
  }

  async function uploadMeter() {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('meter_image', file)
      const res = await api.postForm<{ detected: string; image_url: string }>(
        `/months/${mid}/upload-meter/${selectedFlat}`,
        fd,
      )
      setImageUrl(res.image_url)
      if (res.detected) {
        setCurrentReading(res.detected)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function saveReading(e: React.FormEvent) {
    e.preventDefault()
    setSavingReading(true)
    setError('')
    try {
      const r = await api.post(`/months/${mid}/water-readings/${selectedFlat}`, {
        previous_reading: parseFloat(prevReadingInput) || 0,
        current_reading: parseFloat(currentReading) || 0,
        image_url: imageUrl,
      })
      setData(prev => prev ? {
        ...prev,
        readings: { ...prev.readings, [selectedFlat]: r as WaterReadingsData['readings'][string] },
      } : prev)
      setSavedReading(true)
      setTimeout(() => setSavedReading(false), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSavingReading(false)
    }
  }

  async function saveSource(e: React.FormEvent) {
    e.preventDefault()
    setSavingSource(true)
    setError('')
    try {
      const s = await api.put<WaterSource>(`/months/${mid}/water-source`, sourceForm)
      setSource(s)
      setSavedSource(true)
      setTimeout(() => setSavedSource(false), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save water source')
    } finally {
      setSavingSource(false)
    }
  }

  const totalCost =
    sourceForm.tankers_count * sourceForm.tanker_price + sourceForm.other_water_cost
  const ratePerLitre = sourceForm.total_liters > 0 ? totalCost / sourceForm.total_liters : 0

  return (
    <Layout monthId={mid}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Water Entry</h1>
          {month && <p className="text-gray-500 text-sm mt-0.5">{month.name}</p>}
        </div>
        {isLocked && <span className="badge-locked"><Lock size={11} /> Finalized</span>}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-6">
        {/* Left: source + meter */}
        <div className="sm:col-span-2 space-y-4">
          {/* Water source */}
          <form onSubmit={saveSource} className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Droplets size={18} className="text-cyan-500" /> Water Source
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([
                ['tankers_count', 'Tanker Count', '0', 'number'],
                ['tanker_price', 'Price/Tanker ₹', '0', 'number'],
                ['other_water_cost', 'Manjeera/Other ₹', '0', 'number'],
                ['total_liters', 'Total Litres', '0', 'number'],
              ] as const).map(([key, lbl, ph]) => (
                <div key={key}>
                  <label className="label">{lbl}</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={ph}
                    value={sourceForm[key as keyof WaterSourceBody]}
                    onChange={e => setSourceForm(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
                    disabled={isLocked}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Total: <span className="font-semibold text-gray-900">₹{totalCost.toFixed(2)}</span>
                {' · '}Rate: <span className="font-semibold text-blue-600">₹{ratePerLitre.toFixed(4)}/L</span>
              </div>
              {!isLocked && (
                <button
                  type="submit"
                  disabled={savingSource}
                  className={`btn btn-sm ${savedSource ? 'btn-success' : 'btn-primary'}`}
                >
                  <Save size={14} />
                  {savingSource ? 'Saving…' : savedSource ? 'Saved!' : 'Save Source'}
                </button>
              )}
            </div>
          </form>

          {/* Flat selector + meter */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Camera size={18} className="text-blue-500" /> Meter Reading
            </h2>

            {/* Flat selector */}
            <div className="mb-4">
              <label className="label">Select Flat</label>
              <div className="relative w-40">
                <select
                  className="input pr-8 appearance-none"
                  value={selectedFlat}
                  onChange={e => selectFlat(e.target.value)}
                >
                  {data?.flats.map(f => (
                    <option key={f} value={f}>
                      {f}{data.readings[f] ? ' ✓' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Image upload */}
            {!isLocked && (
              <div className="flex items-center gap-3 mb-4">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={uploadMeter}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="btn-secondary"
                >
                  <Camera size={16} />
                  {uploading ? 'Detecting…' : 'Upload / Capture'}
                </button>
                {uploading && (
                  <span className="text-sm text-gray-500 flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    Reading with OCR…
                  </span>
                )}
              </div>
            )}

            {/* Image preview */}
            {imageUrl && (
              <div className="mb-4">
                <a href={imageUrl} target="_blank" rel="noopener" className="inline-block group relative">
                  <img
                    src={imageUrl}
                    alt="Meter"
                    className="h-28 w-auto object-cover rounded-lg border border-gray-200"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                    <ZoomIn size={20} className="text-white" />
                  </div>
                </a>
              </div>
            )}

            {/* Reading form */}
            <form onSubmit={saveReading} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Previous Reading</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    value={prevReadingInput}
                    onChange={e => setPrevReadingInput(e.target.value)}
                    disabled={isLocked}
                  />
                </div>
                <div>
                  <label className="label">Current Reading</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    value={currentReading}
                    onChange={e => setCurrentReading(e.target.value)}
                    placeholder="Enter reading"
                    disabled={isLocked}
                  />
                </div>
              </div>

              {(currentReading) && source && (
                <div className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  {(() => {
                    const cur = parseFloat(currentReading) || 0
                    const prev = parseFloat(prevReadingInput) || 0
                    const liters = Math.max(cur - prev, 0)
                    const amt = liters * source.rate_per_liter
                    return `${liters.toFixed(0)} L × ₹${source.rate_per_liter.toFixed(4)} = ₹${amt.toFixed(2)}`
                  })()}
                </div>
              )}

              {!isLocked && (
                <button
                  type="submit"
                  disabled={savingReading}
                  className={`btn btn-sm ${savedReading ? 'btn-success' : 'btn-primary'}`}
                >
                  <Save size={14} />
                  {savingReading ? 'Saving…' : savedReading ? 'Saved!' : 'Save Reading'}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Right: readings table */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-700">
            All Readings
          </div>
          <div className="overflow-y-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 uppercase">
                  <th className="px-3 py-2 text-left">Flat</th>
                  <th className="px-3 py-2 text-right">Litres</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data?.flats.map(flat => {
                  const r = data.readings[flat]
                  const isSelected = flat === selectedFlat
                  const liters = r ? Math.max(r.current_reading - r.previous_reading, 0) : null
                  const amount = (liters !== null && source) ? liters * source.rate_per_liter : null
                  return (
                    <tr
                      key={flat}
                      onClick={() => selectFlat(flat)}
                      className={`cursor-pointer border-b border-gray-50 transition-colors ${
                        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-3 py-2 font-medium flex items-center gap-1">
                        {r && <CheckCircle2 size={12} className="text-emerald-500" />}
                        {flat}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600">{liters !== null ? liters.toFixed(0) : '-'}</td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {amount !== null ? `₹${amount.toFixed(0)}` : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => navigate(`/summary/${mid}`)}
              className="btn-primary w-full justify-center btn-sm"
            >
              View Summary →
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
