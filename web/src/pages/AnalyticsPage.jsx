import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Download, TrendingDown, TrendingUp } from 'lucide-react'
import { usePageHeader } from '../components/shell/AdminShell.jsx'
import { Avatar } from '../design/atoms.jsx'
import { useTZ } from '../design/tokens.js'
import { useApi } from '../api/useApi.js'
import { dailyReport, summaryReport, ordersByCity, cancellationSplit, peakHours } from '../api/analytics.js'
import { listCities } from '../api/cities.js'
import { useT } from '../i18n/useT.js'

const PRESET_DAYS = [1, 7, 14, 30]

function toIsoDate(d) { return d.toISOString().slice(0, 10) }
function addDays(isoDate, n) {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return toIsoDate(d)
}

function pctDelta(curr, prev) {
  if (prev === null || prev === undefined) return null
  if (prev === 0) return curr > 0 ? 100 : null
  return ((curr - prev) / prev) * 100
}

function Trend({ value }) {
  const TZ = useTZ()
  if (value === null || value === undefined || Number.isNaN(value)) return null
  const up = value >= 0
  const color = value === 0 ? TZ.muted : (up ? TZ.green : TZ.red)
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontFamily: TZ.sans,
      fontSize: 11, fontWeight: 700, color }}>
      <Icon size={11} /> {Math.abs(value).toFixed(1)}%
    </span>
  )
}

