import { useState, useEffect, useMemo, useRef } from 'react'
import { RefreshCw, MapPin, X } from 'lucide-react'
import { AdminShell } from '../components/shell/AdminShell.jsx'
import LiveMap, { fetchLayers } from '../components/map/LiveMap.jsx'
import { StatusPill, Avatar } from '../design/atoms.jsx'
import { AssignDriverMenu } from '../components/orders/AssignDriverMenu.jsx'
import { useTZ } from '../design/tokens.js'
import { useApi } from '../api/useApi.js'
import { listDrivers } from '../api/drivers.js'
import { listOrders, assignDriver } from '../api/orders.js'
import { getSocket, watchCity, unwatchCity, requestCityTaxis } from '../api/socket.js'
import { useT } from '../i18n/useT.js'

const ACTIVE_ORDER_STATUSES = ['created', 'on_way', 'arrived', 'accepted']

export default function MapPage({ shell }) {
  const TZ = useTZ()
  const t = useT()
  const FILTERS = [
    { id: 'all',     label: t('map.filterAll') },
    { id: 'active',  label: t('map.filterActive') },
    { id: 'waiting', label: t('map.filterWaiting') },
    { id: 'offline', label: t('map.filterOffline') },
  ]
  const LEGEND = [
    { c: TZ.navy,   l: t('map.legendOnWay')  },
    { c: TZ.amber,  l: t('map.legendArrived') },
    { c: '#5B4FC9', l: t('map.legendAccepted') },
    { c: TZ.green,  l: t('map.legendFree')    },
    { c: TZ.faint,  l: t('map.legendOffline') },
  ]
  const [filter,  setFilter]  = useState('all')
  const [focusId, setFocusId] = useState(null)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [layers,  setLayers]  = useState([])
  const [layer,   setLayer]   = useState('')
  const [positions, setPositions] = useState({}) // taxiId -> { lat, lng, status }
  const [assigning, setAssigning] = useState(null)

  const { data: driversData, reload: reloadDrivers } = useApi(() => listDrivers({ limit: 200 }), [])
  const { data: ordersData,  reload: reloadOrders  } = useApi(() => listOrders({ limit: 200 }), [])

  const drivers = driversData?.data ?? []
  const orders  = ordersData?.data ?? []

  useEffect(() => {
    fetchLayers().then(setLayers).catch(() => setLayers([]))
  }, [])

  // Subscribe to live taxi positions for every city that has a driver.
  const cityIds = useMemo(() => [...new Set(drivers.map(d => d.city_id).filter(Boolean))], [drivers])
  const watchedRef = useRef([])

  useEffect(() => {
    const socket = getSocket()

    function onLocation({ taxiId, lat, lng, status }) {
      setPositions(prev => ({ ...prev, [taxiId]: { lat, lng, status } }))
    }
    function onStatus({ taxiId, status }) {
      setPositions(prev => prev[taxiId] ? { ...prev, [taxiId]: { ...prev[taxiId], status } } : prev)
    }
    function onCityTaxis({ taxis }) {
      setPositions(prev => {
        const next = { ...prev }
        for (const t of taxis) next[t.taxiId] = { lat: t.lat, lng: t.lng, status: t.status }
        return next
      })
    }

    socket.on('taxi:location:update', onLocation)
    socket.on('taxi:status:update', onStatus)
    socket.on('city:taxis', onCityTaxis)

    for (const cityId of cityIds) {
      watchCity(cityId)
      requestCityTaxis(cityId)
    }
    watchedRef.current = cityIds

    return () => {
      socket.off('taxi:location:update', onLocation)
      socket.off('taxi:status:update', onStatus)
      socket.off('city:taxis', onCityTaxis)
      watchedRef.current.forEach(unwatchCity)
    }
  }, [cityIds])

  const liveDrivers = drivers.map(d => {
    const pos = positions[d.id]
    return {
      id: d.id,
      name: `${d.first_name} ${d.last_name}`,
      plate: d.auto_number,
      car: [d.marka_name, d.model_name].filter(Boolean).join(' '),
      status: pos?.status ?? (d.is_active ? 'online' : 'offline'),
      lat: pos?.lat, lng: pos?.lng,
      focus: d.id === focusId,
    }
  })

  const liveOrders = orders
    .filter(o => ACTIVE_ORDER_STATUSES.includes(o.status))
    .map(o => ({
      id: o.id, client: o.client_name, from: o.start_address, to: o.end_address,
      price: o.total_price ?? o.base_price, status: o.status,
      lat: o.start_lat, lng: o.start_lng,
      startLat: o.start_lat, startLng: o.start_lng,
      endLat: o.end_lat, endLng: o.end_lng,
      driverId: o.driver_id,
    }))

  const fd = liveDrivers.find(d => d.id === focusId)
  const fo = liveOrders.find(o => o.id === selectedOrderId)
    ?? (fd ? liveOrders.find(o => o.driverId === fd.id) : null)

  const FILTER_MATCH = {
    all:     () => true,
    active:  s => ['on_way', 'arrived', 'accepted'].includes(s),
    waiting: s => s === 'online',
    offline: s => s === 'offline',
  }
  const mapDrivers = liveDrivers.filter(d => (FILTER_MATCH[filter] ?? FILTER_MATCH.all)(d.status))

  const online  = liveDrivers.filter(d => d.status !== 'offline').length
  const inTrip  = liveDrivers.filter(d => d.status === 'on_way').length
  const active  = liveOrders.filter(o => ['on_way', 'arrived', 'accepted'].includes(o.status)).length
  const pending = liveOrders.filter(o => o.status === 'created').length

  const driverOptions = liveDrivers.map(d => ({ id: d.id, name: d.name, online: d.status !== 'offline' }))

  async function assign(orderId, taxiId) {
    setAssigning(orderId)
    try {
      await assignDriver(orderId, taxiId)
      reloadOrders()
    } catch (err) {
      alert(err.message || t('common.assignError'))
    } finally {
      setAssigning(null)
    }
  }

  function refresh() { reloadDrivers(); reloadOrders() }

  return (
    <AdminShell {...shell}
      active="map"
      title={t('map.title')}
      subtitle={`${online} ${t('map.subtitleWaiting')} · ${active} ${t('map.subtitleOnWay')} · ${pending} ${t('map.subtitlePending')}`}
      actions={
        <button type="button" onClick={refresh}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            border: `1px solid ${TZ.line}`, borderRadius: 8, background: TZ.surface,
            fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.body, cursor: 'pointer' }}>
          <RefreshCw size={13} /> {t('map.refresh')}
        </button>
      }
    >
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

        {/* ── Map ── */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>

          {/* Filter chips */}
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, display: 'flex', gap: 6 }}>
            {FILTERS.map(f => {
              const on = f.id === filter
              return (
                <button key={f.id} onClick={() => setFilter(f.id)} type="button"
                  style={{
                    padding: '6px 14px', borderRadius: 20,
                    fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.12s',
                    border: on ? `1px solid ${TZ.navy}` : `1px solid ${TZ.line}`,
                    background: on ? TZ.navy : '#fff',
                    color: on ? '#fff' : TZ.body,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                  }}>
                  {f.label}
                </button>
              )
            })}

            {/* Layer / table inspector */}
            {/* <select value={layer} onChange={e => setLayer(e.target.value)}
              disabled={layers.length === 0}
              title={t('map.layerDebugTitle')}
              style={{
                padding: '6px 12px', borderRadius: 20,
                fontFamily: TZ.sans, fontSize: 12, fontWeight: 600,
                cursor: layers.length === 0 ? 'not-allowed' : 'pointer',
                border: layer ? `1px solid ${TZ.orange}` : `1px solid ${TZ.line}`,
                background: layer ? TZ.orange : '#fff',
                color: layer ? '#fff' : (layers.length === 0 ? TZ.faint : TZ.body),
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)', maxWidth: 200,
                opacity: layers.length === 0 ? 0.7 : 1,
              }}>
              <option value="">
                {layers.length === 0 ? t('map.layerNone') : t('map.layerPick')}
              </option>
              {layers.map(l => <option key={l} value={l}>{l}</option>)}
            </select> */}
          </div>

          {/* Legend */}
          <div style={{
            position: 'absolute', bottom: 16, left: 12, zIndex: 1000,
            background: 'rgba(255,255,255,0.97)', borderRadius: 12, padding: '10px 14px',
            border: `1px solid ${TZ.line}`, boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontFamily: TZ.sans, fontSize: 10, fontWeight: 700, color: TZ.muted,
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t('map.legendTitle')}</div>
            {LEGEND.map(({ c, l }) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
                <span style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.body }}>{l}</span>
              </div>
            ))}
          </div>

          <LiveMap debugLayer={layer} drivers={mapDrivers} orders={liveOrders} selectedOrder={fo} />
        </div>

        {/* ── Right rail ── */}
        <div style={{
          width: 272, flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: TZ.surface, borderLeft: `1px solid ${TZ.line}`, overflow: 'hidden',
        }}>

          {/* KPI tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${TZ.line}` }}>
            {[
              { l: t('map.kpiWaiting'), v: online,  c: TZ.green  },
              { l: t('map.kpiOnWay'),   v: inTrip,  c: TZ.navy   },
              { l: t('map.kpiOrders'),  v: active,  c: '#5B4FC9' },
              { l: t('map.kpiPending'), v: pending, c: TZ.orange },
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
                  <Avatar name={fd.name} size={38} color={TZ.navy} />
                  <span style={{
                    position: 'absolute', bottom: -1, right: -1,
                    width: 11, height: 11, borderRadius: '50%', border: '2px solid #fff',
                    background: fd.status === 'offline' ? TZ.faint : TZ.green,
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 700, color: TZ.ink,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fd.name}</div>
                  <div style={{ fontFamily: TZ.mono, fontSize: 11, color: TZ.muted, marginTop: 1 }}>{fd.plate}</div>
                </div>
                <button onClick={() => { setFocusId(null); setSelectedOrderId(null) }} type="button"
                  style={{ background: 'transparent', border: 0, color: TZ.faint, cursor: 'pointer', padding: 2, flexShrink: 0 }}>
                  <X size={14} />
                </button>
              </div>
              <StatusPill status={fd.status} />
              {fo && (
                <div style={{ marginTop: 10, background: TZ.surface, borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontFamily: TZ.mono, fontSize: 10.5, fontWeight: 700, color: TZ.muted }}>#{fo.id}</span>
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
              {t('map.pickDriverHint')}
            </div>
          )}

          {/* Active order list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{
              padding: '10px 16px 8px', fontFamily: TZ.sans, fontSize: 10, fontWeight: 700,
              color: TZ.muted, textTransform: 'uppercase', letterSpacing: 1,
              position: 'sticky', top: 0, background: TZ.surface, borderBottom: `1px solid ${TZ.lineSoft}`,
            }}>
              {t('map.activeOrdersTitle')}
            </div>

            {liveOrders.map(o => {
              const driver = liveDrivers.find(d => d.id === o.driverId)
              return (
                <div key={o.id}
                  onClick={() => { setSelectedOrderId(o.id); if (driver) setFocusId(driver.id) }}
                  style={{ padding: '12px 16px', borderBottom: `1px solid ${TZ.lineSoft}`,
                    cursor: 'pointer', transition: 'background 0.1s',
                    background: o.id === selectedOrderId ? TZ.navyTint : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <span style={{ fontFamily: TZ.mono, fontSize: 10.5, fontWeight: 700, color: TZ.muted }}>#{o.id}</span>
                    <StatusPill status={o.status} size="sm" />
                    <span style={{ marginLeft: 'auto', fontFamily: TZ.sans, fontSize: 12, fontWeight: 700, color: TZ.ink }}>
                      {Number(o.price ?? 0).toFixed(0)} TMT
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5,
                    fontFamily: TZ.sans, fontSize: 12, color: TZ.body }}>
                    <MapPin size={10} color={TZ.orange} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.to ?? '—'}</span>
                  </div>
                  {driver && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                      <Avatar name={driver.name} size={16} color={TZ.navy} />
                      <span style={{ fontFamily: TZ.sans, fontSize: 11, color: TZ.muted }}>
                        {driver.name.split(' ')[0]}
                      </span>
                    </div>
                  )}
                  {!driver && (
                    <div style={{ marginTop: 5 }}>
                      <AssignDriverMenu drivers={driverOptions} busy={assigning === o.id}
                        label={t('map.assignDriver')} searchPlaceholder={t('common.searchDriver')}
                        emptyLabel={t('common.noDrivers')} fontSize={11.5} iconSize={11}
                        onSelect={taxiId => assign(o.id, taxiId)} />
                    </div>
                  )}
                </div>
              )
            })}
            {liveOrders.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', fontFamily: TZ.sans, fontSize: 12, color: TZ.faint }}>
                {t('map.noActiveOrders')}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
