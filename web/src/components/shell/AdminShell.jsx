import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Map as MapIcon, Package, LayoutGrid, Users, UserCircle, BarChart2, Wallet, HandCoins, ShieldAlert, MessageCircle, Settings, LogOut, Sun, Moon, Search, X } from 'lucide-react'
import { useTZ } from '../../design/tokens.js'
import { useApi } from '../../api/useApi.js'
import { listOrders } from '../../api/orders.js'
import { listBalanceRequests } from '../../api/balanceRequests.js'
import { listSosAlerts } from '../../api/sos.js'
import { listSupportThreads } from '../../api/support.js'
import { getSocket, registerAdmin } from '../../api/socket.js'
import { setLang, toggleTheme } from '../../store/uiSlice.js'
import hayyrlyLogo from '../../assets/hayyrly-logo.png'

let alertAudioCtx = null

// Soft bell chime, no audio asset needed — a fundamental + quiet overtone
// with a gentle exponential decay, like a notification bell rather than a siren.
function playChime(strikeOffsets, freq, overtoneFreq) {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return
  if (!alertAudioCtx) alertAudioCtx = new Ctx()
  if (alertAudioCtx.state === 'suspended') alertAudioCtx.resume()

  const ctx = alertAudioCtx
  const now = ctx.currentTime

  function strike(time, f, peak, duration) {
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(f, time)
    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(peak, time + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(time)
    osc.stop(time + duration + 0.05)
  }

  strikeOffsets.forEach(offset => {
    strike(now + offset, freq, 0.16, 0.9)         // fundamental
    strike(now + offset, overtoneFreq, 0.05, 0.6) // soft overtone
  })
}

// SOS — two strikes, more urgent.
const playSosRing = () => playChime([0, 0.42], 987.77, 1975.5)     // B5 + B6
// Support — single, softer strike.
const playSupportChime = () => playChime([0], 783.99, 1567.98)     // G5 + G6
// New order — single, lower strike, distinct from support's chime.
const playOrderChime = () => playChime([0], 659.25, 1318.51)       // E5 + E6

const MAIN_NAV = [
  { id: 'map',       tk: 'Karta',         ru: 'Карта',          Icon: MapIcon    },
  { id: 'orders',    tk: 'Sargytlar',     ru: 'Заказы',         Icon: Package    },
  { id: 'board',     tk: 'Status tagtasy',ru: 'Доска статусов', Icon: LayoutGrid },
  { id: 'drivers',   tk: 'Sürüjiler',     ru: 'Водители',       Icon: Users      },
  { id: 'clients',   tk: 'Müşderiler',    ru: 'Клиенты',        Icon: UserCircle },
  { id: 'analytics', tk: 'Analitika',     ru: 'Аналитика',      Icon: BarChart2  },
  { id: 'payments',  tk: 'Töleg',         ru: 'Платежи',        Icon: Wallet     },
  { id: 'balance-requests', tk: 'Balans dolduryş', ru: 'Пополнения',   Icon: HandCoins },
  { id: 'sos',       tk: 'SOS signallar', ru: 'SOS-сигналы',   Icon: ShieldAlert },
  { id: 'support',   tk: 'Goldaw',        ru: 'Поддержка',     Icon: MessageCircle },
]

function NavItem({ id, label, Icon, active, badge, onClick }) {
  const TZ = useTZ()
  const on = active === id
  return (
    <button onClick={() => onClick(id)} type="button"
      className="w-full flex items-center gap-3 px-3 rounded-lg text-left transition-colors border-0"
      style={{
        padding: '9px 12px',
        color: on ? '#fff' : TZ.body,
        background: on ? TZ.navy : 'transparent',
        fontFamily: TZ.sans, fontSize: 14, fontWeight: on ? 600 : 500,
      }}
      onMouseEnter={e => { if (!on) { e.currentTarget.style.background = TZ.surface2; e.currentTarget.style.color = TZ.ink } }}
      onMouseLeave={e => { if (!on) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TZ.body } }}>
      <span style={{ color: on ? '#fff' : TZ.muted, display: 'flex' }}>
        <Icon size={18} strokeWidth={on ? 2.2 : 1.8} />
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && (
        <span style={{
          fontSize: 11, fontWeight: 700, borderRadius: 999,
          padding: '1px 7px', minWidth: 18, textAlign: 'center',
          color: on ? TZ.navy : '#fff',
          background: on ? '#fff' : TZ.orange,
        }}>{badge}</span>
      )}
    </button>
  )
}

