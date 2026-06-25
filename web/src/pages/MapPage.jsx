import { useState } from 'react'
import { RefreshCw, MapPin, Clock, X, Plus } from 'lucide-react'
import { AdminShell } from '../components/shell/AdminShell.jsx'
import LiveMap from '../components/map/LiveMap.jsx'
import { StatusPill, Avatar } from '../design/atoms.jsx'
import { TZ } from '../design/tokens.js'
import { DRIVERS, ORDERS } from '../data/mock.js'

const FILTERS = ['Hemmesi', 'Işde', 'Garaşýar', 'Oflaýn']

const LEGEND = [
  { c: TZ.navy,   l: 'Ýolda'  },
  { c: TZ.amber,  l: 'Geldi'  },
  { c: '#5B4FC9', l: 'Kabul'  },
  { c: TZ.green,  l: 'Boş'    },
  { c: TZ.faint,  l: 'Oflaýn' },
]

export default function MapPage({ shell }) {
  const [filter,  setFilter]  = useState('Hemmesi')
  const [focusId, setFocusId] = useState(null)

  const fd = DRIVERS.find(d => d.id === focusId)
  const fo = fd
    ? ORDERS.find(o => o.driver === fd.id && ['on_way','arrived','accepted'].includes(o.status))
    : null

  const online  = DRIVERS.filter(d => !d.offline).length
  const inTrip  = DRIVERS.filter(d => d.status === 'on_way').length
  const active  = ORDERS.filter(o => ['on_way','arrived','accepted'].includes(o.status)).length
  const pending = ORDERS.filter(o => o.status === 'pending').length

  const liveOrders = ORDERS.filter(o =>
    ['on_way','arrived','accepted','pending'].includes(o.status)
  )

  return (
    <AdminShell {...shell}
      active="map"
      title="Janly Karta"
      subtitle={`${online} nobatda · ${active} ýolda · ${pending} garaşýar`}
      actions={
        <button type="button"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            border: `1px solid ${TZ.line}`, borderRadius: 8, background: TZ.surface,
            fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.body, cursor: 'pointer' }}>
          <RefreshCw size={13} /> Täzele
        </button>
      }
    >
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

        {/* ── Map ── */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>

          {/* Filter chips */}
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, display: 'flex', gap: 6 }}>
            {FILTERS.map(f => {
              const on = f === filter
              return (
                <button key={f} onClick={() => setFilter(f)} type="button"
                  style={{
                    padding: '6px 14px', borderRadius: 20,
                    fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.12s',
                    border: on ? `1px solid ${TZ.navy}` : `1px solid ${TZ.line}`,
                    background: on ? TZ.navy : '#fff',
                    color: on ? '#fff' : TZ.body,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                  }}>
                  {f}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{
            position: 'absolute', bottom: 16, left: 12, zIndex: 1000,
            background: 'rgba(255,255,255,0.97)', borderRadius: 12, padding: '10px 14px',
            border: `1px solid ${TZ.line}`, boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontFamily: TZ.sans, fontSize: 10, fontWeight: 700, color: TZ.muted,
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Bellik</div>
            {LEGEND.map(({ c, l }) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
                <span style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.body }}>{l}</span>
              </div>
            ))}
          </div>

          <LiveMap />
        </div>

        {/* ── Right rail ── */}
        <div style={{
          width: 272, flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: TZ.surface, borderLeft: `1px solid ${TZ.line}`, overflow: 'hidden',
        }}>

          {/* KPI tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${TZ.line}` }}>
            {[
              { l: 'Nobatda',  v: online,  c: TZ.green  },
              { l: 'Ýolda',    v: inTrip,  c: TZ.navy   },
              { l: 'Sargyt',   v: active,  c: '#5B4FC9' },
              { l: 'Garaşýar', v: pending, c: TZ.orange },
            ].map((k, i) => (
              <div key={i} style={{
                padding: '14px 16px',
                borderRight:  i % 2 === 0 ? `1px solid ${TZ.line}` : 'none',
                borderBottom: i < 2       ? `1px solid ${TZ.line}` : 'none',
              }}>
                <div style={{ fontFamily: TZ.sans, fontSize: 10, fontWeight: 700, color: TZ.muted,
                  textTransform: 'uppercase', letterSpacing: 0.8 }}>{k.l}</div>
                <div style={{ fontFamily: TZ.sans, fontSize: 26, fontWeight: 800, color: k.c, marginTop: 2, lineHeight: 1 }}>{k.v}</div>
              </div>
            ))}
          </div>

          {/* Focused driver panel */}
          {fd ? (
            <div style={{ padding: 14, borderBottom: `1px solid ${TZ.line}`, background: TZ.navyTint, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar name={fd.name} size={38} color={fd.color} />
                  <span style={{
                    position: 'absolute', bottom: -1, right: -1,
                    width: 11, height: 11, borderRadius: '50%', border: '2px solid #fff',
                    background: fd.offline ? TZ.faint : TZ.green,
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 700, color: TZ.ink,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fd.name}</div>
                  <div style={{ fontFamily: TZ.mono, fontSize: 11, color: TZ.muted, marginTop: 1 }}>{fd.plate}</div>
                </div>
                <button onClick={() => setFocusId(null)} type="button"
                  style={{ background: 'transparent', border: 0, color: TZ.faint, cursor: 'pointer', padding: 2, flexShrink: 0 }}>
                  <X size={14} />
                </button>
              </div>
              <StatusPill status={fd.offline ? 'offline' : fd.status} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 10 }}>
                {[
                  { l: 'Sargyt',  v: fd.orders },
                  { l: 'Reýting', v: `${fd.rating}★` },
                  { l: 'Balans',  v: `${fd.balance.toFixed(0)}T` },
                ].map((s, i) => (
                  <div key={i} style={{ background: TZ.surface, borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: TZ.sans, fontSize: 9, fontWeight: 700, color: TZ.muted,
                      textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</div>
                    <div style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 700, color: TZ.ink, marginTop: 2 }}>{s.v}</div>
                  </div>
                ))}
              </div>
              {fo && (
                <div style={{ marginTop: 10, background: TZ.surface, borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontFamily: TZ.mono, fontSize: 10.5, fontWeight: 700, color: TZ.muted }}>{fo.id}</span>
                    <StatusPill status={fo.status} size="sm" />
                  </div>
                  <div style={{ fontFamily: TZ.sans, fontSize: 11.5, color: TZ.body, lineHeight: 1.4 }}>
                    {fo.from} → {fo.to}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '18px 16px', borderBottom: `1px solid ${TZ.line}`,
              textAlign: 'center', fontFamily: TZ.sans, fontSize: 12, color: TZ.faint, flexShrink: 0 }}>
              Sürüjini saýlamak üçin kartada basyň
            </div>
          )}

          {/* Active order list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{
              padding: '10px 16px 8px', fontFamily: TZ.sans, fontSize: 10, fontWeight: 700,
              color: TZ.muted, textTransform: 'uppercase', letterSpacing: 1,
              position: 'sticky', top: 0, background: TZ.surface, borderBottom: `1px solid ${TZ.lineSoft}`,
            }}>
              Işdäki sargytlar
            </div>

            {liveOrders.map(o => {
              const driver = DRIVERS.find(d => d.id === o.driver)
              return (
                <div key={o.id}
                  onClick={() => driver && setFocusId(driver.id)}
                  style={{ padding: '12px 16px', borderBottom: `1px solid ${TZ.lineSoft}`,
                    cursor: driver ? 'pointer' : 'default', transition: 'background 0.1s' }}
                  onMouseEnter={e => { if (driver) e.currentTarget.style.background = TZ.surface2 }}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <span style={{ fontFamily: TZ.mono, fontSize: 10.5, fontWeight: 700, color: TZ.muted }}>{o.id}</span>
                    <StatusPill status={o.status} size="sm" />
                    <span style={{ marginLeft: 'auto', fontFamily: TZ.sans, fontSize: 12, fontWeight: 700, color: TZ.ink }}>
                      {o.price.toFixed(0)} T
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5,
                    fontFamily: TZ.sans, fontSize: 12, color: TZ.body }}>
                    <MapPin size={10} color={TZ.orange} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.to}</span>
                  </div>
                  {driver && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                      <Avatar name={driver.name} size={16} color={driver.color} />
                      <span style={{ fontFamily: TZ.sans, fontSize: 11, color: TZ.muted }}>
                        {driver.name.split(' ')[0]}
                      </span>
                      {o.eta !== '—' && (
                        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3,
                          fontFamily: TZ.mono, fontSize: 10, color: TZ.muted }}>
                          <Clock size={9} /> {o.eta}
                        </span>
                      )}
                    </div>
                  )}
                  {!driver && (
                    <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 4,
                      fontFamily: TZ.sans, fontSize: 11.5, fontWeight: 600, color: TZ.orange }}>
                      <Plus size={11} /> Sürüji belle
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
