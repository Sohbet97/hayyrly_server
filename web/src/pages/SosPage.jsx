import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, X, ChevronLeft, ChevronRight, ExternalLink, ShieldAlert } from 'lucide-react'
import { usePageHeader } from '../components/shell/AdminShell.jsx'
import { StatusPill } from '../design/atoms.jsx'
import { useTZ } from '../design/tokens.js'
import { useApi } from '../api/useApi.js'
import { listSosAlerts, updateSosAlertStatus } from '../api/sos.js'
import { getSocket } from '../api/socket.js'
import { useT } from '../i18n/useT.js'

const PER_PAGE = 20

export default function SosPage({ shell }) {
  const TZ = useTZ()
  const t = useT()
  const [status, setStatus] = useState('open') // open | acknowledged | resolved
  const [pg, setPg] = useState(1)
  const [openId, setOpenId] = useState(null)

  const { data, loading, error, reload } =
    useApi(() => listSosAlerts({ status, limit: 300 }), [status])
  const { data: openData, reload: reloadOpen } =
    useApi(() => listSosAlerts({ status: 'open', limit: 1 }), [])

  const rows = data?.data ?? []
  const openTotal = openData?.total ?? 0

  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE))
  const paged = rows.slice((pg - 1) * PER_PAGE, pg * PER_PAGE)

  function goStatus(v) { setStatus(v); setPg(1) }

  function reloadAll() { reload(); reloadOpen() }

  useEffect(() => {
    const socket = getSocket()
    const onSosAlert = () => reloadAll()
    socket.on('sos:alert', onSosAlert)
    return () => socket.off('sos:alert', onSosAlert)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  usePageHeader({ title: t('sos.title'), subtitle: `${openTotal} ${t('sos.subtitleOpen')}` })

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
        padding: '14px 16px', gap: 12, overflow: 'hidden' }}>

        <div style={{ display: 'flex', background: TZ.surface2, border: `1px solid ${TZ.line}`,
          borderRadius: 9, padding: 3, gap: 2, flexShrink: 0, width: 'fit-content' }}>
          {[
            { id: 'open',         label: t('sos.tabOpen') },
            { id: 'acknowledged', label: t('sos.tabAcknowledged') },
            { id: 'resolved',     label: t('sos.tabResolved') },
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
                      {[t('sos.colPhone'), t('sos.colNote'), t('sos.colWho'), t('sos.colLocation'),
                        t('sos.colStatus'), t('sos.colReceived'), ''].map((h, i) => (
                        <th key={i} style={{ padding: '10px 16px', textAlign: 'left',
                          fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700, color: TZ.muted,
                          textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map(r => (
                      <tr key={r.id} style={{ borderBottom: `1px solid ${TZ.lineSoft}` }}>
                        <td style={{ padding: '13px 16px', fontFamily: TZ.mono, fontSize: 12.5,
                          fontWeight: 700, color: TZ.ink, whiteSpace: 'nowrap' }}>{r.phone}</td>
                        <td style={{ padding: '13px 16px', fontFamily: TZ.sans, fontSize: 13,
                          color: TZ.body, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap' }}>{r.note || '—'}</td>
                        <td style={{ padding: '13px 16px', fontFamily: TZ.sans, fontSize: 12.5, color: TZ.muted }}>
                          {r.user_id ? `${t('sos.user')} #${r.user_id}` : r.taxi_id ? `${t('sos.taxi')} #${r.taxi_id}` : '—'}
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <Link to={`/map?lat=${r.lat}&lng=${r.lng}`} onClick={e => e.stopPropagation()}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontFamily: TZ.sans, fontSize: 12, color: TZ.navy, textDecoration: 'none' }}>
                            <MapPin size={13} /> {Number(r.lat).toFixed(4)}, {Number(r.lng).toFixed(4)}
                          </Link>
                        </td>
                        <td style={{ padding: '13px 16px' }}><StatusPill status={r.status} size="sm" /></td>
                        <td style={{ padding: '13px 16px', fontFamily: TZ.mono, fontSize: 11.5, color: TZ.muted }}>
                          {new Date(r.created_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <ActionBtn onClick={() => setOpenId(r.id)} color={TZ.navy} bg={TZ.navySoft}>
                            {t('sos.view')}
                          </ActionBtn>
                        </td>
                      </tr>
                    ))}
                    {paged.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', fontFamily: TZ.sans,
                        fontSize: 12, color: TZ.faint }}>{t('sos.empty')}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ padding: '10px 16px', borderTop: `1px solid ${TZ.lineSoft}`, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.muted }}>
                  {rows.length === 0 ? 0 : (pg - 1) * PER_PAGE + 1}–{Math.min(pg * PER_PAGE, rows.length)} / {rows.length} {t('sos.unit')}
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
        <DetailModal id={openId} row={rows.find(r => r.id === openId)} onClose={() => setOpenId(null)} onChanged={reloadAll} />
      )}
    </>
  )
}

function DetailModal({ id, row, onClose, onChanged }) {
  const TZ = useTZ()
  const t = useT()
  const [busy, setBusy] = useState(false)

  async function setStatus(status) {
    setBusy(true)
    try { await updateSosAlertStatus(id, status); onChanged(); onClose() }
    catch (err) { alert(err.message || t('sos.statusError')) }
    finally { setBusy(false) }
  }

  if (!row) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: TZ.surface, borderRadius: 16, padding: 0, width: '100%', maxWidth: 440,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px', borderBottom: `1px solid ${TZ.lineSoft}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'flex', width: 30, height: 30, borderRadius: 8, background: TZ.redSoft,
              color: TZ.red, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldAlert size={16} />
            </span>
            <div>
              <h3 style={{ fontFamily: TZ.sans, fontSize: 16, fontWeight: 800, color: TZ.ink, margin: 0 }}>
                {t('sos.detailTitle')} #{id}
              </h3>
              <p style={{ fontFamily: TZ.sans, fontSize: 12.5, color: TZ.muted, margin: '3px 0 0' }}>
                {new Date(row.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <button onClick={onClose} type="button"
            style={{ background: 'none', border: 0, cursor: 'pointer', color: TZ.faint, padding: 2 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          <Row label={t('sos.colPhone')} value={row.phone} mono />
          <Row label={t('sos.colStatus')} value={<StatusPill status={row.status} size="sm" />} />
          {row.note && <Row label={t('sos.colNote')} value={row.note} />}
          {row.order_id && <Row label={t('sos.order')} value={`#${row.order_id}`} />}
          {row.user_id && <Row label={t('sos.user')} value={`#${row.user_id}`} />}
          {row.taxi_id && <Row label={t('sos.taxi')} value={`#${row.taxi_id}`} />}
          <Row label={t('sos.colLocation')} value={
            <Link to={`/map?lat=${row.lat}&lng=${row.lng}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: TZ.sans,
                fontSize: 13, fontWeight: 600, color: TZ.navy, textDecoration: 'none' }}>
              {Number(row.lat).toFixed(5)}, {Number(row.lng).toFixed(5)} <ExternalLink size={12} />
            </Link>
          } />
        </div>

        {row.status !== 'resolved' && (
          <div style={{ padding: '14px 20px', borderTop: `1px solid ${TZ.lineSoft}`, flexShrink: 0,
            display: 'flex', gap: 8 }}>
            {row.status === 'open' && (
              <button type="button" onClick={() => setStatus('acknowledged')} disabled={busy}
                style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 0, background: TZ.amber, color: '#fff',
                  fontFamily: TZ.sans, fontSize: 13, fontWeight: 700, cursor: busy ? 'default' : 'pointer' }}>
                {t('sos.acknowledge')}
              </button>
            )}
            <button type="button" onClick={() => setStatus('resolved')} disabled={busy}
              style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 0, background: TZ.green, color: '#fff',
                fontFamily: TZ.sans, fontSize: 13, fontWeight: 700, cursor: busy ? 'default' : 'pointer' }}>
              {t('sos.resolve')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, mono }) {
  const TZ = useTZ()
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.muted }}>{label}</span>
      <span style={{ fontFamily: mono ? TZ.mono : TZ.sans, fontSize: 13, fontWeight: 600, color: TZ.ink, textAlign: 'right' }}>
        {value}
      </span>
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
