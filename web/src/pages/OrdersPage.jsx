import { useState } from 'react'
import { Plus, Download, Search, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'
import { AdminShell } from '../components/shell/AdminShell.jsx'
import { StatusPill, Avatar } from '../design/atoms.jsx'
import { TZ } from '../design/tokens.js'
import { useApi } from '../api/useApi.js'
import { listOrders } from '../api/orders.js'

const TABS = [
  { id: 'all',       label: 'Hemmesi',    fn: () => true },
  { id: 'pending',   label: 'Garaşýar',   fn: o => o.status === 'created' },
  { id: 'active',    label: 'Işde',       fn: o => ['on_way', 'arrived', 'accepted'].includes(o.status) },
  { id: 'completed', label: 'Tamamlandy', fn: o => o.status === 'completed' },
  { id: 'cancelled', label: 'Ýatyryldy',  fn: o => o.status === 'cancelled_by_user' || o.status === 'cancelled_by_driver' },
]
const PER = 8

const COLS = ['№ Sargyt', 'Müşderi', 'Ugur', 'Sürüji', 'Töleg', 'Status', 'Wagt', '']

export default function OrdersPage({ shell }) {
  const [tab,    setTab]    = useState('all')
  const [search, setSearch] = useState('')
  const [pg,     setPg]     = useState(1)

  const { data, loading, error } = useApi(() => listOrders({ limit: 200 }), [])
  const orders = data?.data ?? []

  const tabFn    = TABS.find(t => t.id === tab)?.fn ?? (() => true)
  const filtered = orders.filter(o => {
    const q = search.toLowerCase()
    const ms = !search || String(o.id).includes(q) || (o.client_name ?? '').toLowerCase().includes(q)
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
      subtitle={`Şu gün · jemi ${orders.length} sargyt`}
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
              border: `1px solid ${TZ.line}`, borderRadius: 8, background: TZ.surface,
              fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.body, cursor: 'pointer' }}>
            <Download size={13} /> Eksport
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
              const cnt = orders.filter(t.fn).length
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
                  }}>
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

          {loading && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>Ýüklenýär…</div>}
          {error && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{error.message}</div>}

          {!loading && !error && (
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
                  const driverName = o.driver_id ? `${o.driver_first_name ?? ''} ${o.driver_last_name ?? ''}`.trim() : null
                  return (
                    <tr key={o.id}
                      style={{ borderBottom: `1px solid ${TZ.lineSoft}`, transition: 'background 0.1s' }}>

                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontFamily: TZ.mono, fontSize: 12.5, fontWeight: 700, color: TZ.ink }}>#{o.id}</div>
                        <div style={{ fontFamily: TZ.sans, fontSize: 11, color: TZ.muted, marginTop: 2 }}>
                          {new Date(o.created_at).toLocaleTimeString()}
                        </div>
                      </td>

                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 600, color: TZ.ink }}>{o.client_name ?? '—'}</div>
                        <div style={{ fontFamily: TZ.mono, fontSize: 11, color: TZ.muted, marginTop: 2 }}>{o.client_phone}</div>
                      </td>

                      <td style={{ padding: '13px 16px', maxWidth: 180 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6,
                          fontFamily: TZ.sans, fontSize: 12, color: TZ.muted }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: TZ.navy, flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.start_address}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6,
                          fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.ink, marginTop: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: TZ.orange, flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.end_address ?? '—'}</span>
                        </div>
                      </td>

                      <td style={{ padding: '13px 16px' }}>
                        {driverName ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar name={driverName} size={26} color={TZ.navy} />
                            <div>
                              <div style={{ fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.ink }}>
                                {driverName.split(' ')[0]}
                              </div>
                              <div style={{ fontFamily: TZ.mono, fontSize: 10.5, color: TZ.muted }}>{o.driver_phone}</div>
                            </div>
                          </div>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4,
                            fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.orange }}>
                            <Plus size={12} /> Belle
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 700, color: TZ.ink }}>
                          {Number(o.total_price ?? o.base_price ?? 0).toFixed(2)} T
                        </div>
                        <div style={{ fontFamily: TZ.sans, fontSize: 11, color: TZ.muted, marginTop: 2 }}>
                          {o.distance_km} km
                        </div>
                      </td>

                      <td style={{ padding: '13px 16px' }}><StatusPill status={o.status} /></td>

                      <td style={{ padding: '13px 16px', fontFamily: TZ.mono, fontSize: 12.5,
                        fontWeight: 600, color: TZ.muted }}>{new Date(o.created_at).toLocaleDateString()}</td>

                      <td style={{ padding: '13px 16px' }}>
                        <button type="button" style={{ background: 'none', border: 0, cursor: 'pointer',
                          color: TZ.faint, padding: 2, display: 'flex' }}>
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {paged.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', fontFamily: TZ.sans,
                    fontSize: 12, color: TZ.faint }}>Sargyt ýok</td></tr>
                )}
              </tbody>
            </table>
          </div>
          )}

          {/* ── Pagination ── */}
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${TZ.lineSoft}`, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.muted }}>
              {filtered.length === 0 ? 0 : (pg - 1) * PER + 1}–{Math.min(pg * PER, filtered.length)} / {filtered.length} sargyt
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
