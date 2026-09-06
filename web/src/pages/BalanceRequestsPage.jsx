import { useState } from 'react'
import { Check, X, ChevronLeft, ChevronRight, Send } from 'lucide-react'
import { usePageHeader } from '../components/shell/AdminShell.jsx'
import { StatusPill } from '../design/atoms.jsx'
import { useTZ } from '../design/tokens.js'
import { useApi } from '../api/useApi.js'
import { listBalanceRequests, getBalanceRequest, confirmBalanceRequest, rejectBalanceRequest, sendBalanceRequestMessage } from '../api/balanceRequests.js'
import { useT } from '../i18n/useT.js'

const PER_PAGE = 20

export default function BalanceRequestsPage({ shell }) {
  const TZ = useTZ()
  const t = useT()
  const [status, setStatus] = useState('pending') // pending | confirmed | rejected
  const [pg, setPg] = useState(1)
  const [openId, setOpenId] = useState(null)

  const { data, loading, error, reload } =
    useApi(() => listBalanceRequests({ status, limit: 300 }), [status])
  const { data: pendingData, reload: reloadPending } =
    useApi(() => listBalanceRequests({ status: 'pending', limit: 1 }), [])

  const rows = data?.data ?? []
  const pendingTotal = pendingData?.total ?? 0

  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE))
  const paged = rows.slice((pg - 1) * PER_PAGE, pg * PER_PAGE)

  function goStatus(v) { setStatus(v); setPg(1) }

  function reloadAll() { reload(); reloadPending() }

  usePageHeader({
    title: t('balanceRequests.title'),
    subtitle: `${pendingTotal} ${t('balanceRequests.subtitlePending')}`,
  })

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
        padding: '14px 16px', gap: 12, overflow: 'hidden' }}>

        <div style={{ display: 'flex', background: TZ.surface2, border: `1px solid ${TZ.line}`,
          borderRadius: 9, padding: 3, gap: 2, flexShrink: 0, width: 'fit-content' }}>
          {[
            { id: 'pending',   label: t('balanceRequests.tabPending') },
            { id: 'confirmed', label: t('balanceRequests.tabConfirmed') },
            { id: 'rejected',  label: t('balanceRequests.tabRejected') },
          ].map(f => {
            const on = f.id === status
            return (
              <button key={f.id} type="button" onClick={() => goStatus(f.id)}
                style={{ padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
                  fontFamily: TZ.sans, fontSize: 13, fontWeight: on ? 700 : 500,
                  border: 0, background: on ? TZ.surface : 'transparent',
                  color: on ? TZ.ink : TZ.muted,
                  boxShadow: on ? '0 1px 3px rgba(0,0,0,0.07)' : 'none' }}>
                {f.label}
              </button>
            )
          })}
        </div>

        <div style={{ flex: 1, minHeight: 0, background: TZ.surface, border: `1px solid ${TZ.line}`,
          borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loading && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>{t('common.loading')}</div>}
          {error && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{error.message}</div>}
          {!loading && !error && (
            <>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: TZ.surface2, borderBottom: `1px solid ${TZ.line}` }}>
                      {[t('balanceRequests.colUser'), t('balanceRequests.colPhone'), t('balanceRequests.colAmount'),
                        t('balanceRequests.colStatus'), t('balanceRequests.colSubmitted'), ''].map((h, i) => (
                        <th key={i} style={{ padding: '10px 16px', textAlign: 'left',
                          fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700, color: TZ.muted,
                          textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map(r => (
                      <tr key={r.id} style={{ borderBottom: `1px solid ${TZ.lineSoft}` }}>
                        <td style={{ padding: '13px 16px', fontFamily: TZ.sans, fontSize: 13,
                          fontWeight: 600, color: TZ.ink }}>{r.user?.full_name || `#${r.user_id}`}</td>
                        <td style={{ padding: '13px 16px', fontFamily: TZ.mono, fontSize: 11.5,
                          color: TZ.muted }}>{r.user?.phone ?? '—'}</td>
                        <td style={{ padding: '13px 16px', fontFamily: TZ.mono, fontSize: 13,
                          fontWeight: 700, color: TZ.ink }}>{r.amount != null ? `${Number(r.amount).toFixed(2)} TMT` : '—'}</td>
                        <td style={{ padding: '13px 16px' }}><StatusPill status={r.status} size="sm" /></td>
                        <td style={{ padding: '13px 16px', fontFamily: TZ.mono, fontSize: 11.5, color: TZ.muted }}>
                          {new Date(r.created_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <ActionBtn onClick={() => setOpenId(r.id)} color={TZ.navy} bg={TZ.navySoft}>
                            {t('balanceRequests.view')}
                          </ActionBtn>
                        </td>
                      </tr>
                    ))}
                    {paged.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', fontFamily: TZ.sans,
                        fontSize: 12, color: TZ.faint }}>{t('balanceRequests.empty')}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ padding: '10px 16px', borderTop: `1px solid ${TZ.lineSoft}`, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.muted }}>
                  {rows.length === 0 ? 0 : (pg - 1) * PER_PAGE + 1}–{Math.min(pg * PER_PAGE, rows.length)} / {rows.length} {t('balanceRequests.unit')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <PageBtn onClick={() => setPg(p => Math.max(1, p - 1))} disabled={pg === 1}>
                    <ChevronLeft size={14} />
                  </PageBtn>
                  {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                    <PageBtn key={p} active={p === pg} onClick={() => setPg(p)}>{p}</PageBtn>
                  ))}
                  <PageBtn onClick={() => setPg(p => Math.min(pages, p + 1))} disabled={pg === pages}>
                    <ChevronRight size={14} />
                  </PageBtn>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {openId != null && (
        <DetailModal id={openId} onClose={() => setOpenId(null)} onChanged={reloadAll} />
      )}
    </>
  )
}

function DetailModal({ id, onClose, onChanged }) {
  const TZ = useTZ()
  const t = useT()
  const { data: request, loading, error, reload } = useApi(() => getBalanceRequest(id), [id])
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [busy, setBusy] = useState(false)

  const r = request?.result ?? request

  async function confirm() {
    setBusy(true)
    try { await confirmBalanceRequest(id); onChanged(); onClose() }
    catch (err) { alert(err.message || t('balanceRequests.confirmError')) }
    finally { setBusy(false) }
  }

  async function reject() {
    if (!reason.trim()) return
    setBusy(true)
    try { await rejectBalanceRequest(id, reason); onChanged(); onClose() }
    catch (err) { alert(err.message || t('balanceRequests.rejectError')) }
    finally { setBusy(false) }
  }

  async function send() {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    try { await sendBalanceRequestMessage(id, { message: body }); setText(''); reload() }
    catch (err) { alert(err.message || t('chat.sendError')) }
    finally { setSending(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: TZ.surface, borderRadius: 16, padding: 0, width: '100%', maxWidth: 460,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px', borderBottom: `1px solid ${TZ.lineSoft}`, flexShrink: 0 }}>
          <div>
            <h3 style={{ fontFamily: TZ.sans, fontSize: 16, fontWeight: 800, color: TZ.ink, margin: 0 }}>
              {t('balanceRequests.detailTitle')} #{id}
            </h3>
            {r && (
              <p style={{ fontFamily: TZ.sans, fontSize: 12.5, color: TZ.muted, margin: '3px 0 0' }}>
                {r.user?.full_name || `#${r.user_id}`} · {r.amount != null ? `${Number(r.amount).toFixed(2)} TMT` : '—'}
              </p>
            )}
          </div>
          <button onClick={onClose} type="button"
            style={{ background: 'none', border: 0, cursor: 'pointer', color: TZ.faint, padding: 2 }}>
            <X size={18} />
          </button>
        </div>

        {loading && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>{t('common.loading')}</div>}
        {error && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{error.message}</div>}

        {r && (
          <>
            <div style={{ flex: 1, minHeight: 120, overflowY: 'auto', padding: '14px 20px',
              display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(r.messages ?? []).length === 0 && (
                <div style={{ textAlign: 'center', fontFamily: TZ.sans, fontSize: 12, color: TZ.faint, padding: '16px 0' }}>
                  {t('chat.empty')}
                </div>
              )}
              {(r.messages ?? []).map(m => {
                const mine = m.sender_type === 'admin'
                return (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column',
                    alignItems: mine ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '80%', padding: '7px 11px', borderRadius: 12,
                      background: mine ? TZ.navy : TZ.surface2,
                      color: mine ? '#fff' : TZ.ink,
                      fontFamily: TZ.sans, fontSize: 13, lineHeight: 1.4,
                      border: mine ? 'none' : `1px solid ${TZ.line}`,
                    }}>
                      {m.message}
                      {m.photo_url && (
                        <img src={m.photo_url} alt="" style={{ display: 'block', marginTop: m.message ? 6 : 0,
                          maxWidth: '100%', borderRadius: 8 }} />
                      )}
                    </div>
                    <div style={{ fontFamily: TZ.sans, fontSize: 10.5, color: TZ.faint, marginTop: 2 }}>
                      {new Date(m.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, padding: '10px 20px', borderTop: `1px solid ${TZ.lineSoft}`, flexShrink: 0 }}>
              <input value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder={t('chat.placeholder')}
                style={{ flex: 1, border: `1px solid ${TZ.line}`, borderRadius: 8, padding: '8px 12px',
                  outline: 'none', background: TZ.surface, fontFamily: TZ.sans, fontSize: 13, color: TZ.ink }} />
              <button type="button" onClick={send} disabled={sending || !text.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: 0,
                  borderRadius: 8, background: TZ.navy, color: '#fff', cursor: sending ? 'default' : 'pointer',
                  opacity: sending || !text.trim() ? 0.6 : 1,
                  fontFamily: TZ.sans, fontSize: 12.5, fontWeight: 600 }}>
                <Send size={13} /> {t('chat.send')}
              </button>
            </div>

            {r.status === 'pending' && (
              <div style={{ padding: '14px 20px', borderTop: `1px solid ${TZ.lineSoft}`, flexShrink: 0 }}>
                {!rejecting ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={confirm} disabled={busy}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '9px 0', borderRadius: 9, border: 0, background: TZ.green, color: '#fff',
                        fontFamily: TZ.sans, fontSize: 13, fontWeight: 700, cursor: busy ? 'default' : 'pointer' }}>
                      <Check size={14} /> {t('balanceRequests.confirm')}
                    </button>
                    <button type="button" onClick={() => setRejecting(true)} disabled={busy}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '9px 0', borderRadius: 9, border: 0, background: TZ.red, color: '#fff',
                        fontFamily: TZ.sans, fontSize: 13, fontWeight: 700, cursor: busy ? 'default' : 'pointer' }}>
                      <X size={14} /> {t('balanceRequests.reject')}
                    </button>
                  </div>
                ) : (
                  <>
                    <textarea required value={reason} onChange={e => setReason(e.target.value)}
                      placeholder={t('balanceRequests.rejectPlaceholder')}
                      style={{ width: '100%', minHeight: 64, padding: 10, borderRadius: 10,
                        border: `1.5px solid ${TZ.line}`, fontFamily: TZ.sans, fontSize: 13,
                        color: TZ.ink, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                      <button type="button" onClick={() => { setRejecting(false); setReason('') }}
                        style={{ padding: '8px 16px', borderRadius: 9, border: `1px solid ${TZ.line}`,
                          background: TZ.surface, fontFamily: TZ.sans, fontSize: 13, fontWeight: 600,
                          color: TZ.body, cursor: 'pointer' }}>
                        {t('common.close')}
                      </button>
                      <button type="button" onClick={reject} disabled={!reason.trim() || busy}
                        style={{ padding: '8px 16px', borderRadius: 9, border: 0,
                          background: TZ.red, color: '#fff', fontFamily: TZ.sans,
                          fontSize: 13, fontWeight: 700, cursor: reason.trim() ? 'pointer' : 'not-allowed',
                          opacity: reason.trim() ? 1 : 0.5 }}>
                        {t('balanceRequests.reject')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {r.status === 'rejected' && r.reject_reason && (
              <div style={{ padding: '10px 20px 16px', flexShrink: 0, fontFamily: TZ.sans, fontSize: 12.5, color: TZ.muted }}>
                {t('balanceRequests.rejectReasonPrefix')}: {r.reject_reason}
              </div>
            )}
          </>
        )}
      </div>
    </div>
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
