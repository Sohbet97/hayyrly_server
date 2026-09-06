import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, Wallet, Pencil, X } from 'lucide-react'
import { usePageHeader } from '../components/shell/AdminShell.jsx'
import { StatusPill, Avatar } from '../design/atoms.jsx'
import { useTZ } from '../design/tokens.js'
import { useApi } from '../api/useApi.js'
import { mediaUrl } from '../api/client.js'
import { getDriver, getDriverOrders, adjustBalance, setDriverActive, updateDriver } from '../api/drivers.js'
import { listCities } from '../api/cities.js'
import { listMarkas } from '../api/cars.js'
import { DriverFormModal } from '../components/drivers/DriverFormModal.jsx'
import { useT } from '../i18n/useT.js'

export default function DriverDetailPage({ shell }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const TZ = useTZ()
  const t = useT()
  const [balanceOpen, setBalanceOpen] = useState(false)
  const [balanceForm, setBalanceForm] = useState({ amount: '', direction: 'add', note: '' })
  const [carPreviewOpen, setCarPreviewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const { data, loading, error, reload } = useApi(() => getDriver(id), [id])
  const { data: ordersData, loading: ordersLoading, error: ordersError } =
    useApi(() => getDriverOrders(id, { limit: 50 }), [id])
  const { data: citiesData } = useApi(() => listCities(), [])
  const { data: markasData } = useApi(() => listMarkas(), [])

  const cities = citiesData?.data ?? []
  const markas = markasData?.data ?? []

  const driver = data?.driver
  const orders = ordersData?.data ?? []
  const name = driver ? `${driver.first_name} ${driver.last_name}` : ''
  const car = driver ? [driver.marka_name, driver.model_name].filter(Boolean).join(' ') : ''

  async function toggleActive() {
    try {
      await setDriverActive(driver.user_id, !driver.is_active)
      reload()
    } catch (err) {
      alert(err.message || t('drivers.statusError'))
    }
  }

  async function saveEdit(payload, files) {
    await updateDriver(driver.user_id, payload, files)
    setEditOpen(false)
    reload()
  }

  async function submitBalance(e) {
    e.preventDefault()
    try {
      await adjustBalance(driver.user_id, {
        amount: parseFloat(balanceForm.amount),
        direction: balanceForm.direction,
        note: balanceForm.note,
      })
      setBalanceOpen(false)
      setBalanceForm({ amount: '', direction: 'add', note: '' })
      reload()
    } catch (err) {
      alert(err.message || t('drivers.balanceError'))
    }
  }

  usePageHeader({
    title: name || t('driverDetail.title'),
    subtitle: car,
    actions: (
      <button type="button" onClick={() => navigate('/drivers')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
          border: `1px solid ${TZ.line}`, borderRadius: 8, background: TZ.surface,
          fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.body, cursor: 'pointer' }}>
        <ArrowLeft size={13} /> {t('driverDetail.back')}
      </button>
    ),
  })

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '14px 16px', gap: 12, overflow: 'hidden' }}>

        {loading && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>{t('common.loading')}</div>}
        {error && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{error.message || t('driverDetail.loadError')}</div>}
        {!loading && !error && !driver && (
          <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>{t('driverDetail.notFound')}</div>
        )}

        {driver && (
          <>
            {/* Header summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0, flexWrap: 'wrap',
              background: TZ.surface, border: `1px solid ${TZ.line}`, borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar name={name} size={44} color={TZ.navy} src={mediaUrl(driver.avatar)} />
                  <span style={{ position: 'absolute', bottom: -1, right: -1, width: 12, height: 12,
                    borderRadius: '50%', border: '2px solid #fff', background: driver.is_active ? TZ.green : TZ.faint }} />
                </div>
                <div>
                  <div style={{ fontFamily: TZ.sans, fontSize: 15, fontWeight: 700, color: TZ.ink }}>{name}</div>
                  <div style={{ fontFamily: TZ.mono, fontSize: 12, color: TZ.muted, marginTop: 2 }}>{driver.phone}</div>
                </div>
              </div>

              <StatusPill status={driver.is_active ? 'online' : 'offline'} />

              <div>
                <div style={{ fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700, color: TZ.muted, textTransform: 'uppercase' }}>
                  {t('driverDetail.car')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 600, color: TZ.ink }}>
                    {car || '—'} {driver.auto_number ? `· ${driver.auto_number}` : ''}
                  </span>
                  {driver.auto_image && (
                    <button type="button" onClick={() => setCarPreviewOpen(true)} title={t('driverDetail.carImage')}
                      style={{ padding: 0, border: `1px solid ${TZ.line}`, borderRadius: 6,
                        cursor: 'pointer', overflow: 'hidden', width: 24, height: 24, flexShrink: 0 }}>
                      <img src={mediaUrl(driver.auto_image)} alt={t('driverDetail.carImage')}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700, color: TZ.muted, textTransform: 'uppercase' }}>
                  {t('driverDetail.city')}
                </div>
                <div style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 600, color: TZ.ink, marginTop: 4 }}>
                  {driver.city_name ?? '—'}
                </div>
              </div>

              <div>
                <div style={{ fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700, color: TZ.muted, textTransform: 'uppercase' }}>
                  {t('driverDetail.park')}
                </div>
                <div style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 600, color: TZ.ink, marginTop: 4 }}>
                  {driver.park ? t('driverDetail.parkYes') : t('driverDetail.parkNo')}
                </div>
              </div>

              <div style={{ flex: 1 }} />

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700, color: TZ.muted, textTransform: 'uppercase' }}>
                  {t('driverDetail.balance')}
                </div>
                <div style={{ fontFamily: TZ.sans, fontSize: 16, fontWeight: 700, color: TZ.ink, marginTop: 4 }}>
                  {Number(driver.balance).toFixed(2)} TMT
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <a href={driver.phone ? `tel:${driver.phone}` : undefined} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 14px', borderRadius: 8, cursor: driver.phone ? 'pointer' : 'default',
                  fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.body,
                  border: `1px solid ${TZ.line}`, background: TZ.surface,
                  textDecoration: 'none', opacity: driver.phone ? 1 : 0.5,
                }}>
                  <Phone size={13} /> {t('drivers.call')}
                </a>
                <button type="button" onClick={() => setEditOpen(true)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 14px', borderRadius: 8, cursor: 'pointer',
                  fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.body,
                  border: `1px solid ${TZ.line}`, background: TZ.surface,
                }}>
                  <Pencil size={13} /> {t('driverDetail.edit')}
                </button>
                <button type="button" onClick={() => setBalanceOpen(true)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 14px', borderRadius: 8, cursor: 'pointer',
                  fontFamily: TZ.sans, fontSize: 12, fontWeight: 700, color: '#fff', border: 0, background: TZ.navy,
                }}>
                  <Wallet size={13} /> {t('drivers.balance')}
                </button>
                <button type="button" onClick={toggleActive} style={{
                  padding: '9px 14px', borderRadius: 8, cursor: 'pointer',
                  fontFamily: TZ.sans, fontSize: 12, fontWeight: 700, border: 0,
                  color: driver.is_active ? TZ.red : TZ.green,
                  background: driver.is_active ? TZ.redSoft : TZ.greenSoft,
                }}>
                  {driver.is_active ? t('drivers.deactivate') : t('drivers.activate')}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, flexShrink: 0 }}>
              {[
                { l: t('driverDetail.statTotalOrders'), v: driver.total_orders },
                { l: t('driverDetail.statCompletedOrders'), v: driver.completed_orders },
                { l: t('driverDetail.statTotalEarned'), v: `${Number(driver.total_earned).toFixed(0)} TMT` },
              ].map((s, i) => (
                <div key={i} style={{ background: TZ.surface, border: `1px solid ${TZ.line}`, borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700, color: TZ.muted,
                    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{s.l}</div>
                  <div style={{ fontFamily: TZ.sans, fontSize: 18, fontWeight: 700, color: TZ.ink }}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* Orders table */}
            <div style={{ flex: 1, minHeight: 0, background: TZ.surface, border: `1px solid ${TZ.line}`,
              borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${TZ.lineSoft}`, flexShrink: 0,
                fontFamily: TZ.sans, fontSize: 12, fontWeight: 700, color: TZ.ink }}>
                {t('driverDetail.sectionOrders')}
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {ordersLoading && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>{t('common.loading')}</div>}
                {ordersError && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{ordersError.message}</div>}
                {!ordersLoading && !ordersError && (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: TZ.surface2, borderBottom: `1px solid ${TZ.line}` }}>
                        {[t('driverDetail.colClient'), t('driverDetail.colRoute'), t('driverDetail.colPrice'),
                          t('driverDetail.colStatus'), t('driverDetail.colDate')].map((h, i) => (
                          <th key={i} style={{ padding: '10px 14px', textAlign: 'left',
                            fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700, color: TZ.muted,
                            textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id} style={{ borderBottom: `1px solid ${TZ.lineSoft}` }}>
                          <td style={{ padding: '10px 14px', fontFamily: TZ.sans, fontSize: 12.5, color: TZ.ink, fontWeight: 600 }}>
                            {o.client_name || o.client_phone || '—'}
                          </td>
                          <td style={{ padding: '10px 14px', fontFamily: TZ.sans, fontSize: 12.5, color: TZ.body,
                            maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {o.start_address} → {o.end_address ?? '—'}
                          </td>
                          <td style={{ padding: '10px 14px', fontFamily: TZ.mono, fontSize: 12, color: TZ.ink }}>
                            {o.total_price != null ? `${Number(o.total_price).toFixed(2)} TMT` : '—'}
                          </td>
                          <td style={{ padding: '10px 14px' }}><StatusPill status={o.status} size="sm" /></td>
                          <td style={{ padding: '10px 14px', fontFamily: TZ.mono, fontSize: 11.5, color: TZ.muted, whiteSpace: 'nowrap' }}>
                            {new Date(o.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', fontFamily: TZ.sans,
                          fontSize: 12, color: TZ.faint }}>{t('common.noOrders')}</td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Balance modal */}
      {balanceOpen && driver && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <form onSubmit={submitBalance} style={{ background: TZ.surface, borderRadius: 16, padding: 24,
            width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <h3 style={{ fontFamily: TZ.sans, fontSize: 16, fontWeight: 800, color: TZ.ink, margin: 0 }}>
                {name} — {t('drivers.balanceTitleSuffix')}
              </h3>
              <button onClick={() => setBalanceOpen(false)} type="button"
                style={{ background: 'none', border: 0, cursor: 'pointer', color: TZ.faint, padding: 2 }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontFamily: TZ.sans, fontSize: 12.5, color: TZ.muted, margin: '0 0 16px' }}>
              {t('drivers.balanceCurrentPrefix')}: <strong style={{ color: TZ.ink }}>{Number(driver.balance).toFixed(2)} TMT</strong>
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
              <button onClick={() => setBalanceOpen(false)} type="button"
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

      {/* Edit driver modal */}
      {editOpen && driver && (
        <DriverFormModal
          title={t('driverDetail.editTitle')}
          submitLabel={t('drivers.submit')}
          initialValues={{
            firstName: driver.first_name,
            lastName: driver.last_name,
            phone: driver.phone,
            birthday: driver.birthday ?? '',
            cityId: driver.city_id ?? '',
            park: Boolean(driver.park),
            autoNumber: driver.auto_number ?? '',
            markaId: driver.marka_id ?? '',
            modelId: driver.model_id ?? '',
            autoYear: driver.auto_year ?? '',
          }}
          initialAvatarUrl={mediaUrl(driver.avatar)}
          initialCarImageUrl={mediaUrl(driver.auto_image)}
          cities={cities}
          markas={markas}
          onClose={() => setEditOpen(false)}
          onSave={saveEdit}
          errorFallback={t('driverDetail.updateError')}
        />
      )}

      {/* Car image lightbox */}
      {carPreviewOpen && driver?.auto_image && (
        <div onClick={() => setCarPreviewOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <button onClick={() => setCarPreviewOpen(false)} type="button"
            style={{ position: 'absolute', top: 20, right: 24, background: 'none', border: 0,
              cursor: 'pointer', color: '#fff', padding: 4 }}>
            <X size={22} />
          </button>
          <img src={mediaUrl(driver.auto_image)} alt="" onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 12, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }} />
        </div>
      )}
    </>
  )
}
