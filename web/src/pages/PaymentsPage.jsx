import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, X, Undo2 } from 'lucide-react'
import { usePageHeader } from '../components/shell/AdminShell.jsx'
import { StatusPill } from '../design/atoms.jsx'
import { useTZ } from '../design/tokens.js'
import { useApi } from '../api/useApi.js'
import { listPayments, getPaymentsSummary, refundPayment, listWalletTransactions } from '../api/payments.js'
import { useT } from '../i18n/useT.js'

const PER = 20

export default function PaymentsPage({ shell }) {
  const TZ = useTZ()
  const t = useT()
  const [tab, setTab] = useState('orders')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [pg, setPg] = useState(1)
  const [walletPg, setWalletPg] = useState(1)
  const [refundFor, setRefundFor] = useState(null)
  const [refundNote, setRefundNote] = useState('')

  const { data: summaryData, reload: reloadSummary } = useApi(() => getPaymentsSummary({}), [])
  const summary = summaryData?.result ?? {}

  const { data: paymentsData, loading: paymentsLoading, error: paymentsError, reload: reloadPayments } =
    useApi(() => listPayments({
      status: statusFilter === 'all' ? undefined : statusFilter,
      paymentType: typeFilter === 'all' ? undefined : typeFilter,
      search, limit: PER, page: pg,
    }), [statusFilter, typeFilter, search, pg])
  const payments = paymentsData?.data ?? []
  const paymentsTotal = paymentsData?.total ?? 0
  const paymentsPages = Math.max(1, Math.ceil(paymentsTotal / PER))

  const { data: walletData, loading: walletLoading, error: walletError } =
    useApi(() => listWalletTransactions({ limit: PER, page: walletPg }), [walletPg])
  const walletRows = walletData?.data ?? []
  const walletTotal = walletData?.total ?? 0
  const walletPages = Math.max(1, Math.ceil(walletTotal / PER))

  function goStatus(v) { setStatusFilter(v); setPg(1) }
  function goType(v) { setTypeFilter(v); setPg(1) }
  function goSearch(v) { setSearch(v); setPg(1) }

  async function submitRefund(e) {
    e.preventDefault()
    try {
      await refundPayment(refundFor.id, { note: refundNote })
      setRefundFor(null)
      setRefundNote('')
      reloadPayments()
      reloadSummary()
    } catch (err) {
      alert(err.message || t('payments.refundError'))
    }
  }

  const KPIS = [
    { l: t('payments.summaryRevenue'),  v: Number(summary.total_revenue ?? 0).toFixed(0),  accent: TZ.green },
    { l: t('payments.summaryCash'),     v: Number(summary.cash_revenue ?? 0).toFixed(0),    accent: TZ.navy },
    { l: t('payments.summaryCard'),     v: Number(summary.card_revenue ?? 0).toFixed(0),    accent: TZ.violet },
    { l: t('payments.summaryRefunded'), v: Number(summary.total_refunded ?? 0).toFixed(0),  accent: TZ.red },
  ]

  const STATUS_TABS = [
    { id: 'all',      label: t('payments.filterAll'),      n: Number(summary.paid_count ?? 0) + Number(summary.refunded_count ?? 0) },
    { id: 'paid',     label: t('payments.filterPaid'),     n: Number(summary.paid_count ?? 0) },
    { id: 'refunded', label: t('payments.filterRefunded'), n: Number(summary.refunded_count ?? 0) },
  ]
  const TYPE_TABS = [
    { id: 'all',     label: t('payments.typeAll') },
    { id: 'cash',    label: t('payments.typeCash') },
    { id: 'card',    label: t('payments.typeCard') },
    { id: 'balance', label: t('payments.typeBalance') },
  ]

  usePageHeader({ title: t('payments.title'), subtitle: t('payments.subtitle') })

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
        padding: '14px 16px', gap: 12, overflow: 'hidden' }}>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', background: TZ.surface2, border: `1px solid ${TZ.line}`,
          borderRadius: 9, padding: 3, gap: 2, flexShrink: 0, width: 'fit-content' }}>
          {[
            { id: 'orders', label: t('payments.tabOrderPayments') },
            { id: 'wallet', label: t('payments.tabWalletTransactions') },
          ].map(tb => {
            const on = tb.id === tab
            return (
              <button key={tb.id} onClick={() => setTab(tb.id)} type="button"
                style={{
                  padding: '6px 14px', borderRadius: 7, cursor: 'pointer',
                  fontFamily: TZ.sans, fontSize: 13, fontWeight: on ? 700 : 500,
                  border: 0, background: on ? TZ.surface : 'transparent',
                  color: on ? TZ.ink : TZ.muted,
                  boxShadow: on ? '0 1px 3px rgba(0,0,0,0.07)' : 'none',
                }}>
                {tb.label}
              </button>
            )
          })}
        </div>

        {tab === 'orders' && (
          <>
            {/* ── KPI row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, flexShrink: 0 }}>
              {KPIS.map((k, i) => (
                <div key={i} style={{ background: TZ.surface, border: `1px solid ${TZ.line}`,
                  borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: k.accent }} />
                    <span style={{ fontFamily: TZ.sans, fontSize: 11, fontWeight: 700, color: TZ.muted,
                      textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.l}</span>
                  </div>
                  <div style={{ fontFamily: TZ.sans, fontSize: 26, fontWeight: 800, color: k.accent, lineHeight: 1 }}>
                    {k.v} TMT
                  </div>
                </div>
              ))}
            </div>

            {/* ── Filter bar ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {STATUS_TABS.map(s => {
                  const on = s.id === statusFilter
                  return (
                    <button key={s.id} onClick={() => goStatus(s.id)} type="button"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 13px', borderRadius: 8, cursor: 'pointer',
                        fontFamily: TZ.sans, fontSize: 13, fontWeight: on ? 700 : 500,
                        border: on ? `1px solid ${TZ.line}` : '1px solid transparent',
                        background: on ? TZ.surface : 'transparent',
                        color: on ? TZ.ink : TZ.muted,
                        boxShadow: on ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                      }}>
                      {s.label}
                      <span style={{ fontFamily: TZ.mono, fontSize: 11, color: on ? TZ.muted : TZ.faint }}>{s.n}</span>
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', background: TZ.surface2, border: `1px solid ${TZ.line}`,
                borderRadius: 9, padding: 3, gap: 2 }}>
                {TYPE_TABS.map(tp => {
                  const on = tp.id === typeFilter
                  return (
                    <button key={tp.id} type="button" onClick={() => goType(tp.id)}
                      style={{ padding: '6px 10px', borderRadius: 7, cursor: 'pointer',
                        fontFamily: TZ.sans, fontSize: 12, fontWeight: on ? 700 : 500,
                        border: 0, background: on ? TZ.surface : 'transparent',
                        color: on ? TZ.ink : TZ.muted,
                        boxShadow: on ? '0 1px 3px rgba(0,0,0,0.07)' : 'none' }}>
                      {tp.label}
                    </button>
                  )
                })}
              </div>

              <div style={{ flex: 1 }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
                borderRadius: 8, background: TZ.surface, border: `1px solid ${TZ.line}`, width: 220 }}>
                <Search size={14} color={TZ.muted} style={{ flexShrink: 0 }} />
                <input value={search} onChange={e => goSearch(e.target.value)} placeholder={t('payments.searchPlaceholder')}
                  style={{ flex: 1, border: 0, outline: 'none', background: 'transparent',
                    fontFamily: TZ.sans, fontSize: 13, color: TZ.ink, minWidth: 0 }} />
              </div>
            </div>

            {/* ── Table ── */}
            <div style={{ flex: 1, background: TZ.surface, border: `1px solid ${TZ.line}`, borderRadius: 12,
              overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

              {paymentsLoading && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>{t('common.loading')}</div>}
              {paymentsError && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{paymentsError.message}</div>}

              {!paymentsLoading && !paymentsError && (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: TZ.surface2, borderBottom: `1px solid ${TZ.line}` }}>
                        {[t('payments.colOrder'), t('payments.colClient'), t('payments.colDriver'), t('payments.colAmount'),
                          t('payments.colType'), t('payments.colStatus'), t('payments.colDate'), ''].map((h, i) => (
                          <th key={i} style={{
                            padding: '10px 16px', textAlign: 'left',
                            fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700,
                            color: TZ.muted, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => {
                        const driverName = p.driver_id ? `${p.driver_first_name ?? ''} ${p.driver_last_name ?? ''}`.trim() : null
                        return (
                          <tr key={p.id} style={{ borderBottom: `1px solid ${TZ.lineSoft}` }}>
                            <td style={{ padding: '13px 16px', fontFamily: TZ.mono, fontSize: 12.5, fontWeight: 700, color: TZ.ink }}>
                              #{p.order_id}
                            </td>
                            <td style={{ padding: '13px 16px', fontFamily: TZ.sans, fontSize: 13, fontWeight: 600, color: TZ.ink }}>
                              {p.client_name ?? '—'}
                            </td>
                            <td style={{ padding: '13px 16px', fontFamily: TZ.sans, fontSize: 13, color: TZ.body }}>
                              {driverName ?? '—'}
                            </td>
                            <td style={{ padding: '13px 16px', fontFamily: TZ.sans, fontSize: 13, fontWeight: 700, color: TZ.ink }}>
                              {Number(p.amount).toFixed(2)} TMT
                            </td>
                            <td style={{ padding: '13px 16px', fontFamily: TZ.sans, fontSize: 12, color: TZ.muted }}>
                              {t(`payments.type${p.payment_type.charAt(0).toUpperCase()}${p.payment_type.slice(1)}`)}
                            </td>
                            <td style={{ padding: '13px 16px' }}><StatusPill status={p.status} /></td>
                            <td style={{ padding: '13px 16px', fontFamily: TZ.mono, fontSize: 12, color: TZ.muted }}>
                              {new Date(p.created_at).toLocaleString()}
                            </td>
                            <td style={{ padding: '13px 16px' }}>
                              {p.status === 'paid' && (
                                <button type="button" onClick={() => setRefundFor(p)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                                    borderRadius: 7, border: `1px solid ${TZ.line}`, background: TZ.surface,
                                    color: TZ.red, cursor: 'pointer', fontFamily: TZ.sans, fontSize: 11.5, fontWeight: 700 }}>
                                  <Undo2 size={12} /> {t('payments.refund')}
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                      {payments.length === 0 && (
                        <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', fontFamily: TZ.sans,
                          fontSize: 12, color: TZ.faint }}>{t('payments.noPayments')}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ padding: '10px 16px', borderTop: `1px solid ${TZ.lineSoft}`, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.muted }}>
                  {paymentsTotal === 0 ? 0 : (pg - 1) * PER + 1}–{Math.min(pg * PER, paymentsTotal)} / {paymentsTotal} {t('payments.rowsUnit')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <PageBtn onClick={() => setPg(p => Math.max(1, p - 1))} disabled={pg === 1}>
                    <ChevronLeft size={14} />
                  </PageBtn>
                  {Array.from({ length: paymentsPages }, (_, i) => i + 1).map(p => (
                    <PageBtn key={p} active={p === pg} onClick={() => setPg(p)}>{p}</PageBtn>
                  ))}
                  <PageBtn onClick={() => setPg(p => Math.min(paymentsPages, p + 1))} disabled={pg === paymentsPages}>
                    <ChevronRight size={14} />
                  </PageBtn>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'wallet' && (
          <div style={{ flex: 1, background: TZ.surface, border: `1px solid ${TZ.line}`, borderRadius: 12,
            overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

            {walletLoading && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>{t('common.loading')}</div>}
            {walletError && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{walletError.message}</div>}

            {!walletLoading && !walletError && (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: TZ.surface2, borderBottom: `1px solid ${TZ.line}` }}>
                      {[t('payments.colDate'), t('payments.colSender'), t('payments.colNote'),
                        t('payments.colAmount'), t('payments.colDirection')].map((h, i) => (
                        <th key={i} style={{
                          padding: '10px 16px', textAlign: 'left',
                          fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700,
                          color: TZ.muted, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {walletRows.map(w => (
                      <tr key={w.id} style={{ borderBottom: `1px solid ${TZ.lineSoft}` }}>
                        <td style={{ padding: '13px 16px', fontFamily: TZ.mono, fontSize: 12, color: TZ.muted }}>
                          {new Date(w.created_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '13px 16px', fontFamily: TZ.sans, fontSize: 13, fontWeight: 600, color: TZ.ink }}>
                          {w.sended_name ?? '—'}
                        </td>
                        <td style={{ padding: '13px 16px', fontFamily: TZ.sans, fontSize: 13, color: TZ.body }}>
                          {w.confirmed_name ?? '—'}
                        </td>
                        <td style={{ padding: '13px 16px', fontFamily: TZ.sans, fontSize: 13, fontWeight: 700, color: TZ.ink }}>
                          {Number(w.price).toFixed(2)} TMT
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ fontFamily: TZ.sans, fontSize: 11.5, fontWeight: 700,
                            color: w.is_added ? TZ.green : TZ.red }}>
                            {w.is_added ? t('payments.directionAdd') : t('payments.directionRemove')}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {walletRows.length === 0 && (
                      <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', fontFamily: TZ.sans,
                        fontSize: 12, color: TZ.faint }}>{t('payments.noTransactions')}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ padding: '10px 16px', borderTop: `1px solid ${TZ.lineSoft}`, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.muted }}>
                {walletTotal === 0 ? 0 : (walletPg - 1) * PER + 1}–{Math.min(walletPg * PER, walletTotal)} / {walletTotal} {t('payments.rowsUnit')}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <PageBtn onClick={() => setWalletPg(p => Math.max(1, p - 1))} disabled={walletPg === 1}>
                  <ChevronLeft size={14} />
                </PageBtn>
                {Array.from({ length: walletPages }, (_, i) => i + 1).map(p => (
                  <PageBtn key={p} active={p === walletPg} onClick={() => setWalletPg(p)}>{p}</PageBtn>
                ))}
                <PageBtn onClick={() => setWalletPg(p => Math.min(walletPages, p + 1))} disabled={walletPg === walletPages}>
                  <ChevronRight size={14} />
                </PageBtn>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Refund modal ── */}
      {refundFor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <form onSubmit={submitRefund} style={{ background: '#fff', borderRadius: 16, padding: 24,
            width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <h3 style={{ fontFamily: TZ.sans, fontSize: 16, fontWeight: 800, color: TZ.ink, margin: 0 }}>
                {t('payments.refundTitle')} — #{refundFor.order_id}
              </h3>
              <button onClick={() => setRefundFor(null)} type="button"
                style={{ background: 'none', border: 0, cursor: 'pointer', color: TZ.faint, padding: 2 }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontFamily: TZ.sans, fontSize: 12.5, color: TZ.muted, margin: '0 0 16px' }}>
              {t('payments.refundHint')} <strong style={{ color: TZ.ink }}>{Number(refundFor.amount).toFixed(2)} TMT</strong>
            </p>
            <input placeholder={t('payments.refundNotePlaceholder')} value={refundNote}
              onChange={e => setRefundNote(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${TZ.line}`,
                fontFamily: TZ.sans, fontSize: 13, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setRefundFor(null)} type="button"
                style={{ padding: '9px 18px', borderRadius: 9, border: `1px solid ${TZ.line}`,
                  background: TZ.surface, fontFamily: TZ.sans, fontSize: 13, fontWeight: 600,
                  color: TZ.body, cursor: 'pointer' }}>{t('common.close')}</button>
              <button type="submit"
                style={{ padding: '9px 18px', borderRadius: 9, border: 0,
                  background: TZ.red, color: '#fff', fontFamily: TZ.sans,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{t('payments.refundConfirm')}</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

function PageBtn({ children, onClick, active, disabled }) {
  const TZ = useTZ()
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={{
        minWidth: 28, height: 28, padding: '0 6px', borderRadius: 6, cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: TZ.sans, fontSize: 12, fontWeight: active ? 700 : 500,
        border: active ? 0 : `1px solid ${TZ.line}`,
        background: active ? TZ.navy : TZ.surface,
        color: active ? '#fff' : disabled ? TZ.faint : TZ.body,
        transition: 'all 0.1s',
      }}>
      {children}
    </button>
  )
}
