import { useState } from 'react'
import { useSelector } from 'react-redux'
import { MapPin, ArrowRight } from 'lucide-react'
import { AdminShell } from '../components/shell/AdminShell.jsx'
import { Avatar } from '../design/atoms.jsx'
import { AssignDriverMenu } from '../components/orders/AssignDriverMenu.jsx'
import { useTZ, STATUS } from '../design/tokens.js'
import { useApi } from '../api/useApi.js'
import { listOrders, updateOrderStatus, assignDriver } from '../api/orders.js'
import { listDrivers } from '../api/drivers.js'
import { useT } from '../i18n/useT.js'

const TRANSITIONS = {
  created:   ['accepted'],
  accepted:  ['arrived', 'on_way'],
  arrived:   ['on_way'],
  on_way:    ['completed'],
  completed: [],
}

export default function BoardPage({ shell }) {
  const lang = useSelector(state => state.ui.lang)
  const TZ = useTZ()
  const t = useT()

  const COLS = [
    { id: 'created',   dot: TZ.muted,  accent: TZ.muted,  soft: TZ.surface3  },
    { id: 'accepted',  dot: '#5B4FC9', accent: '#5B4FC9', soft: '#ECEAFB'    },
    { id: 'arrived',   dot: '#C98612', accent: '#C98612', soft: '#FCF1DA'    },
    { id: 'on_way',    dot: TZ.navy,   accent: TZ.navy,   soft: TZ.navySoft  },
    { id: 'completed', dot: TZ.green,  accent: TZ.green,  soft: TZ.greenSoft },
  ]

  const { data, error, reload } = useApi(() => listOrders({ limit: 200 }), [])
  const orders = data?.data ?? []

  const { data: driversData } = useApi(() => listDrivers({ isActive: true, limit: 200 }), [])
  const driverOptions = (driversData?.data ?? []).map(d => ({
    id: d.id, name: `${d.first_name} ${d.last_name}`.trim(), online: !!d.is_active,
  }))

  const [pending, setPending] = useState(null)
  const [dragId, setDragId] = useState(null)
  const [overCol, setOverCol] = useState(null)

  const draggedOrder = orders.find(o => o.id === dragId)
  const dropTargets = draggedOrder ? (TRANSITIONS[draggedOrder.status] ?? []) : []

  function onDrop(colId) {
    setOverCol(null)
    if (!dragId || !dropTargets.includes(colId)) return
    move(dragId, colId)
    setDragId(null)
  }

  async function move(id, status) {
    setPending(id)
    try {
      await updateOrderStatus(id, status)
      reload()
    } catch (err) {
      alert(err.message || t('board.transitionError'))
    } finally {
      setPending(null)
    }
  }

  async function assign(id, taxiId) {
    setPending(id)
    try {
      await assignDriver(id, taxiId)
      reload()
    } catch (err) {
      alert(err.message || t('common.assignError'))
    } finally {
      setPending(null)
    }
  }

  return (
    <AdminShell {...shell}
      active="board"
      title={t('board.title')}
      subtitle={t('board.subtitle')}
    >
      {error && (
        <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{error.message}</div>
      )}
      <div style={{ display: 'flex', gap: 12, height: '100%', padding: 16,
        overflowX: 'auto', overflowY: 'hidden' }}>

        {COLS.map(col => {
          const s        = STATUS[col.id]
          const items    = orders.filter(o => o.status === col.id)
          const nexts    = TRANSITIONS[col.id] ?? []
          const isTarget = dragId != null && dropTargets.includes(col.id)
          const isOver   = overCol === col.id && isTarget

          return (
            <div key={col.id} style={{ width: 244, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '2px 2px 6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.dot, flexShrink: 0 }} />
                <span style={{ fontFamily: TZ.sans, fontSize: 13.5, fontWeight: 700, color: TZ.ink, flex: 1 }}>
                  {s?.[lang] ?? s?.tk}
                </span>
                <span style={{ fontFamily: TZ.mono, fontSize: 11, fontWeight: 700, color: col.accent,
                  background: col.soft, borderRadius: 10, padding: '2px 9px' }}>
                  {items.length}
                </span>
              </div>

              {/* Cards */}
              <div
                onDragOver={e => { if (isTarget) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverCol(col.id) } }}
                onDragLeave={() => setOverCol(prev => (prev === col.id ? null : prev))}
                onDrop={e => { e.preventDefault(); onDrop(col.id) }}
                style={{
                flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8,
                padding: col.id === 'created' ? 8 : 0,
                background: isOver ? col.soft : (col.id === 'created' ? TZ.surface2 : 'transparent'),
                border: isTarget ? `1.5px dashed ${col.accent}` : (col.id === 'created' ? `1.5px dashed ${TZ.line}` : '1.5px solid transparent'),
                borderRadius: col.id === 'created' || isTarget ? 10 : 0,
                minHeight: 64,
                transition: 'background 0.12s, border-color 0.12s',
              }}>
                {items.map(o => {
                  const driverName = o.driver_id ? `${o.driver_first_name ?? ''} ${o.driver_last_name ?? ''}`.trim() : null
                  const canDrag = (TRANSITIONS[o.status] ?? []).length > 0
                  return (
                    <div key={o.id}
                      draggable={canDrag}
                      onDragStart={e => { setDragId(o.id); e.dataTransfer.effectAllowed = 'move' }}
                      onDragEnd={() => { setDragId(null); setOverCol(null) }}
                      style={{
                      background: TZ.surface, border: `1px solid ${TZ.line}`, borderRadius: 10,
                      padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      display: 'flex', flexDirection: 'column', gap: 9,
                      opacity: pending === o.id ? 0.6 : (dragId === o.id ? 0.4 : 1),
                      cursor: canDrag ? 'grab' : 'default',
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
                          <AssignDriverMenu drivers={driverOptions} busy={pending === o.id}
                            label={t('common.assign')} searchPlaceholder={t('common.searchDriver')}
                            emptyLabel={t('common.noDrivers')}
                            onSelect={taxiId => assign(o.id, taxiId)} />
                        )}
                        <span style={{ fontFamily: TZ.sans, fontSize: 12.5, fontWeight: 700, color: TZ.ink }}>
                          {Number(o.total_price ?? o.base_price ?? 0).toFixed(0)} TMT
                        </span>
                      </div>

                      {/* Transition buttons */}
                      {nexts.length > 0 && (
                        <div style={{ display: 'flex', gap: 5, paddingTop: 8,
                          borderTop: `1px solid ${TZ.lineSoft}` }}>
                          {nexts.map(next => (
                            <TransitionBtn key={next} disabled={pending === o.id} onClick={() => move(o.id, next)}>
                              <ArrowRight size={10} /> {STATUS[next]?.[lang] ?? STATUS[next]?.tk}
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
                    {t('common.noOrders')}
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
  const TZ = useTZ()
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
