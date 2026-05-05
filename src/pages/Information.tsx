import { useEffect, useState } from 'react'
import { Info, Plus, Trash2, Phone } from 'lucide-react'
import Layout from '../components/Layout'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import type { Notice } from '../types'

const PHONE_RE = /(\+?91[\s-]?)?[6-9]\d{9}/g

function renderContent(text: string) {
  const parts: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null
  PHONE_RE.lastIndex = 0
  while ((match = PHONE_RE.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    const num = match[0].replace(/[\s-]/g, '')
    parts.push(
      <a key={match.index} href={`tel:${num}`}
        className="inline-flex items-center gap-1 text-blue-600 font-medium hover:underline">
        <Phone size={13} />{match[0]}
      </a>
    )
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export default function Information() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [notices, setNotices] = useState<Notice[]>([])
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Notice[]>('/notices').then(setNotices).catch(() => setNotices([]))
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)
    setError('')
    try {
      const n = await api.post<Notice>('/notices', { content: content.trim() })
      setNotices(prev => [n, ...prev])
      setContent('')
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    await api.delete<{ ok: boolean }>(`/notices/${id}`)
    setNotices(prev => prev.filter(n => n.id !== id))
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Info size={22} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Information</h1>
        </div>

        {isAdmin && (
          <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Add a notice — include names, phone numbers, purpose..."
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={saving || !content.trim()}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus size={15} />
              {saving ? 'Saving...' : 'Add Notice'}
            </button>
          </form>
        )}

        {notices.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Info size={40} className="mx-auto mb-3 opacity-30" />
            <p>No notices yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map(n => (
              <div key={n.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {renderContent(n.content)}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {n.created_by} · {n.created_at}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