export default function AnalyticsPage({ shell }) {
  const lang = useSelector(state => state.ui.lang)
  const TZ = useTZ()
  const t = useT()
  const today = toIsoDate(new Date())
  const [fromDate, setFromDate] = useState(addDays(today, -13))
  const [toDate, setToDate] = useState(today)
  const [cityId, setCityId] = useState('')

  const activePreset = PRESET_DAYS.find(d => fromDate === addDays(today, -(d - 1)) && toDate === today)
  const params = useMemo(() => ({
    from: fromDate, to: addDays(toDate, 1), cityId: cityId || undefined,
  }), [fromDate, toDate, cityId])

  function selectPreset(days) {
    setFromDate(addDays(today, -(days - 1)))
    setToDate(today)
  }

  const { data: dailyData, loading: dailyLoading, error: dailyError } = useApi(() => dailyReport(params), [params])
  const { data: summaryData, loading: summaryLoading } = useApi(() => summaryReport(params), [params])
  const { data: cityData } = useApi(() => ordersByCity(params), [params])
  const { data: cancelData } = useApi(() => cancellationSplit(params), [params])
  const { data: peakData } = useApi(() => peakHours(params), [params])
  const { data: citiesData } = useApi(() => listCities(), [])

  const cities = citiesData?.data ?? []

  const cityRows = (cityData?.data ?? []).map(r => ({
    n: lang === 'ru' ? (r.name_ru ?? r.name_tm) : r.name_tm,
    v: Number(r.order_count),
  }))
  const cityMax = Math.max(1, ...cityRows.map(r => r.v))
  const cityTotal = cityRows.reduce((a, r) => a + r.v, 0) || 1

  const cancelSplit = cancelData?.result ?? { cancelled_by_user: 0, cancelled_by_driver: 0 }
  const cancelRows = [
    { n: t('analytics.cancelByUser'),   v: cancelSplit.cancelled_by_user,   c: TZ.red },
    { n: t('analytics.cancelByDriver'), v: cancelSplit.cancelled_by_driver, c: TZ.orange },
  ]
  const cancelRawTotal = cancelRows.reduce((a, r) => a + r.v, 0)
  const cancelTotal = cancelRawTotal || 1

  const analyticsDays = (dailyData?.data ?? []).map(d => ({
    label: new Date(d.date).getDate().toString(),
    delivered: Number(d.delivered),
    failed: Number(d.failed),
  }))
  const maxBar = Math.max(1, ...analyticsDays.map(d => d.delivered + d.failed))

  const summary = summaryData?.result ?? {}
  const previous = summary.previous ?? null
  const topDrivers = (summary.top_drivers ?? []).map(d => ({
    id: d.id, name: `${d.first_name} ${d.last_name}`, orders: Number(d.order_count),
  }))
  const maxOrders = topDrivers[0]?.orders ?? 1

  const total   = analyticsDays.reduce((a, d) => a + d.delivered + d.failed, 0)
  const success = analyticsDays.reduce((a, d) => a + d.delivered, 0)
  const rate    = total > 0 ? ((success / total) * 100).toFixed(1) : '0.0'

  const totalOrders  = Number(summary.total_orders ?? total)
  const revenue      = Number(summary.revenue ?? 0)
  const avgOrderVal  = Number(summary.avg_order_value ?? 0)
  const avgDistance  = Number(summary.avg_distance_km ?? 0)
  const activeDrivers = Number(summary.active_drivers ?? 0)

  const prevRate = previous && previous.total_orders > 0
    ? (previous.completed / previous.total_orders) * 100 : null

  const revenueByType = (summary.revenue_by_type ?? []).map(r => ({
    n: t(`payments.type${r.payment_type.charAt(0).toUpperCase()}${r.payment_type.slice(1)}`),
    v: Number(r.amount),
  }))
  const revenueByTypeTotal = revenueByType.reduce((a, r) => a + r.v, 0) || 1
  const revenueByTypeMax = Math.max(1, ...revenueByType.map(r => r.v))

  const peakRows = peakData?.data ?? []
  const peakMax = Math.max(1, ...peakRows.map(r => Number(r.order_count)))

  const KPIS = [
    { l: t('analytics.kpiTotalOrders'), v: totalOrders, accent: TZ.navy,
      trend: previous ? pctDelta(totalOrders, previous.total_orders) : null },
    { l: t('analytics.kpiSuccessRate'), v: `${rate}%`, accent: TZ.green,
      trend: prevRate !== null ? pctDelta(Number(rate), prevRate) : null },
    { l: t('analytics.kpiRevenue'), v: `${revenue.toFixed(0)} TMT`, accent: TZ.orange,
      trend: previous ? pctDelta(revenue, previous.revenue) : null },
    { l: t('analytics.kpiActiveDrivers'), v: activeDrivers, accent: '#5B4FC9', trend: null },
    { l: t('analytics.kpiAvgOrderValue'), v: `${avgOrderVal.toFixed(0)} TMT`, accent: TZ.navy, trend: null },
    { l: t('analytics.kpiAvgDistance'), v: `${avgDistance.toFixed(1)} km`, accent: TZ.orange, trend: null },
  ]

  function exportCsv() {
    const summaryRows = [
      [t('analytics.csvSummary')],
      [t('analytics.kpiTotalOrders'), totalOrders],
      [t('analytics.kpiSuccessRate'), `${rate}%`],
      [t('analytics.kpiRevenue'), revenue.toFixed(0)],
      [t('analytics.kpiActiveDrivers'), activeDrivers],
      [t('analytics.kpiAvgOrderValue'), avgOrderVal.toFixed(2)],
      [t('analytics.kpiAvgDistance'), avgDistance.toFixed(2)],
      [],
      [t('analytics.csvDate'), t('analytics.legendDelivered'), t('analytics.legendCancelled')],
    ]
    const rows = (dailyData?.data ?? []).map(d => [
      new Date(d.date).toLocaleDateString(), Number(d.delivered), Number(d.failed),
    ])
    const csv = [...summaryRows, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analitika-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  usePageHeader({
    title: t('analytics.title'),
    subtitle: `${fromDate} — ${toDate}`,
    actions: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Range presets */}
          <div style={{ display: 'flex', background: TZ.surface2, border: `1px solid ${TZ.line}`,
            borderRadius: 9, padding: 3, gap: 2 }}>
            {PRESET_DAYS.map((days, i) => {
              const labels = [t('analytics.rangeToday'), t('analytics.range7'), t('analytics.range14'), t('analytics.range30')]
              const on = activePreset === days
              return (
                <button key={days} onClick={() => selectPreset(days)} type="button"
                  style={{
                    padding: '5px 11px', borderRadius: 7, border: 0, cursor: 'pointer',
                    fontFamily: TZ.sans, fontSize: 12, fontWeight: on ? 700 : 500,
                    background: on ? TZ.navy : 'transparent',
                    color: on ? '#fff' : TZ.muted,
                    transition: 'all 0.12s',
                  }}>
                  {labels[i]}
                </button>
              )
            })}
          </div>

          {/* Custom range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="date" value={fromDate} max={toDate} onChange={e => setFromDate(e.target.value)}
              style={{ padding: '6px 8px', borderRadius: 8, border: `1px solid ${TZ.line}`,
                fontFamily: TZ.sans, fontSize: 12, color: TZ.body, background: TZ.surface }} />
            <span style={{ color: TZ.faint, fontSize: 12 }}>—</span>
            <input type="date" value={toDate} min={fromDate} max={today} onChange={e => setToDate(e.target.value)}
              style={{ padding: '6px 8px', borderRadius: 8, border: `1px solid ${TZ.line}`,
                fontFamily: TZ.sans, fontSize: 12, color: TZ.body, background: TZ.surface }} />
          </div>

          {/* City filter */}
          <select value={cityId} onChange={e => setCityId(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${TZ.line}`,
              fontFamily: TZ.sans, fontSize: 12, color: TZ.body, background: TZ.surface }}>
            <option value="">{t('analytics.cityAll')}</option>
            {cities.map(c => (
              <option key={c.id} value={c.id}>{lang === 'ru' ? (c.name_ru ?? c.name_tm) : c.name_tm}</option>
            ))}
          </select>

          <button type="button" onClick={exportCsv}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
              border: `1px solid ${TZ.line}`, borderRadius: 8, background: TZ.surface,
              fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.body, cursor: 'pointer' }}>
            <Download size={13} /> {t('analytics.export')}
          </button>
        </div>
    ),
  })

  return (
    <>
      <div style={{ height: '100%', overflowY: 'auto', padding: 16, display: 'flex',
        flexDirection: 'column', gap: 12 }}>

        {/* ── KPI row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, flexShrink: 0 }}>
          {KPIS.map((k, i) => (
            <div key={i} style={{ background: TZ.surface, border: `1px solid ${TZ.line}`,
              borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: k.accent }} />
                  <span style={{ fontFamily: TZ.sans, fontSize: 11, fontWeight: 700, color: TZ.muted,
                    textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.l}</span>
                </div>
                <Trend value={k.trend} />
              </div>
              <div style={{ fontFamily: TZ.sans, fontSize: 32, fontWeight: 800, color: k.accent,
                lineHeight: 1 }}>{k.v}</div>
            </div>
          ))}
        </div>
        {(dailyLoading || summaryLoading) && (
          <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>{t('common.loading')}</div>
        )}
        {dailyError && <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{dailyError.message}</div>}

        {/* ── Chart + top drivers ── */}
        <div style={{ display: 'grid', gap: 12, flexShrink: 0,
          gridTemplateColumns: '1.7fr 1fr' }}>

          {/* Bar chart */}
          <div style={{ background: TZ.surface, border: `1px solid ${TZ.line}`,
            borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: TZ.sans, fontSize: 14, fontWeight: 700, color: TZ.ink }}>{t('analytics.chartTitle')}</div>
                <div style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.muted, marginTop: 2 }}>{t('analytics.chartSubtitle')}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {[{ c: TZ.navy, l: t('analytics.legendDelivered') }, { c: TZ.orange, l: t('analytics.legendCancelled') }].map(({ c, l }) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6,
                    fontFamily: TZ.sans, fontSize: 11.5, color: TZ.body }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {/* Bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 180 }}>
              {analyticsDays.map((d, i) => {
                const isLast = i === analyticsDays.length - 1
                const total  = d.delivered + d.failed
                const totalH = (total / maxBar) * 170
                const failH  = (d.failed   / maxBar) * 170
                const delH   = (d.delivered / maxBar) * 170
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    {isLast && (
                      <div style={{ fontFamily: TZ.sans, fontSize: 11, fontWeight: 700, color: '#fff',
                        background: TZ.ink, borderRadius: 5, padding: '2px 6px', marginBottom: 2,
                        whiteSpace: 'nowrap' }}>{total}</div>
                    )}
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column',
                      justifyContent: 'flex-end', height: totalH }}>
                      <div style={{ width: '100%', background: TZ.orange,
                        height: failH, borderRadius: '3px 3px 0 0' }} />
                      <div style={{ width: '100%', height: delH,
                        background: isLast ? TZ.navy : TZ.navyMid,
                        borderRadius: failH > 0 ? 0 : '3px 3px 0 0' }} />
                    </div>
                    <span style={{ fontFamily: TZ.mono, fontSize: 10, color: TZ.muted, fontWeight: 600 }}>
                      {d.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top drivers */}
          <div style={{ background: TZ.surface, border: `1px solid ${TZ.line}`,
            borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: TZ.sans, fontSize: 14, fontWeight: 700, color: TZ.ink }}>{t('analytics.topDriversTitle')}</span>
            </div>
            {topDrivers.map((d, i) => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 18, fontFamily: TZ.mono, fontSize: 12, fontWeight: 700,
                  color: TZ.faint, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                <Avatar name={d.name} size={30} color={TZ.navy} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: TZ.sans, fontSize: 12.5, fontWeight: 600, color: TZ.ink,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                  <div style={{ fontFamily: TZ.sans, fontSize: 11, color: TZ.muted, marginTop: 1 }}>
                    {d.orders} {t('common.ordersUnit')}
                  </div>
                </div>
                <div style={{ width: 52, height: 5, borderRadius: 3, background: TZ.surface3, overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${(d.orders / maxOrders) * 100}%`,
                    background: i === 0 ? TZ.orange : TZ.navy }} />
                </div>
              </div>
            ))}
            {topDrivers.length === 0 && (
              <div style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.faint }}>{t('common.noData')}</div>
            )}
          </div>
        </div>

        {/* ── Bottom grid (2x2) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flexShrink: 0 }}>

          {/* City breakdown */}
          <div style={{ background: TZ.surface, border: `1px solid ${TZ.line}`,
            borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontFamily: TZ.sans, fontSize: 14, fontWeight: 700, color: TZ.ink }}>{t('analytics.cityTitle')}</div>
            {cityRows.map((r, i) => {
              const share = Math.round((r.v / cityTotal) * 100)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 96, fontFamily: TZ.sans, fontSize: 12.5, fontWeight: 600,
                    color: TZ.ink, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.n}</div>
                  <div style={{ flex: 1, height: 7, borderRadius: 4, background: TZ.surface3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: TZ.navy,
                      width: `${(r.v / cityMax) * 100}%`, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ width: 32, textAlign: 'right', fontFamily: TZ.mono, fontSize: 12,
                    fontWeight: 700, color: TZ.ink, flexShrink: 0 }}>{r.v}</span>
                  <span style={{ width: 34, textAlign: 'right', fontFamily: TZ.sans, fontSize: 11.5,
                    fontWeight: 700, flexShrink: 0,
                    color: share > 25 ? TZ.green : TZ.amber }}>{share}%</span>
                </div>
              )
            })}
            {cityRows.length === 0 && (
              <div style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.faint }}>{t('common.noData')}</div>
            )}
          </div>

          {/* Cancellation reasons */}
          <div style={{ background: TZ.surface, border: `1px solid ${TZ.line}`,
            borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontFamily: TZ.sans, fontSize: 14, fontWeight: 700, color: TZ.ink }}>{t('analytics.cancelTitle')}</div>
            {cancelRows.map((r, i) => {
              const share = Math.round((r.v / cancelTotal) * 100)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.c, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontFamily: TZ.sans, fontSize: 12.5, color: TZ.body }}>{r.n}</span>
                  <span style={{ fontFamily: TZ.mono, fontSize: 12, fontWeight: 700,
                    color: TZ.ink, width: 22, textAlign: 'right', flexShrink: 0 }}>{r.v}</span>
                  <div style={{ width: 80, height: 5, borderRadius: 3, background: TZ.surface3, overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ height: '100%', borderRadius: 3, background: r.c, width: `${share}%` }} />
                  </div>
                </div>
              )
            })}
            {cancelRawTotal === 0 && (
              <div style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.faint }}>{t('common.noData')}</div>
            )}
          </div>

          {/* Revenue by payment type */}
          <div style={{ background: TZ.surface, border: `1px solid ${TZ.line}`,
            borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontFamily: TZ.sans, fontSize: 14, fontWeight: 700, color: TZ.ink }}>{t('analytics.revenueByTypeTitle')}</div>
            {revenueByType.map((r, i) => {
              const share = Math.round((r.v / revenueByTypeTotal) * 100)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 64, fontFamily: TZ.sans, fontSize: 12.5, fontWeight: 600,
                    color: TZ.ink, flexShrink: 0 }}>{r.n}</div>
                  <div style={{ flex: 1, height: 7, borderRadius: 4, background: TZ.surface3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: TZ.green,
                      width: `${(r.v / revenueByTypeMax) * 100}%`, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ width: 64, textAlign: 'right', fontFamily: TZ.mono, fontSize: 12,
                    fontWeight: 700, color: TZ.ink, flexShrink: 0 }}>{r.v.toFixed(0)}</span>
                  <span style={{ width: 34, textAlign: 'right', fontFamily: TZ.sans, fontSize: 11.5,
                    fontWeight: 700, flexShrink: 0, color: TZ.amber }}>{share}%</span>
                </div>
              )
            })}
            {revenueByType.length === 0 && (
              <div style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.faint }}>{t('common.noData')}</div>
            )}
          </div>

          {/* Peak hours */}
          <div style={{ background: TZ.surface, border: `1px solid ${TZ.line}`,
            borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: TZ.sans, fontSize: 14, fontWeight: 700, color: TZ.ink }}>{t('analytics.peakHoursTitle')}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 90 }}>
              {peakRows.map((r) => {
                const v = Number(r.order_count)
                const h = Math.max(2, (v / peakMax) * 80)
                return (
                  <div key={r.hour} title={`${r.hour}:00 — ${v}`} style={{ flex: 1, display: 'flex',
                    flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: '100%', height: h, borderRadius: '2px 2px 0 0', background: TZ.navyMid }} />
                    {r.hour % 3 === 0 && (
                      <span style={{ fontFamily: TZ.mono, fontSize: 8.5, color: TZ.faint }}>{r.hour}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
