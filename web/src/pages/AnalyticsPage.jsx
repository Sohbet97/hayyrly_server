import { useState } from 'react'
import { Download } from 'lucide-react'
import { AdminShell } from '../components/shell/AdminShell.jsx'
import { Avatar } from '../design/atoms.jsx'
import { TZ } from '../design/tokens.js'
import { useApi } from '../api/useApi.js'
import { dailyReport, summaryReport } from '../api/analytics.js'

const RANGES = [1, 7, 14, 30]
const RANGE_LABELS = ['Şu gün', '7 gün', '14 gün', '30 gün']

export default function AnalyticsPage({ shell }) {
  const [range, setRange] = useState(2)
  const days = RANGES[range]

  const { data: dailyData, loading: dailyLoading, error: dailyError } = useApi(() => dailyReport(days), [days])
  const { data: summaryData, loading: summaryLoading } = useApi(() => summaryReport({}), [])

  const analyticsDays = (dailyData?.data ?? []).map(d => ({
    label: new Date(d.date).getDate().toString(),
    delivered: Number(d.delivered),
    failed: Number(d.failed),
  }))
  const maxBar = Math.max(1, ...analyticsDays.map(d => d.delivered + d.failed))

  const summary = summaryData?.result ?? {}
  const topDrivers = (summary.top_drivers ?? []).map(d => ({
    id: d.id, name: `${d.first_name} ${d.last_name}`, orders: Number(d.order_count),
  }))
  const maxOrders = topDrivers[0]?.orders ?? 1

  const total   = analyticsDays.reduce((a, d) => a + d.delivered + d.failed, 0)
  const success = analyticsDays.reduce((a, d) => a + d.delivered, 0)
  const rate    = total > 0 ? ((success / total) * 100).toFixed(1) : '0.0'

  const KPIS = [
    { l: 'Jemi sargytlar', v: Number(summary.total_orders ?? total), accent: TZ.navy   },
    { l: 'Üstünlik',       v: `${rate}%`,                            accent: TZ.green  },
    { l: 'Girdeji',        v: `${Number(summary.revenue ?? 0).toFixed(0)} T`, accent: TZ.orange },
    { l: 'Işjeň sürüji',   v: Number(summary.active_drivers ?? 0),   accent: '#5B4FC9' },
  ]

  return (
    <AdminShell {...shell}
      active="analytics"
      title="Analitika"
      subtitle={`Soňky ${days} gün`}
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Range tabs */}
          <div style={{ display: 'flex', background: TZ.surface2, border: `1px solid ${TZ.line}`,
            borderRadius: 9, padding: 3, gap: 2 }}>
            {RANGE_LABELS.map((label, i) => {
              const on = i === range
              return (
                <button key={label} onClick={() => setRange(i)} type="button"
                  style={{
                    padding: '5px 11px', borderRadius: 7, border: 0, cursor: 'pointer',
                    fontFamily: TZ.sans, fontSize: 12, fontWeight: on ? 700 : 500,
                    background: on ? TZ.navy : 'transparent',
                    color: on ? '#fff' : TZ.muted,
                    transition: 'all 0.12s',
                  }}>
                  {label}
                </button>
              )
            })}
          </div>
          <button type="button"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
              border: `1px solid ${TZ.line}`, borderRadius: 8, background: TZ.surface,
              fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.body, cursor: 'pointer' }}>
            <Download size={13} /> Eksport
          </button>
        </div>
      }
    >
      <div style={{ height: '100%', overflowY: 'auto', padding: 16, display: 'flex',
        flexDirection: 'column', gap: 12 }}>

        {/* ── KPI row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, flexShrink: 0 }}>
          {KPIS.map((k, i) => (
            <div key={i} style={{ background: TZ.surface, border: `1px solid ${TZ.line}`,
              borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: k.accent }} />
                <span style={{ fontFamily: TZ.sans, fontSize: 11, fontWeight: 700, color: TZ.muted,
                  textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.l}</span>
              </div>
              <div style={{ fontFamily: TZ.sans, fontSize: 32, fontWeight: 800, color: k.accent,
                lineHeight: 1 }}>{k.v}</div>
            </div>
          ))}
        </div>
        {(dailyLoading || summaryLoading) && (
          <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>Ýüklenýär…</div>
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
                <div style={{ fontFamily: TZ.sans, fontSize: 14, fontWeight: 700, color: TZ.ink }}>Günleýin sargytlar</div>
                <div style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.muted, marginTop: 2 }}>Tamamlandy vs Ýatyryldy</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {[{ c: TZ.navy, l: 'Tamamlandy' }, { c: TZ.orange, l: 'Ýatyryldy' }].map(({ c, l }) => (
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
              <span style={{ fontFamily: TZ.sans, fontSize: 14, fontWeight: 700, color: TZ.ink }}>Iň gowy sürüjiler</span>
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
                    {d.orders} sargyt
                  </div>
                </div>
                <div style={{ width: 52, height: 5, borderRadius: 3, background: TZ.surface3, overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${(d.orders / maxOrders) * 100}%`,
                    background: i === 0 ? TZ.orange : TZ.navy }} />
                </div>
              </div>
            ))}
            {topDrivers.length === 0 && (
              <div style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.faint }}>Maglumat ýok</div>
            )}
          </div>
        </div>

        {/* ── Bottom row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flexShrink: 0 }}>

          {/* City breakdown */}
          <div style={{ background: TZ.surface, border: `1px solid ${TZ.line}`,
            borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontFamily: TZ.sans, fontSize: 14, fontWeight: 700, color: TZ.ink }}>Şäher boýunça sargytlar</div>
            {[
              { n: 'Aşgabat',     v: 242, p: 94, max: 250 },
              { n: 'Türkmenabat', v: 198, p: 96, max: 250 },
              { n: 'Mary',        v: 124, p: 91, max: 250 },
              { n: 'Balkanabat',  v: 72,  p: 89, max: 250 },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 96, fontFamily: TZ.sans, fontSize: 12.5, fontWeight: 600,
                  color: TZ.ink, flexShrink: 0 }}>{r.n}</div>
                <div style={{ flex: 1, height: 7, borderRadius: 4, background: TZ.surface3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, background: TZ.navy,
                    width: `${(r.v / r.max) * 100}%`, transition: 'width 0.4s' }} />
                </div>
                <span style={{ width: 32, textAlign: 'right', fontFamily: TZ.mono, fontSize: 12,
                  fontWeight: 700, color: TZ.ink, flexShrink: 0 }}>{r.v}</span>
                <span style={{ width: 34, textAlign: 'right', fontFamily: TZ.sans, fontSize: 11.5,
                  fontWeight: 700, flexShrink: 0,
                  color: r.p > 92 ? TZ.green : TZ.amber }}>{r.p}%</span>
              </div>
            ))}
          </div>

          {/* Cancellation reasons */}
          <div style={{ background: TZ.surface, border: `1px solid ${TZ.line}`,
            borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontFamily: TZ.sans, fontSize: 14, fontWeight: 700, color: TZ.ink }}>Ýatyrylma sebäpleri</div>
            {[
              { n: 'Müşderi ýok',   v: 18, p: 38, c: TZ.red    },
              { n: 'Nädogry salgy', v: 12, p: 25, c: TZ.orange },
              { n: 'Uzak garaşma', v: 9,  p: 19, c: TZ.amber  },
              { n: 'Beýleki',       v: 9,  p: 18, c: TZ.faint  },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.c, flexShrink: 0 }} />
                <span style={{ flex: 1, fontFamily: TZ.sans, fontSize: 12.5, color: TZ.body }}>{r.n}</span>
                <span style={{ fontFamily: TZ.mono, fontSize: 12, fontWeight: 700,
                  color: TZ.ink, width: 22, textAlign: 'right', flexShrink: 0 }}>{r.v}</span>
                <div style={{ width: 80, height: 5, borderRadius: 3, background: TZ.surface3, overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ height: '100%', borderRadius: 3, background: r.c, width: `${r.p * 2.5}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
