import { useState } from 'react'
import { Plus, MoreHorizontal, MapPin, ArrowRight } from 'lucide-react'
import { AdminShell } from '../components/shell/AdminShell.jsx'
import { Avatar } from '../design/atoms.jsx'
import { TZ, STATUS } from '../design/tokens.js'
import { useApi } from '../api/useApi.js'
import { listOrders, updateOrderStatus } from '../api/orders.js'

const COLS = [
  { id: 'created',   dot: TZ.muted,  accent: TZ.muted,  soft: TZ.surface3  },
  { id: 'accepted',  dot: '#5B4FC9', accent: '#5B4FC9', soft: '#ECEAFB'    },
  { id: 'arrived',   dot: '#C98612', accent: '#C98612', soft: '#FCF1DA'    },
  { id: 'on_way',    dot: TZ.navy,   accent: TZ.navy,   soft: TZ.navySoft  },
  { id: 'completed', dot: TZ.green,  accent: TZ.green,  soft: TZ.greenSoft },
]

const TRANSITIONS = {
  created:   ['accepted'],
  accepted:  ['arrived', 'on_way'],
  arrived:   ['on_way'],
  on_way:    ['completed'],
  completed: [],
}

export default function BoardPage({ shell }) {
  const { data, error, reload } = useApi(() => listOrders({ limit: 200 }), [])
  const orders = data?.data ?? []

  const [pending, setPending] = useState(null)

  async function move(id, status) {
    setPending(id)
    try {
      await updateOrderStatus(id, status)
      reload()
    } catch (err) {
      alert(err.message || 'Status üýtgetmek şowsuz boldy')
    } finally {
      setPending(null)
    }
  }

  return (
    <AdminShell {...shell}
      active="board"
      title="Status tagtasy"
      subtitle="Sargydyň statusyny üýtgetmek üçin düwmä basyň"
      actions={
        <button type="button"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            border: 0, borderRadius: 8, background: TZ.navy, color: '#fff',
            fontFamily: TZ.sans, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={13} /> Täze sargyt
        </button>
      }
    >
      {error && (
        <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{error.message}</div>
      )}
      <div style={{ display: 'flex', gap: 12, height: '100%', padding: 16,
        overflowX: 'auto', overflowY: 'hidden' }}>

        {COLS.map(col => {
          const s     = STATUS[col.id]
          const items = orders.filter(o => o.status === col.id)
          const nexts = TRANSITIONS[col.id] ?? []

          return (
            <div key={col.id} style={{ width: 244, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '2px 2px 6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.dot, flexShrink: 0 }} />
                <span style={{ fontFamily: TZ.sans, fontSize: 13.5, fontWeight: 700, color: TZ.ink, flex: 1 }}>
                  {s?.tk}
                </span>
                <span style={{ fontFamily: TZ.mono, fontSize: 11, fontWeight: 700, color: col.accent,
                  background: col.soft, borderRadius: 10, padding: '2px 9px' }}>
                  {items.length}
                </span>
                <button type="button" style={{ background: 'none', border: 0, cursor: 'pointer',
                  color: TZ.faint, padding: 2, display: 'flex' }}>
                  <MoreHorizontal size={15} />
                </button>
              </div>

              {/* Cards */}
              <div style={{
                flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8,
                padding: col.id === 'created' ? 8 : 0,
                background: col.id === 'created' ? TZ.surface2 : 'transparent',
                border: col.id === 'created' ? `1.5px dashed ${TZ.line}` : 'none',
                borderRadius: col.id === 'created' ? 10 : 0,
                minHeight: 64,
              }}>
                {items.map(o => {
                  const driverName = o.driver_id ? `${o.driver_first_name ?? ''} ${o.driver_last_name ?? ''}`.trim() : null
                  return (
                    <div key={o.id} style={{
                      background: TZ.surface, border: `1px solid ${TZ.line}`, borderRadius: 10,
                      padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      display: 'flex', flexDirection: 'column', gap: 9,
                      opacity: pending === o.id ? 0.6 : 1,
                    }}>
                      {/* Header row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: TZ.mono, fontSize: 11, fontWeight: 700, color: TZ.muted }}>
                          #{o.id}
                        </span>
                        <span style={{ fontFamily: TZ.mono, fontSize: 10.5, color: TZ.faint }}>
                          {new Date(o.created_at).toLocaleTimeString()}
                        </span>
                      </div>

                      {/* Client */}
                      <div style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 700, color: TZ.ink, lineHeight: 1.3 }}>
                        {o.client_name ?? '—'}
                      </div>

                      {/* Destination */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5,
                        fontFamily: TZ.sans, fontSize: 11.5, color: TZ.body }}>
                        <MapPin size={12} color={TZ.orange} style={{ marginTop: 1, flexShrink: 0 }} />
                        <span style={{ lineHeight: 1.4 }}>{o.end_address ?? '—'}</span>
                      </div>

                      {/* Driver + price */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {driverName ? (
                          <>
                            <Avatar name={driverName} size={18} color={TZ.navy} />
                            <span style={{ fontFamily: TZ.sans, fontSize: 11.5, fontWeight: 600,
                              color: TZ.body, flex: 1 }}>
                              {driverName.split(' ')[0]}
                            </span>
                          </>
                        ) : (
                          <span style={{ flex: 1, fontFamily: TZ.sans, fontSize: 11.5, fontWeight: 600,
                            color: TZ.orange, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Plus size={10} /> Belle
                          </span>
                        )}
                        <span style={{ fontFamily: TZ.sans, fontSize: 12.5, fontWeight: 700, color: TZ.ink }}>
                          {Number(o.total_price ?? o.base_price ?? 0).toFixed(0)} T
                        </span>
                      </div>

                      {/* Transition buttons */}
                      {nexts.length > 0 && (
                        <div style={{ display: 'flex', gap: 5, paddingTop: 8,
                          borderTop: `1px solid ${TZ.lineSoft}` }}>
                          {nexts.map(next => (
                            <TransitionBtn key={next} disabled={pending === o.id} onClick={() => move(o.id, next)}>
                              <ArrowRight size={10} /> {STATUS[next]?.tk}
                            </TransitionBtn>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}

                {items.length === 0 && (
                  <div style={{ padding: '20px 0', textAlign: 'center',
                    fontFamily: TZ.sans, fontSize: 12, color: TZ.faint }}>
                    Sargyt ýok
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </AdminShell>
  )
}

function TransitionBtn({ children, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        padding: '5px 6px', borderRadius: 6, cursor: disabled ? 'default' : 'pointer', whiteSpace: 'nowrap',
        fontFamily: TZ.sans, fontSize: 11, fontWeight: 600, opacity: disabled ? 0.5 : 1,
        border: `1px solid ${TZ.line}`, background: TZ.surface2, color: TZ.muted,
        transition: 'all 0.12s',
      }}>
      {children}
    </button>
  )
}
