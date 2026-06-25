import { useState } from 'react'
import { Plus, MoreHorizontal, MapPin, ArrowRight } from 'lucide-react'
import { AdminShell } from '../components/shell/AdminShell.jsx'
import { Avatar } from '../design/atoms.jsx'
import { TZ, STATUS } from '../design/tokens.js'
import { ORDERS, DRIVERS } from '../data/mock.js'

const COLS = [
  { id: 'pending',   dot: TZ.muted,  accent: TZ.muted,  soft: TZ.surface3  },
  { id: 'accepted',  dot: '#5B4FC9', accent: '#5B4FC9', soft: '#ECEAFB'    },
  { id: 'arrived',   dot: '#C98612', accent: '#C98612', soft: '#FCF1DA'    },
  { id: 'on_way',    dot: TZ.navy,   accent: TZ.navy,   soft: TZ.navySoft  },
  { id: 'completed', dot: TZ.green,  accent: TZ.green,  soft: TZ.greenSoft },
]

const TRANSITIONS = {
  pending:   ['accepted'],
  accepted:  ['arrived', 'on_way'],
  arrived:   ['on_way'],
  on_way:    ['completed'],
  completed: [],
}

export default function BoardPage({ shell }) {
  const [orders, setOrders] = useState(ORDERS)

  function move(id, status) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
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
                padding: col.id === 'pending' ? 8 : 0,
                background: col.id === 'pending' ? TZ.surface2 : 'transparent',
                border: col.id === 'pending' ? `1.5px dashed ${TZ.line}` : 'none',
                borderRadius: col.id === 'pending' ? 10 : 0,
                minHeight: 64,
              }}>
                {items.map(o => {
                  const driver = DRIVERS.find(d => d.id === o.driver)
                  return (
                    <div key={o.id} style={{
                      background: TZ.surface, border: `1px solid ${TZ.line}`, borderRadius: 10,
                      padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      display: 'flex', flexDirection: 'column', gap: 9,
                    }}>
                      {/* Header row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: TZ.mono, fontSize: 11, fontWeight: 700, color: TZ.muted }}>
                          {o.id}
                        </span>
                        <span style={{ fontFamily: TZ.mono, fontSize: 10.5, color: TZ.faint }}>{o.created}</span>
                      </div>

                      {/* Client */}
                      <div style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 700, color: TZ.ink, lineHeight: 1.3 }}>
                        {o.client}
                      </div>

                      {/* Destination */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5,
                        fontFamily: TZ.sans, fontSize: 11.5, color: TZ.body }}>
                        <MapPin size={12} color={TZ.orange} style={{ marginTop: 1, flexShrink: 0 }} />
                        <span style={{ lineHeight: 1.4 }}>{o.to}</span>
                      </div>

                      {/* Driver + price */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {driver ? (
                          <>
                            <Avatar name={driver.name} size={18} color={driver.color} />
                            <span style={{ fontFamily: TZ.sans, fontSize: 11.5, fontWeight: 600,
                              color: TZ.body, flex: 1 }}>
                              {driver.name.split(' ')[0]}
                            </span>
                          </>
                        ) : (
                          <span style={{ flex: 1, fontFamily: TZ.sans, fontSize: 11.5, fontWeight: 600,
                            color: TZ.orange, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Plus size={10} /> Belle
                          </span>
                        )}
                        <span style={{ fontFamily: TZ.sans, fontSize: 12.5, fontWeight: 700, color: TZ.ink }}>
                          {o.price.toFixed(0)} T
                        </span>
                      </div>

                      {/* Transition buttons */}
                      {nexts.length > 0 && (
                        <div style={{ display: 'flex', gap: 5, paddingTop: 8,
                          borderTop: `1px solid ${TZ.lineSoft}` }}>
                          {nexts.map(next => (
                            <TransitionBtn key={next} onClick={() => move(o.id, next)}>
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

function TransitionBtn({ children, onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        padding: '5px 6px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap',
        fontFamily: TZ.sans, fontSize: 11, fontWeight: 600,
        border: `1px solid ${TZ.line}`, background: TZ.surface2, color: TZ.muted,
        transition: 'all 0.12s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = TZ.navy
        e.currentTarget.style.color = TZ.navy
        e.currentTarget.style.background = TZ.navySoft
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = TZ.line
        e.currentTarget.style.color = TZ.muted
        e.currentTarget.style.background = TZ.surface2
      }}>
      {children}
    </button>
  )
}
