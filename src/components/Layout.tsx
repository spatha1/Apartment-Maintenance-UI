import { NavLink, useNavigate } from 'react-router-dom'
import {
  Building2, LayoutDashboard, Receipt, Droplets,
  BarChart3, LogOut, User, Download, Settings2, Info, IndianRupee, PiggyBank, ClipboardList,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  children: React.ReactNode
  monthId?: number
}

export default function Layout({ children, monthId }: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
    navigate('/login')
  }

  const residentLinks = user?.role !== 'admin' ? [
    { to: '/my-bill', icon: IndianRupee, label: 'My Bill', end: false },
  ] : []

  const commonLinks = [
    { to: '/information', icon: Info, label: 'Information', end: false },
  ]

  const adminLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    ...(monthId
      ? [
          { to: `/expenses/${monthId}`, icon: Receipt, label: 'Expenses', end: false },
          { to: `/water/${monthId}`, icon: Droplets, label: 'Water', end: false },
          { to: `/summary/${monthId}`, icon: BarChart3, label: 'Summary', end: false },
        ]
      : []),
    { to: '/activity', icon: ClipboardList, label: 'Activity', end: false },
    { to: '/reports', icon: Download, label: 'Reports', end: false },
    { to: '/pool', icon: PiggyBank, label: 'Pool', end: false },
    { to: '/settings', icon: Settings2, label: 'Settings', end: false },
  ]

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar: logo + user/logout only */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-gray-900 shrink-0">
            <Building2 size={20} className="text-blue-600" />
            <span className="hidden sm:inline">Apartment Maintenance</span>
            <span className="sm:hidden">AptMgmt</span>
          </div>

          {/* Desktop nav — hidden on mobile */}
          <nav className="hidden sm:flex items-center gap-1 overflow-x-auto">
            {user?.role === 'admin' && adminLinks.map(({ to, icon: Icon, label, end }) => (
              <NavLink key={to} to={to} end={end} className={navLinkClass}>
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
            {residentLinks.map(({ to, icon: Icon, label, end }) => (
              <NavLink key={to} to={to} end={end} className={navLinkClass}>
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
            {commonLinks.map(({ to, icon: Icon, label, end }) => (
              <NavLink key={to} to={to} end={end} className={navLinkClass}>
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* User info + logout */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <User size={15} />
              <span className="hidden sm:inline font-medium">{user?.username}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                user?.role === 'admin'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {user?.role === 'admin' ? 'Admin' : `Flat ${user?.flat_no}`}
              </span>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile nav — scrollable row, visible only on small screens */}
        <nav className="sm:hidden border-t border-gray-100 overflow-x-auto">
          <div className="flex items-center gap-1 px-3 py-2 min-w-max">
            {user?.role === 'admin' && adminLinks.map(({ to, icon: Icon, label, end }) => (
              <NavLink key={to} to={to} end={end} className={navLinkClass}>
                <Icon size={14} />
                <span className="text-xs">{label}</span>
              </NavLink>
            ))}
            {residentLinks.map(({ to, icon: Icon, label, end }) => (
              <NavLink key={to} to={to} end={end} className={navLinkClass}>
                <Icon size={14} />
                <span className="text-xs">{label}</span>
              </NavLink>
            ))}
            {commonLinks.map(({ to, icon: Icon, label, end }) => (
              <NavLink key={to} to={to} end={end} className={navLinkClass}>
                <Icon size={14} />
                <span className="text-xs">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      {/* Page content */}
      <main className="max-w-6xl mx-auto w-full px-4 py-6 flex-1">
        {children}
      </main>
    </div>
  )
}
