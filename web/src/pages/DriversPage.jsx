import { useState } from 'react'
import { Plus, Search, MoreHorizontal, Phone, Map, X, Check } from 'lucide-react'
import { AdminShell } from '../components/shell/AdminShell.jsx'
import { StatusPill, Avatar } from '../design/atoms.jsx'
import { TZ } from '../design/tokens.js'
import { DRIVERS, PENDING_APPS } from '../data/mock.js'

const STATUS_DOT = d =>
  d.offline ? TZ.faint : d.idle ? TZ.amber : d.status === 'online' ? TZ.green : TZ.green

export default function DriversPage({ shell }) {
  const [tab,      setTab]      = useState('drivers')
  const [search,   setSearch]   = useState('')
  const [apps,     setApps]     = useState(PENDING_APPS)
  const [rejectId, setRejectId] = useState(null)
  const [reason,   setReason]   = useState('')

  const filtered = DRIVERS.filter(d =>
    !search ||
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.plate.toLowerCase().includes(search.toLowerCase())
  )
  const pending = apps.filter(a => a.status === 'pending')

  function approve(id) {
    setApps(p => p.map(a => a.id === id ? { ...a, status: 'approved' } : a))
  }
  function reject(id) {
    setApps(p => p.map(a => a.id === id ? { ...a, status: 'rejected', reason } : a))
    setRejectId(null); setReason('')
  }

  return (
    <AdminShell {...shell}
      active="drivers"
      title="Sürüjiler"
      subtitle={`${DRIVERS.length} adam · ${DRIVERS.filter(d => !d.offline).length} nobatda · ${pending.length} garaşýan arza`}
      actions={
        <button type="button"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            border: 0, borderRadius: 8, background: TZ.navy, color: '#fff',
            fontFamily: TZ.sans, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Plus size={13} /> Sürüji goş
        </button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
        padding: '14px 16px', gap: 12, overflow: 'hidden' }}>

        {/* ── Tabs + search ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ display: 'flex', background: TZ.surface2, border: `1px solid ${TZ.line}`,
            borderRadius: 9, padding: 3, gap: 2 }}>
            {[
              { id: 'drivers', label: 'Sürüjiler', n: DRIVERS.length, badge: false },
              { id: 'apps',    label: 'Arzalar',   n: pending.length, badge: true  },
            ].map(t => {
              const on = t.id === tab
              return (
                <button key={t.id} onClick={() => setTab(t.id)} type="button"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
                    fontFamily: TZ.sans, fontSize: 13, fontWeight: on ? 700 : 500,
                    border: 0, background: on ? TZ.surface : 'transparent',
                    color: on ? TZ.ink : TZ.muted,
                    boxShadow: on ? '0 1px 3px rgba(0,0,0,0.07)' : 'none',
                    transition: 'all 0.12s',
                  }}>
                  {t.label}
                  <span style={{ fontFamily: TZ.mono, fontSize: 11,
                    color: on ? TZ.muted : TZ.faint }}>{t.n}</span>
                  {t.badge && t.n > 0 && (
                    <span style={{ fontFamily: TZ.sans, fontSize: 10, fontWeight: 700,
                      color: '#fff', background: TZ.orange,
                      borderRadius: 10, padding: '1px 6px', lineHeight: 1.6 }}>{t.n}</span>
                  )}
                </button>
              )
            })}
          </div>

          <div style={{ flex: 1 }} />

          {tab === 'drivers' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
              borderRadius: 8, background: TZ.surface, border: `1px solid ${TZ.line}`, width: 220 }}>
              <Search size={14} color={TZ.muted} style={{ flexShrink: 0 }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ady, belgisi…"
                style={{ flex: 1, border: 0, outline: 'none', background: 'transparent',
                  fontFamily: TZ.sans, fontSize: 13, color: TZ.ink, minWidth: 0 }} />
            </div>
          )}
        </div>

        {/* ── Drivers grid ── */}
        {tab === 'drivers' && (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, alignContent: 'start' }}>
            {filtered.map(d => (
              <div key={d.id} style={{
                background: TZ.surface, border: `1px solid ${TZ.line}`, borderRadius: 12,
                padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
                opacity: d.offline ? 0.75 : 1,
              }}>
                {/* Avatar + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar name={d.name} size={44} color={d.color} />
                    <span style={{
                      position: 'absolute', bottom: -1, right: -1, width: 12, height: 12,
                      borderRadius: '50%', border: '2px solid #fff', background: STATUS_DOT(d),
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: TZ.sans, fontSize: 13.5, fontWeight: 700, color: TZ.ink,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                    <div style={{ fontFamily: TZ.mono, fontSize: 11.5, color: TZ.muted, marginTop: 2 }}>{d.plate}</div>
                  </div>
                  <button type="button" style={{ background: 'none', border: 0, cursor: 'pointer',
                    color: TZ.faint, padding: 2, display: 'flex', flexShrink: 0 }}>
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                {/* Status + car */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <StatusPill status={d.offline ? 'offline' : d.status} size="sm" />
                  {d.car && (
                    <span style={{ fontFamily: TZ.sans, fontSize: 11, fontWeight: 600, color: TZ.body,
                      background: TZ.surface3, borderRadius: 10, padding: '2px 8px' }}>{d.car}</span>
                  )}
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  {[
                    { l: 'Sargyt',  v: d.orders },
                    { l: 'Reýting', v: `${d.rating} ★` },
                    { l: 'Balans',  v: `${d.balance.toFixed(0)} T` },
                  ].map((s, i) => (
                    <div key={i} style={{ background: TZ.surface2, borderRadius: 8, padding: '8px 6px' }}>
                      <div style={{ fontFamily: TZ.sans, fontSize: 9.5, fontWeight: 700, color: TZ.muted,
                        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{s.l}</div>
                      <div style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 700, color: TZ.ink }}>{s.v}</div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                    fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.body,
                    border: `1px solid ${TZ.line}`, background: TZ.surface,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = TZ.surface2}
                  onMouseLeave={e => e.currentTarget.style.background = TZ.surface}>
                    <Phone size={13} /> Jaň et
                  </button>
                  <button type="button" style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                    fontFamily: TZ.sans, fontSize: 12, fontWeight: 700, color: '#fff',
                    border: 0, background: TZ.navy,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = TZ.navyDk}
                  onMouseLeave={e => e.currentTarget.style.background = TZ.navy}>
                    <Map size={13} /> Kartada
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Applications table ── */}
        {tab === 'apps' && (
          <div style={{ flex: 1, minHeight: 0, background: TZ.surface, border: `1px solid ${TZ.line}`,
            borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: TZ.surface2, borderBottom: `1px solid ${TZ.line}` }}>
                    {['At-Familiýa','Telefon','Maşyn','Park','Şäher','Iberilen','Ýagdaý',''].map((h, i) => (
                      <th key={i} style={{ padding: '10px 16px', textAlign: 'left',
                        fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700, color: TZ.muted,
                        textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {apps.map(a => (
                    <tr key={a.id} style={{ borderBottom: `1px solid ${TZ.lineSoft}` }}>
                      <td style={{ padding: '13px 16px', fontFamily: TZ.sans, fontSize: 13,
                        fontWeight: 600, color: TZ.ink }}>{a.name}</td>
                      <td style={{ padding: '13px 16px', fontFamily: TZ.mono, fontSize: 11.5,
                        color: TZ.muted }}>{a.phone}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.ink }}>{a.car}</div>
                        <div style={{ fontFamily: TZ.mono, fontSize: 11, color: TZ.muted, marginTop: 2 }}>{a.plate}</div>
                      </td>
                      <td style={{ padding: '13px 16px', fontFamily: TZ.sans, fontSize: 13, color: TZ.body }}>{a.park}</td>
                      <td style={{ padding: '13px 16px', fontFamily: TZ.sans, fontSize: 13, color: TZ.body }}>{a.city}</td>
                      <td style={{ padding: '13px 16px', fontFamily: TZ.mono, fontSize: 11.5, color: TZ.muted }}>{a.submitted}</td>
                      <td style={{ padding: '13px 16px' }}>
                        {a.status === 'pending'  && <AppBadge c={TZ.amber} bg={TZ.amberSoft}>Garaşylýar</AppBadge>}
                        {a.status === 'approved' && <AppBadge c={TZ.green} bg={TZ.greenSoft}>Tassyklandy</AppBadge>}
                        {a.status === 'rejected' && <AppBadge c={TZ.red}   bg={TZ.redSoft}>Ret edildi</AppBadge>}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        {a.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <ActionBtn onClick={() => approve(a.id)} color={TZ.green} bg={TZ.greenSoft}>
                              <Check size={12} /> Tassykla
                            </ActionBtn>
                            <ActionBtn onClick={() => setRejectId(a.id)} color={TZ.red} bg={TZ.redSoft}>
                              <X size={12} /> Ret et
                            </ActionBtn>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Reject modal ── */}
      {rejectId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380,
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: TZ.sans, fontSize: 16, fontWeight: 800, color: TZ.ink, margin: 0 }}>Ret etmek</h3>
              <button onClick={() => setRejectId(null)} type="button"
                style={{ background: 'none', border: 0, cursor: 'pointer', color: TZ.faint, padding: 2 }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.muted, margin: '0 0 10px' }}>
              Ret etmegiň sebäbini ýazyň:
            </p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Sebäp…"
              style={{ width: '100%', minHeight: 80, padding: 12, borderRadius: 10,
                border: `1.5px solid ${TZ.line}`, fontFamily: TZ.sans, fontSize: 13,
                color: TZ.ink, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = TZ.navy}
              onBlur={e => e.target.style.borderColor = TZ.line} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setRejectId(null)} type="button"
                style={{ padding: '9px 18px', borderRadius: 9, border: `1px solid ${TZ.line}`,
                  background: TZ.surface, fontFamily: TZ.sans, fontSize: 13, fontWeight: 600,
                  color: TZ.body, cursor: 'pointer' }}>
                Ýap
              </button>
              <button onClick={() => reject(rejectId)} type="button"
                style={{ padding: '9px 18px', borderRadius: 9, border: 0,
                  background: TZ.red, color: '#fff', fontFamily: TZ.sans,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Ret et
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}

function AppBadge({ c, bg, children }) {
  return (
    <span style={{ fontFamily: 'var(--sans)', fontSize: 11.5, fontWeight: 700,
      color: c, background: bg, borderRadius: 10, padding: '3px 10px' }}>
      {children}
    </span>
  )
}

function ActionBtn({ onClick, color, bg, children }) {
  return (
    <button onClick={onClick} type="button"
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
        borderRadius: 7, border: 0, background: bg, color, cursor: 'pointer',
        fontFamily: 'var(--sans)', fontSize: 11.5, fontWeight: 700,
        transition: 'opacity 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
      {children}
    </button>
  )
}
