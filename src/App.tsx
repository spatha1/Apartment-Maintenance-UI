import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Water from './pages/Water'
import Summary from './pages/Summary'
import MyBill from './pages/MyBill'
import Payment from './pages/Payment'
import Settings from './pages/Settings'
import Reports from './pages/Reports'
import Information from './pages/Information'
import Pool from './pages/Pool'

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return user.role === 'admin'
    ? <Navigate to="/" replace />
    : <Navigate to="/my-bill" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin routes */}
          <Route path="/" element={
            <ProtectedRoute adminOnly>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/expenses/:monthId" element={
            <ProtectedRoute adminOnly>
              <Expenses />
            </ProtectedRoute>
          } />
          <Route path="/water/:monthId" element={
            <ProtectedRoute adminOnly>
              <Water />
            </ProtectedRoute>
          } />
          <Route path="/summary/:monthId" element={
            <ProtectedRoute adminOnly>
              <Summary />
            </ProtectedRoute>
          } />
          <Route path="/payment" element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute adminOnly>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute adminOnly>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/pool" element={
            <ProtectedRoute adminOnly>
              <Pool />
            </ProtectedRoute>
          } />

          {/* Resident route */}
          <Route path="/my-bill" element={
            <ProtectedRoute>
              <MyBill />
            </ProtectedRoute>
          } />

          <Route path="/information" element={
            <ProtectedRoute>
              <Information />
            </ProtectedRoute>
          } />

          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
