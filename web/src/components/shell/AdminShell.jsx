import { Map, Package, LayoutGrid, Users, BarChart2, Settings, LogOut, Bell, Sun, Moon, Search } from 'lucide-react'
import { TZ } from '../../design/tokens.js'
import { ORDERS } from '../../data/mock.js'
import hayyrlyLogo from '../../assets/hayyrly-logo.png'

const MAIN_NAV = [
  { id: 'map',       tk: 'Karta',         ru: 'Karta',          Icon: Map        },
  { id: 'orders',    tk: 'Sargytlar',     ru: 'Sargytlar',      Icon: Package    },
  { id: 'board',     tk: 'Status tagtasy',ru: 'Status tagtasy', Icon: LayoutGrid },
  { id: 'drivers',   tk: 'Sürüjiler',     ru: 'Sürüjiler',      Icon: Users      },
  { id: 'analytics', tk: 'Analitika',     ru: 'Analitika',      Icon: BarChart2  },
]

function NavItem({ id, label, Icon, active, badge, onClick }) {
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

function AdminSidebar({ page, setPage, user, onLogout, lang = 'tk' }) {
  const pendingOrders = ORDERS.filter(o => o.status === 'pending').length

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

        {MAIN_NAV.map(({ id, tk, ru, Icon }) => (
          <NavItem key={id} id={id} label={lang === 'ru' ? ru : tk} Icon={Icon}
            active={page} badge={id === 'orders' && pendingOrders > 0 ? pendingOrders : null}
            onClick={setPage} />
        ))}

        {/* Settings — separated */}
        <div style={{ marginTop: 6, paddingTop: 8, borderTop: `1px solid ${TZ.lineSoft}` }}>
          <NavItem id="settings" label={lang === 'ru' ? 'Настройки' : 'Sazlamalar'}
            Icon={Settings} active={page} onClick={setPage} />
        </div>
      </nav>

      {/* User */}
      <div style={{ padding: 12, borderTop: `1px solid ${TZ.lineSoft}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px' }}>
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
              {user?.role === 'admin' ? 'Admin' : 'Dispetçer'}
            </div>
          </div>
          <button onClick={onLogout} type="button" title="Çyk"
            style={{ background: 'transparent', border: 0, color: TZ.faint,
              display: 'flex', cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = TZ.muted}
            onMouseLeave={e => e.currentTarget.style.color = TZ.faint}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function AdminTopbar({ title, subtitle, lang, setLang, theme, toggleTheme, actions }) {
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
            <button key={l} onClick={() => setLang(l)} type="button"
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
        <button onClick={toggleTheme} type="button"
          style={{ width: 36, height: 36, display: 'flex', alignItems: 'center',
            justifyContent: 'center', borderRadius: 8, background: TZ.surface2,
            border: 0, color: TZ.body, cursor: 'pointer' }}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Bell */}
        <button type="button"
          style={{ width: 36, height: 36, display: 'flex', alignItems: 'center',
            justifyContent: 'center', borderRadius: 8, background: TZ.surface2,
            border: 0, color: TZ.body, cursor: 'pointer', position: 'relative' }}>
          <Bell size={15} />
          <span style={{ position: 'absolute', top: 7, right: 7, width: 8, height: 8,
            borderRadius: 4, background: TZ.orange, boxShadow: `0 0 0 2px ${TZ.surface2}` }} />
        </button>

        {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{actions}</div>}
      </div>
    </header>
  )
}

export function AdminShell({ children, active, title, subtitle, lang, setLang, theme, toggleTheme, page, setPage, user, onLogout, actions }) {
  return (
    <div className="flex h-full overflow-hidden" style={{ background: TZ.surface2 }}>
      <AdminSidebar page={active ?? page} setPage={setPage} user={user} onLogout={onLogout} lang={lang} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <AdminTopbar title={title} subtitle={subtitle} lang={lang} setLang={setLang}
          theme={theme} toggleTheme={toggleTheme} actions={actions} />
        <main className="flex-1 min-h-0 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