function AdminSidebar({ page, user, onLogout, sosVersion, supportVersion, orderVersion }) {
  const lang = useSelector(state => state.ui.lang)
  const TZ = useTZ()
  const navigate = useNavigate()
  const { data } = useApi(() => listOrders({ status: 'created', limit: 1 }), [orderVersion])
  const pendingOrders = data?.total ?? 0
  const { data: balanceReqData } = useApi(() => listBalanceRequests({ status: 'pending', limit: 1 }), [])
  const pendingBalanceRequests = balanceReqData?.total ?? 0
  const { data: sosData } = useApi(() => listSosAlerts({ status: 'open', limit: 1 }), [sosVersion])
  const openSosAlerts = sosData?.total ?? 0
  const { data: supportData } = useApi(() => listSupportThreads({ limit: 100 }), [supportVersion])
  const unreadSupport = (supportData?.data ?? []).reduce((sum, th) => sum + Number(th.unread_count || 0), 0)
  const goTo = id => navigate(`/${id}`)

  return (
    <aside style={{ width: 232, background: TZ.surface, borderRight: `1px solid ${TZ.line}`,
      display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100%' }}>

      {/* Brand */}
      <div style={{ padding: '18px 18px 20px', borderBottom: `1px solid ${TZ.lineSoft}`,
        display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src={hayyrlyLogo} alt="Hayyrly"
          style={{ height: 44, width: 44, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ fontFamily: TZ.sans, fontWeight: 800, fontSize: 15,
            color: TZ.navy, letterSpacing: -0.4 }}>Hayyrly</div>
          <div style={{ fontFamily: TZ.sans, fontWeight: 600, fontSize: 10.5,
            color: TZ.faint, letterSpacing: 0.6, textTransform: 'uppercase' }}>Admin Panel</div>
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column',
        gap: 2, overflowY: 'auto' }}>
        <div style={{ fontFamily: TZ.sans, fontSize: 10, fontWeight: 700, letterSpacing: 1.4,
          color: TZ.faint, textTransform: 'uppercase', padding: '6px 12px 8px' }}>
          {lang === 'ru' ? 'Управление' : 'Dolandyryş'}
        </div>

        {MAIN_NAV.map(({ id, tk, ru, Icon }) => {
          const badge =
            id === 'orders' && pendingOrders > 0 ? pendingOrders :
            id === 'balance-requests' && pendingBalanceRequests > 0 ? pendingBalanceRequests :
            id === 'sos' && openSosAlerts > 0 ? openSosAlerts :
            id === 'support' && unreadSupport > 0 ? unreadSupport :
            null
          return (
            <NavItem key={id} id={id} label={lang === 'ru' ? ru : tk} Icon={Icon}
              active={page} badge={badge} onClick={goTo} />
          )
        })}

        {/* Settings — separated */}
        <div style={{ marginTop: 6, paddingTop: 8, borderTop: `1px solid ${TZ.lineSoft}` }}>
          <NavItem id="settings" label={lang === 'ru' ? 'Настройки' : 'Sazlamalar'}
            Icon={Settings} active={page} onClick={goTo} />
        </div>
      </nav>

      {/* User */}
      <div style={{ padding: 12, borderTop: `1px solid ${TZ.lineSoft}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px' }}>
          <button onClick={() => navigate('/profile')} type="button" title={lang === 'ru' ? 'Профиль' : 'Profil'}
            style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0,
              background: 'transparent', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 32, height: 32, borderRadius: 16, background: TZ.navySoft,
              color: TZ.navy, fontFamily: TZ.sans, fontWeight: 700, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {(user?.name || 'Admin').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
              <div style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 600, color: TZ.text,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Admin'}
              </div>
              <div style={{ fontFamily: TZ.sans, fontSize: 11, color: TZ.muted }}>
                {user?.role === 'admin' ? 'Admin' : (lang === 'ru' ? 'Диспетчер' : 'Dispetçer')}
              </div>
            </div>
          </button>
          <button onClick={onLogout} type="button" title="Çyk"
            style={{ background: 'transparent', border: 0, color: TZ.faint,
              display: 'flex', cursor: 'pointer', transition: 'color 0.15s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = TZ.muted}
            onMouseLeave={e => e.currentTarget.style.color = TZ.faint}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function AdminTopbar({ title, subtitle, actions }) {
  const lang = useSelector(state => state.ui.lang)
  const theme = useSelector(state => state.ui.theme)
  const TZ = useTZ()
  const dispatch = useDispatch()
  const placeholder = lang === 'ru' ? 'Поиск заказов, водителей…' : 'Sargyt, sürüji gözle…'

  return (
    <header style={{ height: 60, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16,
      padding: '0 24px', background: TZ.surface, borderBottom: `1px solid ${TZ.line}` }}>

      {/* Title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: TZ.sans, fontSize: 19, fontWeight: 700, color: TZ.ink,
          letterSpacing: -0.3, lineHeight: 1 }}>{title}</div>
        {subtitle && (
          <div style={{ fontFamily: TZ.sans, fontSize: 12.5, color: TZ.muted, marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 12px', borderRadius: 8, background: TZ.surface2, width: 196 }}>
          <Search size={15} color={TZ.muted} style={{ flexShrink: 0 }} />
          <input readOnly placeholder={placeholder}
            style={{ flex: 1, border: 0, outline: 'none', background: 'transparent',
              fontFamily: TZ.sans, fontSize: 13, color: TZ.muted, minWidth: 0, cursor: 'pointer' }} />
          <kbd style={{ fontFamily: TZ.mono, fontSize: 10.5, color: TZ.faint, flexShrink: 0,
            padding: '1px 5px', borderRadius: 4, border: `1px solid ${TZ.line}`,
            background: 'transparent', lineHeight: 1.5 }}>⌘K</kbd>
        </div>

        {/* Lang toggle */}
        <div style={{ display: 'flex', background: TZ.surface2, borderRadius: 8, padding: 3 }}>
          {['tk', 'ru'].map(l => (
            <button key={l} onClick={() => dispatch(setLang(l))} type="button"
              style={{ border: 0, padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
                fontFamily: TZ.sans, fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                background: lang === l ? TZ.surface : 'transparent',
                color: lang === l ? TZ.ink : TZ.muted,
                boxShadow: lang === l ? '0 1px 2px rgba(0,0,0,0.06)' : 'none' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Theme toggle */}
        <button onClick={() => dispatch(toggleTheme())} type="button"
          style={{ width: 36, height: 36, display: 'flex', alignItems: 'center',
            justifyContent: 'center', borderRadius: 8, background: TZ.surface2,
            border: 0, color: TZ.body, cursor: 'pointer' }}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{actions}</div>}
      </div>
    </header>
  )
}

function AlertToasts({ toasts, onDismiss, onView }) {
  const TZ = useTZ()
  if (toasts.length === 0) return null

  const KINDS = {
    sos: {
      color: TZ.red, colorSoft: TZ.redSoft, Icon: ShieldAlert, title: 'New SOS alert',
      body: item => (
        <>
          <div style={{ fontFamily: TZ.mono, fontSize: 12.5, fontWeight: 600, color: TZ.body, marginTop: 2 }}>
            {item.phone}
          </div>
          {item.note && (
            <div style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.muted, marginTop: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.note}</div>
          )}
        </>
      ),
    },
    support: {
      color: TZ.navy, colorSoft: TZ.navySoft, Icon: MessageCircle, title: 'New support message',
      body: item => (
        <>
          <div style={{ fontFamily: TZ.sans, fontSize: 12.5, fontWeight: 600, color: TZ.body, marginTop: 2 }}>
            {`User #${item.user_id}`}
          </div>
          <div style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.muted, marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.message || (item.photo_url ? '📷' : '')}
          </div>
        </>
      ),
    },
    order: {
      color: TZ.orange, colorSoft: TZ.orangeSoft, Icon: Package, title: 'New order',
      body: item => (
        <>
          <div style={{ fontFamily: TZ.sans, fontSize: 12.5, fontWeight: 600, color: TZ.body, marginTop: 2 }}>
            {`Order #${item.id}`}
          </div>
          <div style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.muted, marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.start_address}
          </div>
        </>
      ),
    },
  }

  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 10000,
      display: 'flex', flexDirection: 'column', gap: 8, width: 320 }}>
      {toasts.map(item => {
        const kind = KINDS[item.kind]
        return (
          <div key={item._key} style={{ background: TZ.surface, border: `1px solid ${kind.color}`,
            borderRadius: 12, padding: '12px 14px', boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ display: 'flex', width: 28, height: 28, borderRadius: 8, background: kind.colorSoft,
              color: kind.color, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <kind.Icon size={15} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 700, color: TZ.ink }}>
                {kind.title}
              </div>
              {kind.body(item)}
              <button type="button" onClick={() => onView(item)}
                style={{ marginTop: 8, border: 0, borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
                  background: kind.color, color: '#fff', fontFamily: TZ.sans, fontSize: 12, fontWeight: 700 }}>
                View
              </button>
            </div>
            <button type="button" onClick={() => onDismiss(item._key)}
              style={{ background: 'none', border: 0, cursor: 'pointer', color: TZ.faint, padding: 2, flexShrink: 0 }}>
              <X size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

const HeaderContext = createContext(() => {})

export function AdminLayout({ user, onLogout }) {
  const TZ = useTZ()
  const location = useLocation()
  const navigate = useNavigate()
  const active = location.pathname.split('/')[1] || 'map'
  const [header, setHeader] = useState({ title: '', subtitle: '', actions: null })
  const [sosVersion, setSosVersion] = useState(0)
  const [supportVersion, setSupportVersion] = useState(0)
  const [orderVersion, setOrderVersion] = useState(0)
  const [toasts, setToasts] = useState([])
  const toastTimers = useRef(new Map())

  const TOAST_LIFETIME_MS = 8000

  function dismissToast(key) {
    clearTimeout(toastTimers.current.get(key))
    toastTimers.current.delete(key)
    setToasts(t => t.filter(x => x._key !== key))
  }

  function pushToast(toast) {
    setToasts(t => [...t, toast])
    toastTimers.current.set(toast._key, setTimeout(() => dismissToast(toast._key), TOAST_LIFETIME_MS))
  }

  // Global — mounted once for the whole admin session, so these fire
  // regardless of which page is open (server/socket/sosSocket.js: 'sos:alert',
  // server/socket/supportSocket.js: 'support:message', server/socket/orderSocket.js: 'order:new').
  useEffect(() => {
    registerAdmin()
    const socket = getSocket()

    const onSosAlert = (alert) => {
      setSosVersion(v => v + 1)
      pushToast({ ...alert, kind: 'sos', _key: `sos-${alert.id}-${Date.now()}` })
      playSosRing()
    }
    // admin:support only ever receives user-sent messages (admin replies go
    // out over REST — see server/modules/admin/controllers/supportController.js).
    const onSupportMessage = (row) => {
      if (row.sender_type === 'admin') return
      setSupportVersion(v => v + 1)
      pushToast({ ...row, kind: 'support', _key: `support-${row.id}-${Date.now()}` })
      playSupportChime()
    }
    const onOrderNew = (order) => {
      setOrderVersion(v => v + 1)
      pushToast({ ...order, kind: 'order', _key: `order-${order.id}-${Date.now()}` })
      playOrderChime()
    }

    socket.on('sos:alert', onSosAlert)
    socket.on('support:message', onSupportMessage)
    socket.on('order:new', onOrderNew)
    return () => {
      socket.off('sos:alert', onSosAlert)
      socket.off('support:message', onSupportMessage)
      socket.off('order:new', onOrderNew)
      toastTimers.current.forEach(clearTimeout)
      toastTimers.current.clear()
    }
  }, [])

  function viewToast(item) {
    dismissToast(item._key)
    navigate(item.kind === 'sos' ? '/sos' : item.kind === 'support' ? '/support' : '/orders')
  }

  return (
    <div className="flex h-full overflow-hidden" style={{ background: TZ.surface2 }}>
      <AdminSidebar page={active} user={user} onLogout={onLogout}
        sosVersion={sosVersion} supportVersion={supportVersion} orderVersion={orderVersion} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <AdminTopbar title={header.title} subtitle={header.subtitle} actions={header.actions} />
        <main className="flex-1 min-h-0 overflow-hidden">
          <HeaderContext.Provider value={setHeader}>
            <Outlet />
          </HeaderContext.Provider>
        </main>
      </div>
      <AlertToasts toasts={toasts} onDismiss={dismissToast} onView={viewToast} />
    </div>
  )
}

export function usePageHeader({ title, subtitle, actions }) {
  const setHeader = useContext(HeaderContext)
  useEffect(() => {
    setHeader({ title, subtitle, actions })
  })
}
