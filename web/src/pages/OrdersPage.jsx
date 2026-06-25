import { useState } from 'react'
import { Plus, Download, Search, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'
import { AdminShell } from '../components/shell/AdminShell.jsx'
import { StatusPill, Avatar } from '../design/atoms.jsx'
import { TZ } from '../design/tokens.js'
import { ORDERS, DRIVERS } from '../data/mock.js'

const TABS = [
  { id: 'all',       label: 'Hemmesi',    fn: () => true },
  { id: 'pending',   label: 'Garaşýar',   fn: o => o.status === 'pending' },
  { id: 'active',    label: 'Işde',       fn: o => ['on_way','arrived','accepted'].includes(o.status) },
  { id: 'completed', label: 'Tamamlandy', fn: o => o.status === 'completed' },
  { id: 'cancelled', label: 'Ýatyryldy',  fn: o => o.status === 'cancelled' },
]
const PER = 8

const COLS = ['№ Sargyt', 'Müşderi', 'Ugur', 'Sürüji', 'Töleg', 'Status', 'ETA', '']

export default function OrdersPage({ shell }) {
  const [tab,    setTab]    = useState('all')
  const [search, setSearch] = useState('')
  const [pg,     setPg]     = useState(1)

  const tabFn    = TABS.find(t => t.id === tab)?.fn ?? (() => true)
  const filtered = ORDERS.filter(o => {
    const ms = !search || o.id.toLowerCase().includes(search.toLowerCase())
                       || o.client.toLowerCase().includes(search.toLowerCase())
    return tabFn(o) && ms
  })
  const pages = Math.max(1, Math.ceil(filtered.length / PER))
  const paged  = filtered.slice((pg - 1) * PER, pg * PER)

  function goTab(id) { setTab(id); setPg(1) }
  function goSearch(v) { setSearch(v); setPg(1) }

  return (
    <AdminShell {...shell}
      active="orders"
      title="Sargytlar"
      subtitle={`Şu gün · jemi ${ORDERS.length} sargyt`}
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
              border: `1px solid ${TZ.line}`, borderRadius: 8, background: TZ.surface,
              fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.body, cursor: 'pointer' }}>
            <Download size={13} /> Eksport
          </button>
          <button type="button"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              border: 0, borderRadius: 8, background: TZ.navy, color: '#fff',
              fontFamily: TZ.sans, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={13} /> Täze sargyt
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
        padding: '14px 16px', gap: 12, overflow: 'hidden' }}>

        {/* ── Filter bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {TABS.map(t => {
              const cnt = ORDERS.filter(t.fn).length
              const on  = t.id === tab
              return (
                <button key={t.id} onClick={() => goTab(t.id)} type="button"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 13px', borderRadius: 8, cursor: 'pointer',
                    fontFamily: TZ.sans, fontSize: 13, fontWeight: on ? 700 : 500,
                    border: on ? `1px solid ${TZ.line}` : '1px solid transparent',
                    background: on ? TZ.surface : 'transparent',
                    color: on ? TZ.ink : TZ.muted,
                    boxShadow: on ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { if (!on) e.currentTarget.style.color = TZ.body }}
                  onMouseLeave={e => { if (!on) e.currentTarget.style.color = TZ.muted }}>
                  {t.label}
                  <span style={{ fontFamily: TZ.mono, fontSize: 11, color: on ? TZ.muted : TZ.faint }}>{cnt}</span>
                </button>
              )
            })}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
            borderRadius: 8, background: TZ.surface, border: `1px solid ${TZ.line}`, width: 220 }}>
            <Search size={14} color={TZ.muted} style={{ flexShrink: 0 }} />
            <input value={search} onChange={e => goSearch(e.target.value)} placeholder="ID, müşderi…"
              style={{ flex: 1, border: 0, outline: 'none', background: 'transparent',
                fontFamily: TZ.sans, fontSize: 13, color: TZ.ink, minWidth: 0 }} />
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{ flex: 1, background: TZ.surface, border: `1px solid ${TZ.line}`, borderRadius: 12,
          overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: TZ.surface2, borderBottom: `1px solid ${TZ.line}` }}>
                  {COLS.map((h, i) => (
                    <th key={i} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700,
                      color: TZ.muted, textTransform: 'uppercase', letterSpacing: 0.5,
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map(o => {
                  const driver = DRIVERS.find(d => d.id === o.driver)
                  return (
                    <tr key={o.id}
                      style={{ borderBottom: `1px solid ${TZ.lineSoft}`, transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = TZ.surface2}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontFamily: TZ.mono, fontSize: 12.5, fontWeight: 700, color: TZ.ink }}>{o.id}</div>
                        <div style={{ fontFamily: TZ.sans, fontSize: 11, color: TZ.muted, marginTop: 2 }}>{o.created}</div>
                      </td>

                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 600, color: TZ.ink }}>{o.client}</div>
                        <div style={{ fontFamily: TZ.mono, fontSize: 11, color: TZ.muted, marginTop: 2 }}>{o.phone}</div>
                      </td>

                      <td style={{ padding: '13px 16px', maxWidth: 180 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6,
                          fontFamily: TZ.sans, fontSize: 12, color: TZ.muted }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: TZ.navy, flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.from}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6,
                          fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.ink, marginTop: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: TZ.orange, flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.to}</span>
                        </div>
                      </td>

                      <td style={{ padding: '13px 16px' }}>
                        {driver ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar name={driver.name} size={26} color={driver.color} />
                            <div>
                              <div style={{ fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.ink }}>
                                {driver.name.split(' ')[0]}
                              </div>
                              <div style={{ fontFamily: TZ.mono, fontSize: 10.5, color: TZ.muted }}>{driver.plate}</div>
                            </div>
                          </div>
                        ) : (
                          <button type="button"
                            style={{ display: 'flex', alignItems: 'center', gap: 4,
                              fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.orange,
                              background: 'transparent', border: 0, cursor: 'pointer', padding: 0 }}>
                            <Plus size={12} /> Belle
                          </button>
                        )}
                      </td>

                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 700, color: TZ.ink }}>
                          {o.price.toFixed(2)} T
                        </div>
                        <div style={{ fontFamily: TZ.sans, fontSize: 11, color: TZ.muted, marginTop: 2 }}>
                          {o.distance} km
                        </div>
                      </td>

                      <td style={{ padding: '13px 16px' }}><StatusPill status={o.status} /></td>

                      <td style={{ padding: '13px 16px', fontFamily: TZ.mono, fontSize: 12.5,
                        fontWeight: 600, color: TZ.muted }}>{o.eta}</td>

                      <td style={{ padding: '13px 16px' }}>
                        <button type="button" style={{ background: 'none', border: 0, cursor: 'pointer',
                          color: TZ.faint, padding: 2, display: 'flex' }}>
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${TZ.lineSoft}`, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.muted }}>
              {(pg - 1) * PER + 1}–{Math.min(pg * PER, filtered.length)} / {filtered.length} sargyt
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <PageBtn onClick={() => setPg(p => Math.max(1, p - 1))} disabled={pg === 1}>
                <ChevronLeft size={14} />
              </PageBtn>
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <PageBtn key={p} active={p === pg} onClick={() => setPg(p)}>{p}</PageBtn>
              ))}
              <PageBtn onClick={() => setPg(p => Math.min(pages, p + 1))} disabled={pg === pages}>
                <ChevronRight size={14} />
              </PageBtn>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}

function PageBtn({ children, onClick, active, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={{
        minWidth: 28, height: 28, padding: '0 6px', borderRadius: 6, cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-sans, sans-serif)', fontSize: 12, fontWeight: active ? 700 : 500,
        border: active ? 0 : `1px solid ${TZ.line}`,
        background: active ? TZ.navy : TZ.surface,
        color: active ? '#fff' : disabled ? TZ.faint : TZ.body,
        transition: 'all 0.1s',
      }}>
      {children}
    </button>
  )
}
