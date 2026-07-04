import { useState, useEffect } from 'react'
import { TZ, applyTheme } from './design/tokens.js'
import LoginPage from './auth/LoginPage.jsx'
import MapPage from './pages/MapPage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import BoardPage from './pages/BoardPage.jsx'
import DriversPage from './pages/DriversPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import { getToken, setToken } from './api/client.js'
import { me, logout as apiLogout } from './api/auth.js'

export default function App() {
  const [user, setUser]         = useState(null)   // null = not logged in
  const [checking, setChecking] = useState(true)    // restoring session on boot
  const [page, setPage]         = useState('map')
  const [lang, setLang]         = useState('tk')
  const [theme, setTheme]       = useState('light')

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

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    applyTheme(next)
    setTheme(next)
  }

  if (checking) return null
  if (!user) return <LoginPage onLogin={login} />

  const shell = { page, setPage, lang, setLang, theme, toggleTheme, user, onLogout: logout }

  const pages = {
    map:       <MapPage       shell={shell} />,
    orders:    <OrdersPage    shell={shell} />,
    board:     <BoardPage     shell={shell} />,
    drivers:   <DriversPage   shell={shell} />,
    analytics: <AnalyticsPage shell={shell} />,
    settings:  <SettingsPage  shell={shell} />,
  }

  return pages[page] ?? pages.map
}
