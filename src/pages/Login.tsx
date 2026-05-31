import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) {
    navigate(user.role === 'admin' ? '/' : '/my-bill', { replace: true })
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <img
              src="/building.jpg"
              alt="Sai Nirmans Modulus"
              className="w-24 h-24 rounded-2xl object-cover shadow-lg mx-auto"
              onError={e => {
                const el = e.target as HTMLImageElement
                el.style.display = 'none'
                el.nextElementSibling?.classList.remove('hidden')
              }}
            />
            <div className="hidden w-24 h-24 bg-blue-600 rounded-2xl shadow-lg mx-auto flex items-center justify-center">
              <span className="text-white text-2xl font-black">SNM</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Sai Nirmans</h1>
          <h2 className="text-2xl font-black text-red-600 tracking-widest uppercase">Modulus</h2>
          <p className="text-gray-500 text-sm mt-1">Maintenance Management</p>
        </div>

        {/* Card */}
        <div className="card p-6 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username / Flat No.</label>
              <input
                className="input"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin or 101"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Residents: use flat number as both username and password
        </p>
      </div>
    </div>
  )
}
