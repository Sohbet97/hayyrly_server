import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, MoreHorizontal, Phone, X, Check, Wallet, ChevronLeft, ChevronRight } from 'lucide-react'
import { usePageHeader } from '../components/shell/AdminShell.jsx'
import { StatusPill, Avatar } from '../design/atoms.jsx'
import { useTZ } from '../design/tokens.js'
import { useApi } from '../api/useApi.js'
import { mediaUrl } from '../api/client.js'
import { listDrivers, adjustBalance, setDriverActive, createDriver } from '../api/drivers.js'
import { listApplications, approveApplication, rejectApplication } from '../api/applications.js'
import { listCities } from '../api/cities.js'
import { listMarkas } from '../api/cars.js'
import { DriverFormModal } from '../components/drivers/DriverFormModal.jsx'
import { useT } from '../i18n/useT.js'

const DRIVER_COLORS = ['#0E2A4D', '#C98612', '#5B4FC9', '#1B8F5A', '#C24536']
function colorFor(id) { return DRIVER_COLORS[id % DRIVER_COLORS.length] }

const DRIVERS_PER = 24
const APPS_PER = 20

export default function DriversPage({ shell }) {
  const TZ = useTZ()
  const t = useT()
  const navigate = useNavigate()
  const [tab,      setTab]      = useState('drivers')
  const [search,   setSearch]   = useState('')
  const [activeFilter, setActiveFilter] = useState('all') // all | active | inactive
  const [driversPg, setDriversPg] = useState(1)
  const [appsStatus, setAppsStatus] = useState('pending') // pending | approved | rejected
  const [appsPg,    setAppsPg]    = useState(1)
  const [rejectId, setRejectId] = useState(null)
  const [reason,   setReason]   = useState('')
  const [balanceFor, setBalanceFor] = useState(null)
  const [balanceForm, setBalanceForm] = useState({ amount: '', direction: 'add', note: '' })
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [showAddDriver, setShowAddDriver] = useState(false)

  const { data: driversData, loading: driversLoading, error: driversError, reload: reloadDrivers } =
    useApi(() => listDrivers({ limit: 300 }), [])
  const { data: appsData, loading: appsLoading, error: appsError, reload: reloadApps } =
    useApi(() => listApplications({ status: appsStatus, limit: 300 }), [appsStatus])
  const { data: pendingData, reload: reloadPending } =
    useApi(() => listApplications({ status: 'pending', limit: 1 }), [])
  const { data: citiesData } = useApi(() => listCities(), [])
  const { data: markasData } = useApi(() => listMarkas(), [])

  const cities = citiesData?.data ?? []
  const markas = markasData?.data ?? []

  const allDrivers = driversData?.data ?? []
  const apps       = appsData?.data ?? []
  const pendingTotal = pendingData?.total ?? 0

  const filtered = allDrivers.filter(d => {
    if (activeFilter === 'active' && !d.is_active) return false
    if (activeFilter === 'inactive' && d.is_active) return false
    const name = `${d.first_name} ${d.last_name}`.toLowerCase()
    return !search || name.includes(search.toLowerCase()) || (d.auto_number ?? '').toLowerCase().includes(search.toLowerCase())
  })
  const driversPages = Math.max(1, Math.ceil(filtered.length / DRIVERS_PER))
  const pagedDrivers  = filtered.slice((driversPg - 1) * DRIVERS_PER, driversPg * DRIVERS_PER)

  const appsPages = Math.max(1, Math.ceil(apps.length / APPS_PER))
  const pagedApps  = apps.slice((appsPg - 1) * APPS_PER, appsPg * APPS_PER)

  function goDriversFilter(v) { setActiveFilter(v); setDriversPg(1) }
  function goSearch(v) { setSearch(v); setDriversPg(1) }
  function goAppsStatus(v) { setAppsStatus(v); setAppsPg(1) }

  async function approve(id) {
    try { await approveApplication(id); reloadApps(); reloadDrivers(); reloadPending() }
    catch (err) { alert(err.message || t('drivers.approveError')) }
  }
  async function reject(id) {
    if (!reason.trim()) return
    try {
      await rejectApplication(id, reason)
      setRejectId(null); setReason('')
      reloadApps(); reloadPending()
    } catch (err) { alert(err.message || t('drivers.rejectError')) }
  }

  async function toggleActive(driver) {
    try {
      await setDriverActive(driver.user_id, !driver.is_active)
      setMenuOpenId(null)
      reloadDrivers()
    } catch (err) {
      alert(err.message || t('drivers.statusError'))
    }
  }

  async function saveNewDriver(payload, files) {
    await createDriver(payload, files)
    setShowAddDriver(false)
    reloadDrivers()
  }

  async function submitBalance(e) {
    e.preventDefault()
    try {
      await adjustBalance(balanceFor.user_id, {
        amount: parseFloat(balanceForm.amount),
        direction: balanceForm.direction,
        note: balanceForm.note,
      })
      setBalanceFor(null)
      setBalanceForm({ amount: '', direction: 'add', note: '' })
      reloadDrivers()
    } catch (err) {
      alert(err.message || t('drivers.balanceError'))
    }
  }

  usePageHeader({
    title: t('drivers.title'),
    subtitle: `${driversData?.total ?? allDrivers.length} ${t('drivers.subtitlePeople')} · ${allDrivers.filter(d => d.is_active).length} ${t('drivers.subtitleActive')} · ${pendingTotal} ${t('drivers.subtitlePendingApps')}`,
    actions: (
      <button type="button" onClick={() => setShowAddDriver(true)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
          border: 0, borderRadius: 8, background: TZ.navy, color: '#fff',
          fontFamily: TZ.sans, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
        <Plus size={13} /> {t('drivers.addDriver')}
      </button>
    ),
  })

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
        padding: '14px 16px', gap: 12, overflow: 'hidden' }}>

        {/* ── Tabs + search ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: TZ.surface2, border: `1px solid ${TZ.line}`,
            borderRadius: 9, padding: 3, gap: 2 }}>
            {[
              { id: 'drivers', label: t('drivers.tabDrivers'), n: driversData?.total ?? allDrivers.length, badge: false },
              { id: 'apps',    label: t('drivers.tabApps'),    n: pendingTotal,    badge: true  },
            ].map(tb => {
              const on = tb.id === tab
              return (
                <button key={tb.id} onClick={() => setTab(tb.id)} type="button"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
                    fontFamily: TZ.sans, fontSize: 13, fontWeight: on ? 700 : 500,
                    border: 0, background: on ? TZ.surface : 'transparent',
                    color: on ? TZ.ink : TZ.muted,
                    boxShadow: on ? '0 1px 3px rgba(0,0,0,0.07)' : 'none',
                    transition: 'all 0.12s',
                  }}>
                  {tb.label}
                  <span style={{ fontFamily: TZ.mono, fontSize: 11,
                    color: on ? TZ.muted : TZ.faint }}>{tb.n}</span>
                  {tb.badge && tb.n > 0 && (
                    <span style={{ fontFamily: TZ.sans, fontSize: 10, fontWeight: 700,
                      color: '#fff', background: TZ.orange,
                      borderRadius: 10, padding: '1px 6px', lineHeight: 1.6 }}>{tb.n}</span>
                  )}
                </button>
              )
            })}
          </div>

          {tab === 'drivers' && (
            <div style={{ display: 'flex', background: TZ.surface2, border: `1px solid ${TZ.line}`,
              borderRadius: 9, padding: 3, gap: 2 }}>
              {[
                { id: 'all',      label: t('drivers.filterAll') },
                { id: 'active',   label: t('drivers.filterActive') },
                { id: 'inactive', label: t('drivers.filterInactive') },
              ].map(f => {
                const on = f.id === activeFilter
                return (
                  <button key={f.id} type="button" onClick={() => goDriversFilter(f.id)}
                    style={{ padding: '6px 10px', borderRadius: 7, cursor: 'pointer',
                      fontFamily: TZ.sans, fontSize: 12, fontWeight: on ? 700 : 500,
                      border: 0, background: on ? TZ.surface : 'transparent',
                      color: on ? TZ.ink : TZ.muted,
                      boxShadow: on ? '0 1px 3px rgba(0,0,0,0.07)' : 'none' }}>
                    {f.label}
                  </button>
                )
              })}
            </div>
          )}

          {tab === 'apps' && (
            <div style={{ display: 'flex', background: TZ.surface2, border: `1px solid ${TZ.line}`,
              borderRadius: 9, padding: 3, gap: 2 }}>
              {[
                { id: 'pending',  label: t('drivers.appsTabPending') },
                { id: 'approved', label: t('drivers.appsTabApproved') },
                { id: 'rejected', label: t('drivers.appsTabRejected') },
              ].map(f => {
                const on = f.id === appsStatus
                return (
                  <button key={f.id} type="button" onClick={() => goAppsStatus(f.id)}
                    style={{ padding: '6px 10px', borderRadius: 7, cursor: 'pointer',
                      fontFamily: TZ.sans, fontSize: 12, fontWeight: on ? 700 : 500,
                      border: 0, background: on ? TZ.surface : 'transparent',
                      color: on ? TZ.ink : TZ.muted,
                      boxShadow: on ? '0 1px 3px rgba(0,0,0,0.07)' : 'none' }}>
                    {f.label}
                  </button>
                )
              })}
            </div>
          )}

          <div style={{ flex: 1 }} />

          {tab === 'drivers' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
              borderRadius: 8, background: TZ.surface, border: `1px solid ${TZ.line}`, width: 220 }}>
              <Search size={14} color={TZ.muted} style={{ flexShrink: 0 }} />
              <input value={search} onChange={e => goSearch(e.target.value)} placeholder={t('drivers.searchPlaceholder')}
                style={{ flex: 1, border: 0, outline: 'none', background: 'transparent',
                  fontFamily: TZ.sans, fontSize: 13, color: TZ.ink, minWidth: 0 }} />
            </div>
          )}
        </div>

        {/* ── Drivers grid ── */}
        {tab === 'drivers' && (
          <>
            {driversLoading && <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>{t('common.loading')}</div>}
            {driversError && <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{driversError.message}</div>}
            {!driversLoading && !driversError && (
              <>
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto',
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, alignContent: 'start' }}>
                  {pagedDrivers.map(d => {
                    const name = `${d.first_name} ${d.last_name}`
                    const car  = [d.marka_name, d.model_name].filter(Boolean).join(' ')
                    return (
                      <div key={d.id} onClick={() => navigate(`/drivers/${d.user_id}`)} style={{
                        position: 'relative', cursor: 'pointer',
                        background: TZ.surface, border: `1px solid ${TZ.line}`, borderRadius: 12,
                        padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
                        opacity: d.is_active ? 1 : 0.75,
                      }}>
                        <button type="button" onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === d.id ? null : d.id) }}
                          style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 0,
                            cursor: 'pointer', color: TZ.faint, padding: 4, borderRadius: 6, zIndex: 2 }}>
                          <MoreHorizontal size={16} />
                        </button>
                        {menuOpenId === d.id && (
                          <div style={{ position: 'absolute', top: 34, right: 10, background: TZ.surface,
                            border: `1px solid ${TZ.line}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                            zIndex: 3, overflow: 'hidden' }}>
                            <button type="button" onClick={e => { e.stopPropagation(); toggleActive(d) }}
                              style={{ display: 'block', width: '100%', padding: '8px 14px', border: 0,
                                background: 'transparent', textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap',
                                fontFamily: TZ.sans, fontSize: 12, fontWeight: 600,
                                color: d.is_active ? TZ.red : TZ.green }}>
                              {d.is_active ? t('drivers.deactivate') : t('drivers.activate')}
                            </button>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <Avatar name={name} size={44} color={colorFor(d.id)} src={mediaUrl(d.avatar)} />
                            <span style={{
                              position: 'absolute', bottom: -1, right: -1, width: 12, height: 12,
                              borderRadius: '50%', border: '2px solid #fff',
                              background: d.is_active ? TZ.green : TZ.faint,
                            }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: TZ.sans, fontSize: 13.5, fontWeight: 700, color: TZ.ink,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                            <div style={{ fontFamily: TZ.mono, fontSize: 11.5, color: TZ.muted, marginTop: 2 }}>{d.auto_number}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <StatusPill status={d.is_active ? 'online' : 'offline'} size="sm" />
                          {car && (
                            <span style={{ fontFamily: TZ.sans, fontSize: 11, fontWeight: 600, color: TZ.body,
                              background: TZ.surface3, borderRadius: 10, padding: '2px 8px' }}>{car}</span>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                          {[
                            { l: t('drivers.statOrders'),  v: d.completed_orders },
                            { l: t('drivers.statBalance'), v: `${Number(d.balance).toFixed(0)} TMT` },
                            { l: t('drivers.statCity'),    v: d.city_name ?? '—' },
                          ].map((s, i) => (
                            <div key={i} style={{ background: TZ.surface2, borderRadius: 8, padding: '8px 6px' }}>
                              <div style={{ fontFamily: TZ.sans, fontSize: 9.5, fontWeight: 700, color: TZ.muted,
                                textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{s.l}</div>
                              <div style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 700, color: TZ.ink,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.v}</div>
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <a href={d.phone ? `tel:${d.phone}` : undefined} onClick={e => e.stopPropagation()} style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '8px 0', borderRadius: 8, cursor: d.phone ? 'pointer' : 'default',
                            fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.body,
                            border: `1px solid ${TZ.line}`, background: TZ.surface,
                            textDecoration: 'none', opacity: d.phone ? 1 : 0.5,
                          }}>
                            <Phone size={13} /> {t('drivers.call')}
                          </a>
                          <button type="button" onClick={e => { e.stopPropagation(); setBalanceFor(d) }} style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                            fontFamily: TZ.sans, fontSize: 12, fontWeight: 700, color: '#fff',
                            border: 0, background: TZ.navy,
                          }}>
                            <Wallet size={13} /> {t('drivers.balance')}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {pagedDrivers.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', padding: 24, textAlign: 'center',
                      fontFamily: TZ.sans, fontSize: 12, color: TZ.faint }}>{t('common.noDrivers')}</div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <span style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.muted }}>
                    {filtered.length === 0 ? 0 : (driversPg - 1) * DRIVERS_PER + 1}–{Math.min(driversPg * DRIVERS_PER, filtered.length)} / {filtered.length} {t('drivers.driversUnit')}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <PageBtn onClick={() => setDriversPg(p => Math.max(1, p - 1))} disabled={driversPg === 1}>
                      <ChevronLeft size={14} />
                    </PageBtn>
                    {Array.from({ length: driversPages }, (_, i) => i + 1).map(p => (
                      <PageBtn key={p} active={p === driversPg} onClick={() => setDriversPg(p)}>{p}</PageBtn>
                    ))}
                    <PageBtn onClick={() => setDriversPg(p => Math.min(driversPages, p + 1))} disabled={driversPg === driversPages}>
                      <ChevronRight size={14} />
                    </PageBtn>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── Applications table ── */}
        {tab === 'apps' && (
          <div style={{ flex: 1, minHeight: 0, background: TZ.surface, border: `1px solid ${TZ.line}`,
            borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {appsLoading && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>{t('common.loading')}</div>}
            {appsError && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{appsError.message}</div>}
            {!appsLoading && !appsError && (
              <>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: TZ.surface2, borderBottom: `1px solid ${TZ.line}` }}>
                        {[t('drivers.colName'), t('drivers.colPhone'), t('drivers.colCar'), t('drivers.colFleet'),
                          t('drivers.colDocs'), t('drivers.colSubmitted'), ''].map((h, i) => (
                          <th key={i} style={{ padding: '10px 16px', textAlign: 'left',
                            fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700, color: TZ.muted,
                            textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedApps.map(a => (
                        <tr key={a.id} style={{ borderBottom: `1px solid ${TZ.lineSoft}` }}>
                          <td style={{ padding: '13px 16px', fontFamily: TZ.sans, fontSize: 13,
                            fontWeight: 600, color: TZ.ink }}>{a.first_name} {a.last_name}</td>
                          <td style={{ padding: '13px 16px', fontFamily: TZ.mono, fontSize: 11.5,
                            color: TZ.muted }}>{a.phone}</td>
                          <td style={{ padding: '13px 16px', fontFamily: TZ.mono, fontSize: 11,
                            color: TZ.muted }}>{a.auto_number ?? '—'}</td>
                          <td style={{ padding: '13px 16px', fontFamily: TZ.sans, fontSize: 13, color: TZ.body }}>{a.park ?? '—'}</td>
                          <td style={{ padding: '13px 16px' }}>
                            {a.license_photo || a.car_image ? (
                              <div style={{ display: 'flex', gap: 6 }}>
                                {a.license_photo && (
                                  <button type="button" onClick={() => setPreviewImage(a.license_photo)}
                                    title={t('drivers.docLicense')}
                                    style={{ padding: 0, border: `1px solid ${TZ.line}`, borderRadius: 6,
                                      cursor: 'pointer', overflow: 'hidden', width: 32, height: 32, flexShrink: 0 }}>
                                    <img src={a.license_photo} alt={t('drivers.docLicense')}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                  </button>
                                )}
                                {a.car_image && (
                                  <button type="button" onClick={() => setPreviewImage(a.car_image)}
                                    title={t('drivers.docCar')}
                                    style={{ padding: 0, border: `1px solid ${TZ.line}`, borderRadius: 6,
                                      cursor: 'pointer', overflow: 'hidden', width: 32, height: 32, flexShrink: 0 }}>
                                    <img src={a.car_image} alt={t('drivers.docCar')}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.faint }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '13px 16px', fontFamily: TZ.mono, fontSize: 11.5, color: TZ.muted }}>
                            {new Date(a.created_at).toLocaleString()}
                          </td>
                          <td style={{ padding: '13px 16px' }}>
                            {a.status === 'pending' ? (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <ActionBtn onClick={() => approve(a.id)} color={TZ.green} bg={TZ.greenSoft}>
                                  <Check size={12} /> {t('drivers.approve')}
                                </ActionBtn>
                                <ActionBtn onClick={() => setRejectId(a.id)} color={TZ.red} bg={TZ.redSoft}>
                                  <X size={12} /> {t('drivers.reject')}
                                </ActionBtn>
                              </div>
                            ) : (
                              <StatusPill status={a.status} size="sm" />
                            )}
                          </td>
                        </tr>
                      ))}
                      {pagedApps.length === 0 && (
                        <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', fontFamily: TZ.sans,
                          fontSize: 12, color: TZ.faint }}>{appsStatus === 'pending' ? t('drivers.noApps') : t('drivers.noAppsGeneric')}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ padding: '10px 16px', borderTop: `1px solid ${TZ.lineSoft}`, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.muted }}>
                    {apps.length === 0 ? 0 : (appsPg - 1) * APPS_PER + 1}–{Math.min(appsPg * APPS_PER, apps.length)} / {apps.length} {t('drivers.appsUnit')}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <PageBtn onClick={() => setAppsPg(p => Math.max(1, p - 1))} disabled={appsPg === 1}>
                      <ChevronLeft size={14} />
                    </PageBtn>
                    {Array.from({ length: appsPages }, (_, i) => i + 1).map(p => (
                      <PageBtn key={p} active={p === appsPg} onClick={() => setAppsPg(p)}>{p}</PageBtn>
                    ))}
                    <PageBtn onClick={() => setAppsPg(p => Math.min(appsPages, p + 1))} disabled={appsPg === appsPages}>
                      <ChevronRight size={14} />
                    </PageBtn>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Reject modal ── */}
      {rejectId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: TZ.surface, borderRadius: 16, padding: 24, width: '100%', maxWidth: 380,
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: TZ.sans, fontSize: 16, fontWeight: 800, color: TZ.ink, margin: 0 }}>{t('drivers.rejectTitle')}</h3>
              <button onClick={() => { setRejectId(null); setReason('') }} type="button"
                style={{ background: 'none', border: 0, cursor: 'pointer', color: TZ.faint, padding: 2 }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.muted, margin: '0 0 10px' }}>
              {t('drivers.rejectHint')}
            </p>
            <textarea required value={reason} onChange={e => setReason(e.target.value)} placeholder={t('drivers.rejectPlaceholder')}
              style={{ width: '100%', minHeight: 80, padding: 12, borderRadius: 10,
                border: `1.5px solid ${TZ.line}`, background: TZ.surface2, fontFamily: TZ.sans, fontSize: 13,
                color: TZ.ink, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => { setRejectId(null); setReason('') }} type="button"
                style={{ padding: '9px 18px', borderRadius: 9, border: `1px solid ${TZ.line}`,
                  background: TZ.surface, fontFamily: TZ.sans, fontSize: 13, fontWeight: 600,
                  color: TZ.body, cursor: 'pointer' }}>
                {t('common.close')}
              </button>
              <button onClick={() => reject(rejectId)} type="button" disabled={!reason.trim()}
                style={{ padding: '9px 18px', borderRadius: 9, border: 0,
                  background: TZ.red, color: '#fff', fontFamily: TZ.sans,
                  fontSize: 13, fontWeight: 700, cursor: reason.trim() ? 'pointer' : 'not-allowed',
                  opacity: reason.trim() ? 1 : 0.5 }}>
                {t('drivers.reject')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Balance modal ── */}
      {balanceFor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <form onSubmit={submitBalance} style={{ background: TZ.surface, borderRadius: 16, padding: 24,
            width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <h3 style={{ fontFamily: TZ.sans, fontSize: 16, fontWeight: 800, color: TZ.ink, margin: 0 }}>
                {balanceFor.first_name} {balanceFor.last_name} — {t('drivers.balanceTitleSuffix')}
              </h3>
              <button onClick={() => setBalanceFor(null)} type="button"
                style={{ background: 'none', border: 0, cursor: 'pointer', color: TZ.faint, padding: 2 }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontFamily: TZ.sans, fontSize: 12.5, color: TZ.muted, margin: '0 0 16px' }}>
              {t('drivers.balanceCurrentPrefix')}: <strong style={{ color: TZ.ink }}>{Number(balanceFor.balance).toFixed(2)} TMT</strong>
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {['add', 'remove'].map(dir => (
                <button key={dir} type="button" onClick={() => setBalanceForm({ ...balanceForm, direction: dir })}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                    fontFamily: TZ.sans, fontSize: 12, fontWeight: 700,
                    border: balanceForm.direction === dir ? 0 : `1px solid ${TZ.line}`,
                    background: balanceForm.direction === dir ? (dir === 'add' ? TZ.green : TZ.red) : TZ.surface,
                    color: balanceForm.direction === dir ? '#fff' : TZ.body }}>
                  {dir === 'add' ? t('drivers.balanceAdd') : t('drivers.balanceRemove')}
                </button>
              ))}
            </div>
            <input required type="number" step="0.01" placeholder={t('drivers.amountPlaceholder')} value={balanceForm.amount}
              onChange={e => setBalanceForm({ ...balanceForm, amount: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${TZ.line}`,
                background: TZ.surface2, color: TZ.ink,
                fontFamily: TZ.sans, fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
            <input placeholder={t('drivers.notePlaceholder')} value={balanceForm.note}
              onChange={e => setBalanceForm({ ...balanceForm, note: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${TZ.line}`,
                background: TZ.surface2, color: TZ.ink,
                fontFamily: TZ.sans, fontSize: 13, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setBalanceFor(null)} type="button"
                style={{ padding: '9px 18px', borderRadius: 9, border: `1px solid ${TZ.line}`,
                  background: TZ.surface, fontFamily: TZ.sans, fontSize: 13, fontWeight: 600,
                  color: TZ.body, cursor: 'pointer' }}>{t('common.close')}</button>
              <button type="submit"
                style={{ padding: '9px 18px', borderRadius: 9, border: 0,
                  background: TZ.navy, color: '#fff', fontFamily: TZ.sans,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{t('drivers.submit')}</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Add driver modal ── */}
      {showAddDriver && (
        <DriverFormModal
          title={t('drivers.addDriverTitle')}
          submitLabel={t('drivers.submit')}
          initialValues={{}}
          cities={cities}
          markas={markas}
          onClose={() => setShowAddDriver(false)}
          onSave={saveNewDriver}
        />
      )}

      {/* ── Image lightbox ── */}
      {previewImage && (
        <div onClick={() => setPreviewImage(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <button onClick={() => setPreviewImage(null)} type="button"
            style={{ position: 'absolute', top: 20, right: 24, background: 'none', border: 0,
              cursor: 'pointer', color: '#fff', padding: 4 }}>
            <X size={22} />
          </button>
          <img src={previewImage} alt="" onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 12, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }} />
        </div>
      )}
    </>
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
