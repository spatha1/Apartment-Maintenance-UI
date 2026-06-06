import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'
import type { User } from '../types'

interface AuthState {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

const USER_CACHE_KEY = 'auth_user'

function readCache(): User | null {
  try {
    return JSON.parse(localStorage.getItem(USER_CACHE_KEY) ?? 'null')
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readCache())
  // Only block rendering while validating an existing cached session.
  // First-time visitors (no cache) get loading=false immediately → login renders instantly.
  const [loading, setLoading] = useState(() => !!readCache())

  useEffect(() => {
    api.get<User>('/auth/me')
      .then(u => {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u))
        setUser(u)
      })
      .catch(() => {
        localStorage.removeItem(USER_CACHE_KEY)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(username: string, password: string) {
    const u = await api.post<User & { token?: string }>('/auth/login', { username, password })
    if (u.token) localStorage.setItem('auth_token', u.token)
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u))
    setUser(u)
  }

  async function logout() {
    await api.post('/auth/logout')
    localStorage.removeItem('auth_token')
    localStorage.removeItem(USER_CACHE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
