import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { usePageHeader } from '../components/shell/AdminShell.jsx'
import { StatusPill, Avatar } from '../design/atoms.jsx'
import { useTZ, STATUS } from '../design/tokens.js'
import { useApi } from '../api/useApi.js'
import { getOrder } from '../api/orders.js'
import { useT } from '../i18n/useT.js'
import { useSelector } from 'react-redux'
import LiveMap from '../components/map/LiveMap.jsx'
import { ChatPanel } from '../components/orders/ChatPanel.jsx'

export default function OrderDetailPage({ shell }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const TZ = useTZ()
  const t = useT()
  const lang = useSelector(state => state.ui.lang)

  const { data, loading, error } = useApi(() => getOrder(id), [id])
  const order = data?.order

  const selectedOrder = order ? {
    id: order.id,
    from: order.start_address,
    to: order.end_address,
    startLat: order.start_lat, startLng: order.start_lng,
    endLat: order.end_lat, endLng: order.end_lng,
  } : null

  const driverName = order?.driver_id
    ? `${order.driver_first_name ?? ''} ${order.driver_last_name ?? ''}`.trim()
    : null

  usePageHeader({
    title: `${t('orderDetail.title')} #${id}`,
    subtitle: order ? new Date(order.created_at).toLocaleString() : '',
    actions: (
      <button type="button" onClick={() => navigate('/orders')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
          border: `1px solid ${TZ.line}`, borderRadius: 8, background: TZ.surface,
          fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.body, cursor: 'pointer' }}>
        <ArrowLeft size={13} /> {t('orderDetail.back')}
      </button>
    ),
  })

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '14px 16px', gap: 12, overflow: 'hidden' }}>

        {loading && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>{t('common.loading')}</div>}
        {error && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{error.message || t('orderDetail.loadError')}</div>}
        {!loading && !error && !order && (
          <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>{t('orderDetail.notFound')}</div>
        )}

        {order && (
          <>
            {/* Header summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0,
              background: TZ.surface, border: `1px solid ${TZ.line}`, borderRadius: 12, padding: '14px 18px' }}>
              <StatusPill status={order.status} />

              <div>
                <div style={{ fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700, color: TZ.muted, textTransform: 'uppercase' }}>
                  {t('orderDetail.client')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <Avatar name={order.client_name ?? ''} size={26} color={TZ.navy} />
                  <div>
                    <div style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 600, color: TZ.ink }}>{order.client_name ?? '—'}</div>
                    <div style={{ fontFamily: TZ.mono, fontSize: 11, color: TZ.muted }}>{order.client_phone}</div>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700, color: TZ.muted, textTransform: 'uppercase' }}>
                  {t('orderDetail.driver')}
                </div>
                {driverName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Avatar name={driverName} size={26} color={TZ.orange} />
                    <div>
                      <div style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 600, color: TZ.ink }}>{driverName}</div>
                      <div style={{ fontFamily: TZ.mono, fontSize: 11, color: TZ.muted }}>{order.driver_phone}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.faint, marginTop: 4 }}>{t('orderDetail.unassigned')}</div>
                )}
              </div>

              <div style={{ flex: 1 }} />

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700, color: TZ.muted, textTransform: 'uppercase' }}>
                  {t('orderDetail.price')}
                </div>
                <div style={{ fontFamily: TZ.sans, fontSize: 16, fontWeight: 700, color: TZ.ink, marginTop: 4 }}>
                  {Number(order.total_price ?? order.base_price ?? 0).toFixed(2)} TMT
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700, color: TZ.muted, textTransform: 'uppercase' }}>
                  {t('orderDetail.distance')}
                </div>
                <div style={{ fontFamily: TZ.sans, fontSize: 16, fontWeight: 700, color: TZ.ink, marginTop: 4 }}>
                  {order.distance_km} km
                </div>
              </div>
            </div>

            {/* Body: map + timeline, chat below */}
            <div style={{ flex: 1, display: 'flex', gap: 12, minHeight: 0 }}>

              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
                <SectionCard title={t('orderDetail.sectionMap')} TZ={TZ} style={{ flex: 1, minHeight: 0, padding: 0, overflow: 'hidden' }}>
                  <LiveMap style={{ borderRadius: 12 }} selectedOrder={selectedOrder} track={order.track ?? []} />
                </SectionCard>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, maxWidth: 340 }}>
                <SectionCard title={t('orderDetail.sectionTimeline')} TZ={TZ} style={{ flexShrink: 0, maxHeight: 200, overflowY: 'auto' }}>
                  <Timeline logs={order.logs ?? []} lang={lang} TZ={TZ} t={t} />
                </SectionCard>

                <SectionCard title={t('orderDetail.sectionChat')} TZ={TZ} style={{ flex: 1, minHeight: 0, padding: 0, overflow: 'hidden' }}>
                  <ChatPanel orderId={order.id} />
                </SectionCard>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function SectionCard({ title, children, TZ, style }) {
  return (
    <div style={{ background: TZ.surface, border: `1px solid ${TZ.line}`, borderRadius: 12,
      display: 'flex', flexDirection: 'column', ...style }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${TZ.lineSoft}`, flexShrink: 0,
        fontFamily: TZ.sans, fontSize: 12, fontWeight: 700, color: TZ.ink }}>
        {title}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  )
}

function Timeline({ logs, lang, TZ, t }) {
  if (logs.length === 0) {
    return <div style={{ padding: 14, fontFamily: TZ.sans, fontSize: 12, color: TZ.faint }}>{t('orderDetail.noLogs')}</div>
  }
  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {logs.map((l, i) => {
        const s = STATUS[l.status]
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: TZ[s?.ck] ?? TZ.muted, flexShrink: 0 }} />
            <span style={{ flex: 1, fontFamily: TZ.sans, fontSize: 12.5, fontWeight: 600, color: TZ.ink }}>
              {s?.[lang] ?? s?.tk ?? l.status}
            </span>
            <span style={{ fontFamily: TZ.mono, fontSize: 11, color: TZ.muted }}>
              {new Date(l.changed_at).toLocaleTimeString()}
            </span>
          </div>
        )
      })}
    </div>
  )
}
