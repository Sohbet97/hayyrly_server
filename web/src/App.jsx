import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './auth/LoginPage.jsx'
import { AdminLayout } from './components/shell/AdminShell.jsx'
import MapPage from './pages/MapPage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import OrderDetailPage from './pages/OrderDetailPage.jsx'
import BoardPage from './pages/BoardPage.jsx'
import DriversPage from './pages/DriversPage.jsx'
import DriverDetailPage from './pages/DriverDetailPage.jsx'
import ClientsPage from './pages/ClientsPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'
import PaymentsPage from './pages/PaymentsPage.jsx'
import BalanceRequestsPage from './pages/BalanceRequestsPage.jsx'
import SosPage from './pages/SosPage.jsx'
import SupportPage from './pages/SupportPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import { getToken, setToken } from './api/client.js'
import { me, logout as apiLogout } from './api/auth.js'

export default function App() {
  const [user, setUser]         = useState(null)   // null = not logged in
  const [checking, setChecking] = useState(true)    // restoring session on boot

  useEffect(() => {
    if (!getToken()) { setChecking(false); return }
    me().then(setUser).catch(() => setToken(null)).finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener('hayyrly:unauthorized', onUnauthorized)
    return () => window.removeEventListener('hayyrly:unauthorized', onUnauthorized)
  }, [])

  function login(u) { setUser(u) }
  function logout()  { apiLogout(); setUser(null) }

  if (checking) return null
  if (!user) return <LoginPage onLogin={login} />

  const shell = { user, onLogout: logout, onUserUpdate: setUser }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout user={user} onLogout={logout} />}>
          <Route path="/map"       element={<MapPage       shell={shell} />} />
          <Route path="/orders"    element={<OrdersPage    shell={shell} />} />
          <Route path="/orders/:id" element={<OrderDetailPage shell={shell} />} />
          <Route path="/board"     element={<BoardPage     shell={shell} />} />
          <Route path="/drivers"   element={<DriversPage   shell={shell} />} />
          <Route path="/drivers/:id" element={<DriverDetailPage shell={shell} />} />
          <Route path="/clients"   element={<ClientsPage   shell={shell} />} />
          <Route path="/analytics" element={<AnalyticsPage shell={shell} />} />
          <Route path="/payments"  element={<PaymentsPage  shell={shell} />} />
          <Route path="/balance-requests" element={<BalanceRequestsPage shell={shell} />} />
          <Route path="/sos" element={<SosPage shell={shell} />} />
          <Route path="/support" element={<SupportPage shell={shell} />} />
          <Route path="/settings"  element={<SettingsPage  shell={shell} />} />
          <Route path="/profile"   element={<ProfilePage   shell={shell} />} />
        </Route>
        <Route path="*" element={<Navigate to="/map" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
