import { useState } from 'react'
import { Search, MoreHorizontal, Phone, X, Ban, CheckCircle, History, ChevronLeft, ChevronRight } from 'lucide-react'
import { AdminShell } from '../components/shell/AdminShell.jsx'
import { StatusPill, Avatar } from '../design/atoms.jsx'
import { useTZ } from '../design/tokens.js'
import { useApi } from '../api/useApi.js'
import { listClients, getClientOrders, setClientBlocked } from '../api/clients.js'
import { useT } from '../i18n/useT.js'

const CLIENT_COLORS = ['#0E2A4D', '#C98612', '#5B4FC9', '#1B8F5A', '#C24536']
function colorFor(id) { return CLIENT_COLORS[id % CLIENT_COLORS.length] }

const CLIENTS_PER = 24

export default function ClientsPage({ shell }) {
  const TZ = useTZ()
  const t = useT()
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all | active | blocked
  const [page,         setPage]         = useState(1)
  const [menuOpenId,   setMenuOpenId]   = useState(null)
  const [blockFor,     setBlockFor]     = useState(null)
  const [blockReason,  setBlockReason]  = useState('')
  const [ordersFor,    setOrdersFor]    = useState(null)

  const { data, loading, error, reload } =
    useApi(() => listClients({ limit: 500 }), [])

  const { data: ordersData, loading: ordersLoading, error: ordersError } =
    useApi(() => ordersFor ? getClientOrders(ordersFor.id, { limit: 30 }) : Promise.resolve(null), [ordersFor?.id])

  const allClients = data?.data ?? []
  const orders = ordersData?.data ?? []

  const filtered = allClients.filter(c => {
    if (statusFilter === 'active' && c.is_blocked) return false
    if (statusFilter === 'blocked' && !c.is_blocked) return false
    const name = (c.full_name ?? '').toLowerCase()
    return !search || name.includes(search.toLowerCase()) || (c.phone ?? '').toLowerCase().includes(search.toLowerCase())
  })
  const pages = Math.max(1, Math.ceil(filtered.length / CLIENTS_PER))
  const paged = filtered.slice((page - 1) * CLIENTS_PER, page * CLIENTS_PER)

  function goFilter(v) { setStatusFilter(v); setPage(1) }
  function goSearch(v) { setSearch(v); setPage(1) }

  function openBlock(client) {
    setMenuOpenId(null)
    setBlockReason('')
    setBlockFor(client)
  }

  async function confirmBlock(e) {
    e.preventDefault()
    try {
      await setClientBlocked(blockFor.id, true, blockReason)
      setBlockFor(null); setBlockReason('')
      reload()
    } catch (err) {
      alert(err.message || t('clients.blockError'))
    }
  }

  async function unblock(client) {
    setMenuOpenId(null)
    try {
      await setClientBlocked(client.id, false)
      reload()
    } catch (err) {
      alert(err.message || t('clients.unblockError'))
    }
  }

  const blockedCount = allClients.filter(c => c.is_blocked).length

  return (
    <AdminShell {...shell}
      active="clients"
      title={t('clients.title')}
      subtitle={`${data?.total ?? allClients.length} ${t('clients.subtitlePeople')} · ${blockedCount} ${t('clients.subtitleBlocked')}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
        padding: '14px 16px', gap: 12, overflow: 'hidden' }}>

        {/* ── Filters + search ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: TZ.surface2, border: `1px solid ${TZ.line}`,
            borderRadius: 9, padding: 3, gap: 2 }}>
            {[
              { id: 'all',     label: t('clients.filterAll') },
              { id: 'active',  label: t('clients.filterActive') },
              { id: 'blocked', label: t('clients.filterBlocked') },
            ].map(f => {
              const on = f.id === statusFilter
              return (
                <button key={f.id} type="button" onClick={() => goFilter(f.id)}
                  style={{ padding: '6px 10px', borderRadius: 7, cursor: 'pointer',
                    fontFamily: TZ.sans, fontSize: 12, fontWeight: on ? 700 : 500,
                    border: 0, background: on ? TZ.surface : 'transparent',
                    color: on ? TZ.ink : TZ.muted,
                    boxShadow: on ? '0 1px 3px rgba(0,0,0,0.07)' : 'none' }}>
                  {f.label}
                </button>
              )
            })}
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
            borderRadius: 8, background: TZ.surface, border: `1px solid ${TZ.line}`, width: 220 }}>
            <Search size={14} color={TZ.muted} style={{ flexShrink: 0 }} />
            <input value={search} onChange={e => goSearch(e.target.value)} placeholder={t('clients.searchPlaceholder')}
              style={{ flex: 1, border: 0, outline: 'none', background: 'transparent',
                fontFamily: TZ.sans, fontSize: 13, color: TZ.ink, minWidth: 0 }} />
          </div>
        </div>

        {/* ── Clients grid ── */}
        {loading && <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>{t('common.loading')}</div>}
        {error && <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{error.message}</div>}
        {!loading && !error && (
          <>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto',
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, alignContent: 'start' }}>
              {paged.map(c => (
                <div key={c.id} style={{
                  position: 'relative',
                  background: TZ.surface, border: `1px solid ${TZ.line}`, borderRadius: 12,
                  padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
                  opacity: c.is_blocked ? 0.75 : 1,
                }}>
                  <button type="button" onClick={() => setMenuOpenId(menuOpenId === c.id ? null : c.id)}
                    style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 0,
                      cursor: 'pointer', color: TZ.faint, padding: 4, borderRadius: 6, zIndex: 2 }}>
                    <MoreHorizontal size={16} />
                  </button>
                  {menuOpenId === c.id && (
                    <div style={{ position: 'absolute', top: 34, right: 10, background: TZ.surface,
                      border: `1px solid ${TZ.line}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                      zIndex: 3, overflow: 'hidden' }}>
                      <button type="button" onClick={() => { setMenuOpenId(null); setOrdersFor(c) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 14px', border: 0,
                          background: 'transparent', textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap',
                          fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.body }}>
                        <History size={13} /> {t('clients.viewOrders')}
                      </button>
                      <button type="button" onClick={() => c.is_blocked ? unblock(c) : openBlock(c)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 14px', border: 0,
                          background: 'transparent', textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap',
                          fontFamily: TZ.sans, fontSize: 12, fontWeight: 600,
                          color: c.is_blocked ? TZ.green : TZ.red }}>
                        {c.is_blocked ? <CheckCircle size={13} /> : <Ban size={13} />}
                        {c.is_blocked ? t('clients.unblock') : t('clients.block')}
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar name={c.full_name || c.phone || '?'} size={44} color={colorFor(c.id)} />
                      <span style={{
                        position: 'absolute', bottom: -1, right: -1, width: 12, height: 12,
                        borderRadius: '50%', border: '2px solid #fff',
                        background: c.is_blocked ? TZ.red : TZ.green,
                      }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: TZ.sans, fontSize: 13.5, fontWeight: 700, color: TZ.ink,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.full_name || '—'}</div>
                      <div style={{ fontFamily: TZ.mono, fontSize: 11.5, color: TZ.muted, marginTop: 2 }}>{c.phone ?? '—'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700, borderRadius: 999,
                      padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 5,
                      color: c.is_blocked ? TZ.red : TZ.green,
                      background: c.is_blocked ? TZ.redSoft : TZ.greenSoft,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%',
                        background: c.is_blocked ? TZ.red : TZ.green }} />
                      {c.is_blocked ? t('clients.statusBlocked') : t('clients.statusActive')}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[
                      { l: t('clients.statOrders'), v: c.completed_orders },
                      { l: t('clients.statSpent'),  v: `${Number(c.total_spent).toFixed(0)} TMT` },
                    ].map((s, i) => (
                      <div key={i} style={{ background: TZ.surface2, borderRadius: 8, padding: '8px 6px' }}>
                        <div style={{ fontFamily: TZ.sans, fontSize: 9.5, fontWeight: 700, color: TZ.muted,
                          textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{s.l}</div>
                        <div style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 700, color: TZ.ink,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.v}</div>
                      </div>
                    ))}
                  </div>

                  {c.is_blocked && c.blocked_reason && (
                    <div style={{ fontFamily: TZ.sans, fontSize: 11.5, color: TZ.muted,
                      background: TZ.redSoft, borderRadius: 8, padding: '6px 8px' }}>
                      <strong style={{ color: TZ.red }}>{t('clients.reasonLabel')}:</strong> {c.blocked_reason}
                    </div>
                  )}

                  <a href={c.phone ? `tel:${c.phone}` : undefined} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px 0', borderRadius: 8, cursor: c.phone ? 'pointer' : 'default',
                    fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.body,
                    border: `1px solid ${TZ.line}`, background: TZ.surface,
                    textDecoration: 'none', opacity: c.phone ? 1 : 0.5,
                  }}>
                    <Phone size={13} /> {t('clients.call')}
                  </a>
                </div>
              ))}
              {paged.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: 24, textAlign: 'center',
                  fontFamily: TZ.sans, fontSize: 12, color: TZ.faint }}>{t('clients.noClients')}</div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.muted }}>
                {filtered.length === 0 ? 0 : (page - 1) * CLIENTS_PER + 1}–{Math.min(page * CLIENTS_PER, filtered.length)} / {filtered.length} {t('clients.clientsUnit')}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <PageBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft size={14} />
                </PageBtn>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <PageBtn key={p} active={p === page} onClick={() => setPage(p)}>{p}</PageBtn>
                ))}
                <PageBtn onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>
                  <ChevronRight size={14} />
                </PageBtn>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Block modal ── */}
      {blockFor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <form onSubmit={confirmBlock} style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380,
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: TZ.sans, fontSize: 16, fontWeight: 800, color: TZ.ink, margin: 0 }}>{t('clients.blockTitle')}</h3>
              <button onClick={() => { setBlockFor(null); setBlockReason('') }} type="button"
                style={{ background: 'none', border: 0, cursor: 'pointer', color: TZ.faint, padding: 2 }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.muted, margin: '0 0 10px' }}>
              {t('clients.blockHint')}
            </p>
            <textarea value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder={t('clients.blockReasonPlaceholder')}
              style={{ width: '100%', minHeight: 80, padding: 12, borderRadius: 10,
                border: `1.5px solid ${TZ.line}`, fontFamily: TZ.sans, fontSize: 13,
                color: TZ.ink, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => { setBlockFor(null); setBlockReason('') }} type="button"
                style={{ padding: '9px 18px', borderRadius: 9, border: `1px solid ${TZ.line}`,
                  background: TZ.surface, fontFamily: TZ.sans, fontSize: 13, fontWeight: 600,
                  color: TZ.body, cursor: 'pointer' }}>
                {t('common.close')}
              </button>
              <button type="submit"
                style={{ padding: '9px 18px', borderRadius: 9, border: 0,
                  background: TZ.red, color: '#fff', fontFamily: TZ.sans,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {t('clients.blockConfirm')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Order history modal ── */}
      {ordersFor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 640,
            maxHeight: '80vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
              <h3 style={{ fontFamily: TZ.sans, fontSize: 16, fontWeight: 800, color: TZ.ink, margin: 0 }}>
                {ordersFor.full_name || ordersFor.phone} — {t('clients.ordersModalTitle')}
              </h3>
              <button onClick={() => setOrdersFor(null)} type="button"
                style={{ background: 'none', border: 0, cursor: 'pointer', color: TZ.faint, padding: 2 }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {ordersLoading && <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>{t('common.loading')}</div>}
              {ordersError && <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{ordersError.message}</div>}
              {!ordersLoading && !ordersError && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: TZ.surface2, borderBottom: `1px solid ${TZ.line}` }}>
                      {[t('clients.colRoute'), t('clients.colPrice'), t('clients.colStatus'), t('clients.colDate')].map((h, i) => (
                        <th key={i} style={{ padding: '10px 12px', textAlign: 'left',
                          fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700, color: TZ.muted,
                          textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id} style={{ borderBottom: `1px solid ${TZ.lineSoft}` }}>
                        <td style={{ padding: '10px 12px', fontFamily: TZ.sans, fontSize: 12.5, color: TZ.body,
                          maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {o.start_address} → {o.end_address ?? '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: TZ.mono, fontSize: 12, color: TZ.ink }}>
                          {o.total_price != null ? `${Number(o.total_price).toFixed(2)} TMT` : '—'}
                        </td>
                        <td style={{ padding: '10px 12px' }}><StatusPill status={o.status} size="sm" /></td>
                        <td style={{ padding: '10px 12px', fontFamily: TZ.mono, fontSize: 11.5, color: TZ.muted, whiteSpace: 'nowrap' }}>
                          {new Date(o.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', fontFamily: TZ.sans,
                        fontSize: 12, color: TZ.faint }}>{t('common.noOrders')}</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}

function PageBtn({ children, onClick, active, disabled }) {
  const TZ = useTZ()
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
