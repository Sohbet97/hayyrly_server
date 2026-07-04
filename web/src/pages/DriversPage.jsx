import { useState } from 'react'
import { Plus, Search, MoreHorizontal, Phone, Map, X, Check, Wallet } from 'lucide-react'
import { AdminShell } from '../components/shell/AdminShell.jsx'
import { StatusPill, Avatar } from '../design/atoms.jsx'
import { TZ } from '../design/tokens.js'
import { useApi } from '../api/useApi.js'
import { listDrivers, adjustBalance } from '../api/drivers.js'
import { listApplications, approveApplication, rejectApplication } from '../api/applications.js'

const DRIVER_COLORS = ['#0E2A4D', '#C98612', '#5B4FC9', '#1B8F5A', '#C24536']
function colorFor(id) { return DRIVER_COLORS[id % DRIVER_COLORS.length] }

export default function DriversPage({ shell }) {
  const [tab,      setTab]      = useState('drivers')
  const [search,   setSearch]   = useState('')
  const [rejectId, setRejectId] = useState(null)
  const [reason,   setReason]   = useState('')
  const [balanceFor, setBalanceFor] = useState(null)
  const [balanceForm, setBalanceForm] = useState({ amount: '', direction: 'add', note: '' })

  const { data: driversData, loading: driversLoading, error: driversError, reload: reloadDrivers } =
    useApi(() => listDrivers({ limit: 100 }), [])
  const { data: appsData, loading: appsLoading, error: appsError, reload: reloadApps } =
    useApi(() => listApplications({ status: 'pending', limit: 100 }), [])

  const drivers = driversData?.data ?? []
  const apps    = appsData?.data ?? []

  const filtered = drivers.filter(d => {
    const name = `${d.first_name} ${d.last_name}`.toLowerCase()
    return !search || name.includes(search.toLowerCase()) || (d.auto_number ?? '').toLowerCase().includes(search.toLowerCase())
  })

  async function approve(id) {
    try { await approveApplication(id); reloadApps(); reloadDrivers() }
    catch (err) { alert(err.message || 'Tassyklama şowsuz boldy') }
  }
  async function reject(id) {
    try {
      await rejectApplication(id, reason)
      setRejectId(null); setReason('')
      reloadApps()
    } catch (err) { alert(err.message || 'Ret etmek şowsuz boldy') }
  }

  async function submitBalance(e) {
    e.preventDefault()
    try {
      await adjustBalance(balanceFor.user_id, {
        amount: parseFloat(balanceForm.amount),
        direction: balanceForm.direction,
        note: balanceForm.note,
      })
      setBalanceFor(null)
      setBalanceForm({ amount: '', direction: 'add', note: '' })
      reloadDrivers()
    } catch (err) {
      alert(err.message || 'Balans üýtgetmek şowsuz boldy')
    }
  }

  return (
    <AdminShell {...shell}
      active="drivers"
      title="Sürüjiler"
      subtitle={`${drivers.length} adam · ${drivers.filter(d => d.is_active).length} işjeň · ${apps.length} garaşýan arza`}
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
              { id: 'drivers', label: 'Sürüjiler', n: drivers.length, badge: false },
              { id: 'apps',    label: 'Arzalar',   n: apps.length,    badge: true  },
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
          <>
            {driversLoading && <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>Ýüklenýär…</div>}
            {driversError && <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{driversError.message}</div>}
            {!driversLoading && !driversError && (
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto',
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, alignContent: 'start' }}>
                {filtered.map(d => {
                  const name = `${d.first_name} ${d.last_name}`
                  const car  = [d.marka_name, d.model_name].filter(Boolean).join(' ')
                  return (
                    <div key={d.id} style={{
                      background: TZ.surface, border: `1px solid ${TZ.line}`, borderRadius: 12,
                      padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
                      opacity: d.is_active ? 1 : 0.75,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <Avatar name={name} size={44} color={colorFor(d.id)} />
                          <span style={{
                            position: 'absolute', bottom: -1, right: -1, width: 12, height: 12,
                            borderRadius: '50%', border: '2px solid #fff',
                            background: d.is_active ? TZ.green : TZ.faint,
                          }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: TZ.sans, fontSize: 13.5, fontWeight: 700, color: TZ.ink,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                          <div style={{ fontFamily: TZ.mono, fontSize: 11.5, color: TZ.muted, marginTop: 2 }}>{d.auto_number}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <StatusPill status={d.is_active ? 'online' : 'offline'} size="sm" />
                        {car && (
                          <span style={{ fontFamily: TZ.sans, fontSize: 11, fontWeight: 600, color: TZ.body,
                            background: TZ.surface3, borderRadius: 10, padding: '2px 8px' }}>{car}</span>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                        {[
                          { l: 'Sargyt', v: d.completed_orders },
                          { l: 'Balans', v: `${Number(d.balance).toFixed(0)} T` },
                          { l: 'Şäher',  v: d.city_name ?? '—' },
                        ].map((s, i) => (
                          <div key={i} style={{ background: TZ.surface2, borderRadius: 8, padding: '8px 6px' }}>
                            <div style={{ fontFamily: TZ.sans, fontSize: 9.5, fontWeight: 700, color: TZ.muted,
                              textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{s.l}</div>
                            <div style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 700, color: TZ.ink,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.v}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                          fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.body,
                          border: `1px solid ${TZ.line}`, background: TZ.surface,
                        }}>
                          <Phone size={13} /> Jaň et
                        </button>
                        <button type="button" onClick={() => setBalanceFor(d)} style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                          fontFamily: TZ.sans, fontSize: 12, fontWeight: 700, color: '#fff',
                          border: 0, background: TZ.navy,
                        }}>
                          <Wallet size={13} /> Balans
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── Applications table ── */}
        {tab === 'apps' && (
          <div style={{ flex: 1, minHeight: 0, background: TZ.surface, border: `1px solid ${TZ.line}`,
            borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {appsLoading && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>Ýüklenýär…</div>}
            {appsError && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{appsError.message}</div>}
            {!appsLoading && !appsError && (
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: TZ.surface2, borderBottom: `1px solid ${TZ.line}` }}>
                      {['At-Familiýa','Telefon','Maşyn','Park','Iberilen',''].map((h, i) => (
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
                          fontWeight: 600, color: TZ.ink }}>{a.first_name} {a.last_name}</td>
                        <td style={{ padding: '13px 16px', fontFamily: TZ.mono, fontSize: 11.5,
                          color: TZ.muted }}>{a.phone}</td>
                        <td style={{ padding: '13px 16px', fontFamily: TZ.mono, fontSize: 11,
                          color: TZ.muted }}>{a.auto_number ?? '—'}</td>
                        <td style={{ padding: '13px 16px', fontFamily: TZ.sans, fontSize: 13, color: TZ.body }}>{a.park ?? '—'}</td>
                        <td style={{ padding: '13px 16px', fontFamily: TZ.mono, fontSize: 11.5, color: TZ.muted }}>
                          {new Date(a.created_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <ActionBtn onClick={() => approve(a.id)} color={TZ.green} bg={TZ.greenSoft}>
                              <Check size={12} /> Tassykla
                            </ActionBtn>
                            <ActionBtn onClick={() => setRejectId(a.id)} color={TZ.red} bg={TZ.redSoft}>
                              <X size={12} /> Ret et
                            </ActionBtn>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {apps.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', fontFamily: TZ.sans,
                        fontSize: 12, color: TZ.faint }}>Garaşylýan arza ýok</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
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
                color: TZ.ink, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
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

      {/* ── Balance modal ── */}
      {balanceFor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <form onSubmit={submitBalance} style={{ background: '#fff', borderRadius: 16, padding: 24,
            width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: TZ.sans, fontSize: 16, fontWeight: 800, color: TZ.ink, margin: 0 }}>
                {balanceFor.first_name} {balanceFor.last_name} — Balans
              </h3>
              <button onClick={() => setBalanceFor(null)} type="button"
                style={{ background: 'none', border: 0, cursor: 'pointer', color: TZ.faint, padding: 2 }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {['add', 'remove'].map(dir => (
                <button key={dir} type="button" onClick={() => setBalanceForm({ ...balanceForm, direction: dir })}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                    fontFamily: TZ.sans, fontSize: 12, fontWeight: 700,
                    border: balanceForm.direction === dir ? 0 : `1px solid ${TZ.line}`,
                    background: balanceForm.direction === dir ? (dir === 'add' ? TZ.green : TZ.red) : TZ.surface,
                    color: balanceForm.direction === dir ? '#fff' : TZ.body }}>
                  {dir === 'add' ? 'Goşmak' : 'Aýyrmak'}
                </button>
              ))}
            </div>
            <input required type="number" step="0.01" placeholder="Mukdar (TMT)" value={balanceForm.amount}
              onChange={e => setBalanceForm({ ...balanceForm, amount: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${TZ.line}`,
                fontFamily: TZ.sans, fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
            <input placeholder="Bellik (hökmany däl)" value={balanceForm.note}
              onChange={e => setBalanceForm({ ...balanceForm, note: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${TZ.line}`,
                fontFamily: TZ.sans, fontSize: 13, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setBalanceFor(null)} type="button"
                style={{ padding: '9px 18px', borderRadius: 9, border: `1px solid ${TZ.line}`,
                  background: TZ.surface, fontFamily: TZ.sans, fontSize: 13, fontWeight: 600,
                  color: TZ.body, cursor: 'pointer' }}>Ýap</button>
              <button type="submit"
                style={{ padding: '9px 18px', borderRadius: 9, border: 0,
                  background: TZ.navy, color: '#fff', fontFamily: TZ.sans,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Ýerine ýetir</button>
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  )
}

function ActionBtn({ onClick, color, bg, children }) {
  return (
    <button onClick={onClick} type="button"
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
        borderRadius: 7, border: 0, background: bg, color, cursor: 'pointer',
        fontFamily: 'var(--sans)', fontSize: 11.5, fontWeight: 700 }}>
      {children}
    </button>
  )
}
