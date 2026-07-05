import { useState, useEffect, useRef } from 'react'
import { Truck, Globe, Banknote, Users, Bell, Check, Plus, MoreHorizontal, Key, Trash2, X } from 'lucide-react'
import { AdminShell } from '../components/shell/AdminShell.jsx'
import { Modal } from '../components/common/Modal.jsx'
import { useTZ } from '../design/tokens.js'
import { useApi } from '../api/useApi.js'
import { listPricing, updatePricing } from '../api/pricing.js'
import { createCity } from '../api/cities.js'
import { listTeam, createTeamMember, updateTeamMember, removeTeamMember } from '../api/team.js'
import { getSettings, updateSettings, getNotifPrefs, updateNotifPrefs } from '../api/settings.js'
import { useT } from '../i18n/useT.js'

const EVENT_LABEL_KEYS = {
  new_order:        'settings.eventNewOrder',
  order_late:       'settings.eventLateOrder',
  order_cancelled:  'settings.eventCancelled',
  driver_offline:   'settings.eventDriverOffline',
  daily_report:     'settings.eventDailyReport',
}

// ── Atoms ──────────────────────────────────────────────────────────────────

function Label({ children, hint }) {
  const TZ = useTZ()
  return (
    <div style={{ width: 200, flexShrink: 0 }}>
      <div style={{ fontFamily: TZ.sans, fontSize: 13.5, fontWeight: 600, color: TZ.ink }}>{children}</div>
      {hint && <div style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.muted, marginTop: 2 }}>{hint}</div>}
    </div>
  )
}

function Row({ label, hint, children }) {
  const TZ = useTZ()
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, padding: '16px 0',
      borderBottom: `1px solid ${TZ.lineSoft}` }}>
      <Label hint={hint}>{label}</Label>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

function Field({ value, onChange, prefix, suffix, width = 300, type = 'text', placeholder }) {
  const TZ = useTZ()
  return (
    <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${TZ.line}`,
      borderRadius: 8, overflow: 'hidden', width, background: TZ.surface }}>
      {prefix && (
        <span style={{ padding: '8px 12px', fontFamily: TZ.sans, fontSize: 12, fontWeight: 700,
          color: TZ.muted, background: TZ.surface2, borderRight: `1px solid ${TZ.line}`, whiteSpace: 'nowrap' }}>
          {prefix}
        </span>
      )}
      <input value={value ?? ''} type={type} placeholder={placeholder}
        onChange={e => onChange?.(e.target.value)}
        style={{ flex: 1, padding: '8px 12px', border: 0, outline: 'none', background: 'transparent',
          fontFamily: TZ.sans, fontSize: 13, color: TZ.ink, minWidth: 0 }} />
      {suffix && (
        <span style={{ padding: '8px 12px', fontFamily: TZ.sans, fontSize: 12, fontWeight: 700,
          color: TZ.muted, background: TZ.surface2, borderLeft: `1px solid ${TZ.line}`, whiteSpace: 'nowrap' }}>
          {suffix}
        </span>
      )}
    </div>
  )
}

function Segmented({ options, active, onChange }) {
  const TZ = useTZ()
  return (
    <div style={{ display: 'inline-flex', background: TZ.surface2, border: `1px solid ${TZ.line}`,
      borderRadius: 8, padding: 3, gap: 2 }}>
      {options.map((o, i) => {
        const on = i === active
        return (
          <button key={o} onClick={() => onChange?.(i)} type="button"
            style={{ padding: '6px 14px', borderRadius: 6, border: 0, cursor: 'pointer',
              fontFamily: TZ.sans, fontSize: 12, fontWeight: on ? 600 : 500,
              background: on ? TZ.surface : 'transparent',
              color: on ? TZ.ink : TZ.muted,
              boxShadow: on ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.12s' }}>
            {o}
          </button>
        )
      })}
    </div>
  )
}

function Toggle({ on, onChange }) {
  const TZ = useTZ()
  return (
    <button type="button" onClick={() => onChange?.(!on)}
      style={{ position: 'relative', width: 36, height: 20, borderRadius: 10, border: 0,
        cursor: 'pointer', background: on ? TZ.navy : TZ.faint, transition: 'background 0.2s', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 2, left: on ? 18 : 2,
        width: 16, height: 16, borderRadius: 8, background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  )
}

function SectionHead({ children }) {
  const TZ = useTZ()
  return (
    <div style={{ fontFamily: TZ.sans, fontSize: 10, fontWeight: 700, color: TZ.faint,
      textTransform: 'uppercase', letterSpacing: 1.2, margin: '20px 0 4px' }}>
      {children}
    </div>
  )
}

function SavedBadge({ t }) {
  const TZ = useTZ()
  return (
    <span style={{ fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700, color: TZ.green,
      background: TZ.greenSoft, borderRadius: 10, padding: '2px 8px', marginLeft: 8 }}>
      {t('settings.saved')}
    </span>
  )
}

// ── Section bodies ─────────────────────────────────────────────────────────

function SecCompany({ t, settings, settingsLoading, settingsError, reloadSettings }) {
  const TZ = useTZ()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) setForm(f => f ?? {
      company_name: settings.company_name, support_phone: settings.support_phone, timezone: settings.timezone,
    })
  }, [settings])

  async function save() {
    if (!form || !settings) return
    setSaving(true)
    try {
      await updateSettings({
        company_name: form.company_name, support_phone: form.support_phone, timezone: form.timezone,
        default_lang: settings.default_lang, default_currency: settings.default_currency,
        distance_unit: settings.distance_unit, date_format: settings.date_format,
      })
      setSaved(true)
      reloadSettings()
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert(err.message || t('settings.saveError'))
    } finally {
      setSaving(false)
    }
  }

  if (settingsLoading || !form) return <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>{t('common.loading')}</div>
  if (settingsError) return <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{settingsError.message}</div>

  return (
    <div style={{ maxWidth: 580 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <SectionHead>{t('settings.companyInfoHead')}</SectionHead>
        {saved && <SavedBadge t={t} />}
      </div>
      <Row label={t('settings.companyName')} hint={t('settings.companyNameHint')}>
        <Field value={form.company_name} onChange={v => setForm({ ...form, company_name: v })} />
      </Row>
      <Row label={t('settings.supportPhone')}>
        <Field value={form.support_phone} prefix="+993" onChange={v => setForm({ ...form, support_phone: v })} />
      </Row>
      <Row label={t('settings.timezone')}>
        <Field value={form.timezone} width={280} onChange={v => setForm({ ...form, timezone: v })} />
      </Row>
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" onClick={save} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
            border: 0, background: TZ.navy, color: '#fff', fontFamily: TZ.sans, fontSize: 12.5,
            fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          <Check size={13} /> {t('settings.saveCompany')}
        </button>
      </div>
    </div>
  )
}

function SecLocale({ t, settings, settingsLoading, settingsError, reloadSettings }) {
  const TZ = useTZ()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) setForm(f => f ?? {
      default_lang: settings.default_lang, default_currency: settings.default_currency,
      distance_unit: settings.distance_unit, date_format: settings.date_format,
    })
  }, [settings])

  async function save(patch) {
    const merged = { ...form, ...patch }
    setForm(merged)
    if (!settings) return
    setSaving(true)
    try {
      await updateSettings({
        company_name: settings.company_name, support_phone: settings.support_phone, timezone: settings.timezone,
        ...merged,
      })
      setSaved(true)
      reloadSettings()
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert(err.message || t('settings.saveError'))
    } finally {
      setSaving(false)
    }
  }

  if (settingsLoading || !form) return <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>{t('common.loading')}</div>
  if (settingsError) return <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{settingsError.message}</div>

  const LANGS = ['tk', 'ru']
  const CURRENCIES = ['TMT', 'USD']
  const DISTANCES = ['km', 'mi']
  const DATE_FORMATS = ['DD.MM.YYYY', 'YYYY-MM-DD']

  return (
    <div style={{ maxWidth: 580 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <SectionHead>{t('settings.interfaceLangHead')}</SectionHead>
        {saved && <SavedBadge t={t} />}
      </div>
      <Row label={t('settings.mainLang')}>
        <Segmented options={['Türkmen', 'Русский']} active={LANGS.indexOf(form.default_lang)}
          onChange={i => save({ default_lang: LANGS[i] })} />
      </Row>
      <SectionHead>{t('settings.formatsHead')}</SectionHead>
      <Row label={t('settings.currency')}>
        <Segmented options={['TMT (manat)', 'USD']} active={CURRENCIES.indexOf(form.default_currency)}
          onChange={i => save({ default_currency: CURRENCIES[i] })} />
      </Row>
      <Row label={t('settings.distanceUnit')}>
        <Segmented options={['Kilometr', 'Mil']} active={DISTANCES.indexOf(form.distance_unit)}
          onChange={i => save({ distance_unit: DISTANCES[i] })} />
      </Row>
      <Row label={t('settings.dateFormat')}>
        <Segmented options={['GG.AA.ÝÝÝÝ', 'ÝÝÝÝ-AA-GG']} active={DATE_FORMATS.indexOf(form.date_format)}
          onChange={i => save({ date_format: DATE_FORMATS[i] })} />
      </Row>
    </div>
  )
}

const DEFAULT_PRICING_FORM = { base_price: 10, price_per_km: 2.5, free_wait_min: 3, wait_price_min: 0.5 }

function SecPricing({ t }) {
  const TZ = useTZ()
  const { data, loading, error, reload } = useApi(listPricing, [])
  const cities = data?.data ?? []

  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState({})
  const [saved,   setSaved]   = useState(null)
  const [saving,  setSaving]  = useState(false)

  const [adding,     setAdding]     = useState(false)
  const [regionForm,  setRegionForm] = useState({ name_tm: '', name_ru: '', name_en: '' })
  const [regionSaving, setRegionSaving] = useState(false)

  function startEdit(c) {
    setEditing(c.id)
    setForm(c.pricing ? {
      base_price: Number(c.pricing.base_price),
      price_per_km: Number(c.pricing.price_per_km),
      free_wait_min: Number(c.pricing.free_wait_min),
      wait_price_min: Number(c.pricing.wait_price_min),
    } : { ...DEFAULT_PRICING_FORM })
  }

  async function save() {
    setSaving(true)
    try {
      await updatePricing(editing, form)
      setSaved(editing)
      setEditing(null)
      reload()
      setTimeout(() => setSaved(null), 2000)
    } catch (err) {
      alert(err.message || t('settings.saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function saveRegion(e) {
    e.preventDefault()
    setRegionSaving(true)
    try {
      await createCity(regionForm)
      setRegionForm({ name_tm: '', name_ru: '', name_en: '' })
      setAdding(false)
      reload()
    } catch (err) {
      alert(err.message || t('settings.addRegionError'))
    } finally {
      setRegionSaving(false)
    }
  }

  const FIELDS = [
    { k: 'base_price',     l: t('settings.fieldBasePrice'), unit: 'TMT' },
    { k: 'price_per_km',   l: t('settings.fieldPerKm'),     unit: 'TMT' },
    { k: 'free_wait_min',  l: t('settings.fieldFreeWait'),  unit: 'min' },
    { k: 'wait_price_min', l: t('settings.fieldWaitPrice'), unit: 'TMT' },
  ]

  if (loading) return <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>{t('common.loading')}</div>
  if (error)   return <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{error.message}</div>

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: TZ.sans, fontSize: 15, fontWeight: 700, color: TZ.ink }}>{t('settings.pricingTitle')}</div>
          <div style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.muted, marginTop: 2 }}>{t('settings.pricingSubtitle')}</div>
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)} type="button"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8,
              border: 0, background: TZ.navy, color: '#fff', fontFamily: TZ.sans, fontSize: 12.5,
              fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={13} /> {t('settings.addRegion')}
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={saveRegion} style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <input required placeholder={t('settings.regionNameTmPlaceholder')} value={regionForm.name_tm}
            onChange={e => setRegionForm({ ...regionForm, name_tm: e.target.value })}
            style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${TZ.line}`,
              fontFamily: TZ.sans, fontSize: 13 }} />
          <input required placeholder={t('settings.regionNameRuPlaceholder')} value={regionForm.name_ru}
            onChange={e => setRegionForm({ ...regionForm, name_ru: e.target.value })}
            style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${TZ.line}`,
              fontFamily: TZ.sans, fontSize: 13 }} />
          <input required placeholder={t('settings.regionNameEnPlaceholder')} value={regionForm.name_en}
            onChange={e => setRegionForm({ ...regionForm, name_en: e.target.value })}
            style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${TZ.line}`,
              fontFamily: TZ.sans, fontSize: 13 }} />
          <button onClick={() => setAdding(false)} type="button" disabled={regionSaving}
            style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${TZ.line}`,
              background: TZ.surface, fontFamily: TZ.sans, fontSize: 12, fontWeight: 600,
              color: TZ.body, cursor: 'pointer' }}>
            <X size={13} />
          </button>
          <button type="submit" disabled={regionSaving}
            style={{ padding: '8px 14px', borderRadius: 8, border: 0, background: TZ.navy,
              color: '#fff', fontFamily: TZ.sans, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
            {t('settings.save')}
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {cities.map(c => {
          const pricing   = c.pricing
          const basePrice = pricing ? Number(pricing.base_price) : null
          const perKm     = pricing ? Number(pricing.price_per_km) : null
          return (
          <div key={c.id} style={{ border: `1px solid ${TZ.line}`, borderRadius: 12, overflow: 'hidden' }}>
            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', background: TZ.surface2, borderBottom: `1px solid ${TZ.lineSoft}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: TZ.sans, fontSize: 13.5, fontWeight: 700, color: TZ.ink }}>
                  {c.name_tm}
                </span>
                {saved === c.id && <SavedBadge t={t} />}
              </div>
              {editing === c.id ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setEditing(null)} type="button" disabled={saving}
                    style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${TZ.line}`,
                      background: TZ.surface, fontFamily: TZ.sans, fontSize: 12, fontWeight: 600,
                      color: TZ.body, cursor: 'pointer' }}>
                    <X size={12} />
                  </button>
                  <button onClick={save} type="button" disabled={saving}
                    style={{ padding: '5px 10px', borderRadius: 7, border: 0, background: TZ.navy,
                      color: '#fff', fontFamily: TZ.sans, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    <Check size={12} />
                  </button>
                </div>
              ) : (
                <button onClick={() => startEdit(c)} type="button"
                  style={{ padding: '5px 12px', borderRadius: 7, border: `1px solid ${TZ.line}`,
                    background: TZ.surface, fontFamily: TZ.sans, fontSize: 12, fontWeight: 600,
                    color: TZ.body, cursor: 'pointer' }}>
                  {pricing ? t('settings.edit') : t('settings.setPricing')}
                </button>
              )}
            </div>

            {/* Card body */}
            <div style={{ padding: '12px 16px', background: TZ.surface }}>
              {editing === c.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {FIELDS.map(f => (
                    <div key={f.k}>
                      <div style={{ fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700, color: TZ.muted,
                        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>
                        {f.l} ({f.unit})
                      </div>
                      <input type="number" step="0.5" value={form[f.k]}
                        onChange={e => setForm({ ...form, [f.k]: parseFloat(e.target.value) })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 8,
                          border: `1.5px solid ${TZ.line}`, fontFamily: TZ.sans, fontSize: 13,
                          color: TZ.ink, outline: 'none', boxSizing: 'border-box',
                          transition: 'border-color 0.15s' }}
                        onFocus={e => e.target.style.borderColor = TZ.navy}
                        onBlur={e => e.target.style.borderColor = TZ.line} />
                    </div>
                  ))}
                  <div style={{ background: TZ.amberSoft, borderRadius: 8, padding: '8px 10px',
                    fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.amber }}>
                    {t('settings.pricingWarning')}
                  </div>
                </div>
              ) : pricing ? (
                <>
                  {[
                    { l: t('settings.fieldBasePrice'), v: `${basePrice} TMT` },
                    { l: t('settings.fieldPerKm'),     v: `${perKm} TMT`     },
                    { l: t('settings.fieldFreeWait'),  v: `${Number(pricing.free_wait_min)} min`  },
                    { l: t('settings.fieldWaitPrice'), v: `${Number(pricing.wait_price_min)} TMT`},
                  ].map((r, i, arr) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '9px 0',
                      borderBottom: i < arr.length - 1 ? `1px solid ${TZ.lineSoft}` : 'none' }}>
                      <span style={{ fontFamily: TZ.sans, fontSize: 12.5, color: TZ.muted }}>{r.l}</span>
                      <span style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 700, color: TZ.ink }}>{r.v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 10, background: TZ.surface2, borderRadius: 8, padding: '9px 12px' }}>
                    <div style={{ fontFamily: TZ.sans, fontSize: 10, fontWeight: 700, color: TZ.muted,
                      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>{t('settings.example')}</div>
                    <div style={{ fontFamily: TZ.sans, fontSize: 12.5, color: TZ.body, display: 'flex', gap: 16 }}>
                      <span>3 km: <b style={{ color: TZ.ink }}>{(basePrice + perKm * 3).toFixed(2)} TMT</b></span>
                      <span>5 km: <b style={{ color: TZ.ink }}>{(basePrice + perKm * 5).toFixed(2)} TMT</b></span>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ fontFamily: TZ.sans, fontSize: 12.5, color: TZ.faint, fontStyle: 'italic' }}>
                  {t('settings.notConfigured')}
                </div>
              )}
            </div>
          </div>
        )})}
      </div>
    </div>
  )
}

function RowMenu({ t, onChangePassword, onRemove }) {
  const TZ = useTZ()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button type="button" onClick={() => setOpen(v => !v)} style={{ background: 'none', border: 0, cursor: 'pointer',
        color: TZ.faint, padding: 2 }}>
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, width: 170, zIndex: 1000,
          background: TZ.surface, border: `1px solid ${TZ.line}`, borderRadius: 10,
          boxShadow: '0 6px 20px rgba(0,0,0,0.16)', overflow: 'hidden' }}>
          <button type="button" onClick={() => { setOpen(false); onChangePassword() }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px',
              border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left',
              fontFamily: TZ.sans, fontSize: 12.5, fontWeight: 600, color: TZ.ink }}>
            <Key size={13} /> {t('settings.changePassword')}
          </button>
          <button type="button" onClick={() => { setOpen(false); onRemove() }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px',
              border: 0, borderTop: `1px solid ${TZ.lineSoft}`, background: 'transparent', cursor: 'pointer', textAlign: 'left',
              fontFamily: TZ.sans, fontSize: 12.5, fontWeight: 600, color: TZ.red }}>
            <Trash2 size={13} /> {t('settings.remove')}
          </button>
        </div>
      )}
    </div>
  )
}

function SecTeam({ t }) {
  const TZ = useTZ()
  const { data, loading, error, reload } = useApi(listTeam, [])
  const team = data?.data ?? []

  const [inviting, setInviting] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', password: '', role: 'operator' })
  const [busy, setBusy] = useState(false)

  const [pwFor, setPwFor] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [pwBusy, setPwBusy] = useState(false)

  async function invite(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await createTeamMember(form)
      setInviting(false)
      setForm({ name: '', phone: '', password: '', role: 'operator' })
      reload()
    } catch (err) {
      alert(err.message || t('settings.inviteError'))
    } finally {
      setBusy(false)
    }
  }

  async function remove(m) {
    if (!confirm(`${m.name} ${t('settings.confirmRemove')}`)) return
    try {
      await removeTeamMember(m.id)
      reload()
    } catch (err) {
      alert(err.message || t('settings.removeError'))
    }
  }

  async function toggleActive(m) {
    try {
      await updateTeamMember(m.id, { is_active: !m.is_active })
      reload()
    } catch (err) {
      alert(err.message || t('settings.updateError'))
    }
  }

  function openChangePassword(m) {
    setPwFor(m)
    setNewPassword('')
  }

  async function changePassword(e) {
    e.preventDefault()
    setPwBusy(true)
    try {
      await updateTeamMember(pwFor.id, { password: newPassword })
      setPwFor(null)
      setNewPassword('')
    } catch (err) {
      alert(err.message || t('settings.changePasswordError'))
    } finally {
      setPwBusy(false)
    }
  }

  if (loading) return <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>{t('common.loading')}</div>
  if (error)   return <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{error.message}</div>

  return (
    <div style={{ maxWidth: 580 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontFamily: TZ.sans, fontSize: 15, fontWeight: 700, color: TZ.ink }}>
          {t('settings.teamTitle')}
          <span style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 600, color: TZ.muted, marginLeft: 6 }}>
            · {team.length}
          </span>
        </div>
        <button type="button" onClick={() => setInviting(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            border: `1px solid ${TZ.navy}`, borderRadius: 8, background: 'transparent',
            fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.navy, cursor: 'pointer' }}>
          <Plus size={13} /> {t('settings.invite')}
        </button>
      </div>

      <Modal open={inviting} onClose={() => setInviting(false)} title={t('settings.inviteTitle')} width={380}
        as="form" onSubmit={invite}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input required placeholder={t('settings.namePlaceholder')} value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${TZ.line}`, fontFamily: TZ.sans, fontSize: 13 }} />
          <input required placeholder={t('settings.phonePlaceholder')} value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${TZ.line}`, fontFamily: TZ.sans, fontSize: 13 }} />
          <input required type="password" placeholder={t('settings.passwordPlaceholder')} value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${TZ.line}`, fontFamily: TZ.sans, fontSize: 13 }} />
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
            style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${TZ.line}`, fontFamily: TZ.sans, fontSize: 13 }}>
            <option value="operator">{t('settings.roleOperator')}</option>
            <option value="admin">{t('settings.roleAdmin')}</option>
          </select>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={() => setInviting(false)}
              style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${TZ.line}`, background: TZ.surface,
                fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.body, cursor: 'pointer' }}>{t('common.close')}</button>
            <button type="submit" disabled={busy}
              style={{ padding: '7px 14px', borderRadius: 8, border: 0, background: TZ.navy, color: '#fff',
                fontFamily: TZ.sans, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{t('settings.add')}</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!pwFor} onClose={() => setPwFor(null)}
        title={pwFor ? `${pwFor.name} — ${t('settings.changePasswordTitle')}` : ''}
        width={360} as="form" onSubmit={changePassword}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input required autoFocus type="password" minLength={6} placeholder={t('settings.newPasswordPlaceholder')}
            value={newPassword} onChange={e => setNewPassword(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${TZ.line}`, fontFamily: TZ.sans, fontSize: 13 }} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={() => setPwFor(null)}
              style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${TZ.line}`, background: TZ.surface,
                fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.body, cursor: 'pointer' }}>{t('common.close')}</button>
            <button type="submit" disabled={pwBusy}
              style={{ padding: '7px 14px', borderRadius: 8, border: 0, background: TZ.navy, color: '#fff',
                fontFamily: TZ.sans, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{t('settings.save')}</button>
          </div>
        </div>
      </Modal>

      <div style={{ border: `1px solid ${TZ.line}`, borderRadius: 12, overflow: 'hidden', background: TZ.surface }}>
        {team.map((m, i) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
            borderBottom: i < team.length - 1 ? `1px solid ${TZ.lineSoft}` : 'none', opacity: m.is_active ? 1 : 0.55 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: TZ.navy,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontFamily: TZ.sans, fontSize: 13, fontWeight: 700 }}>
                {m.name.split(' ').map(s => s[0]).join('')}
              </div>
              <span style={{ position: 'absolute', bottom: -1, right: -1, width: 11, height: 11,
                borderRadius: '50%', border: '2px solid #fff',
                background: m.is_active ? TZ.green : TZ.faint }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: TZ.sans, fontSize: 13.5, fontWeight: 700, color: TZ.ink }}>{m.name}</div>
              <div style={{ fontFamily: TZ.mono, fontSize: 11.5, color: TZ.muted, marginTop: 2 }}>{m.phone}</div>
            </div>
            <span style={{ fontFamily: TZ.sans, fontSize: 11.5, fontWeight: 700, borderRadius: 10, padding: '3px 11px',
              color: m.role === 'admin' ? TZ.orange : TZ.navy,
              background: m.role === 'admin' ? TZ.orangeSoft : TZ.navySoft }}>
              {m.role === 'admin' ? t('settings.roleAdmin') : t('settings.roleOperator')}
            </span>
            <button type="button" onClick={() => toggleActive(m)}
              style={{ background: 'none', border: `1px solid ${TZ.line}`, borderRadius: 7, cursor: 'pointer',
                color: TZ.body, padding: '4px 8px', fontFamily: TZ.sans, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
              {m.is_active ? t('settings.deactivate') : t('settings.activate')}
            </button>
            <RowMenu t={t} onChangePassword={() => openChangePassword(m)} onRemove={() => remove(m)} />
          </div>
        ))}
      </div>
    </div>
  )
}

function SecNotif({ t }) {
  const TZ = useTZ()
  const { data, loading, error, reload } = useApi(getNotifPrefs, [])
  const prefs = data?.result

  const [rows, setRows] = useState(null)
  const [quietEnabled, setQuietEnabled] = useState(true)
  const [quietStart, setQuietStart] = useState('22:00')
  const [quietEnd, setQuietEnd] = useState('07:00')

  useEffect(() => {
    if (prefs && !rows) {
      setRows(prefs.rows)
      setQuietEnabled(prefs.quiet_hours_enabled)
      setQuietStart((prefs.quiet_hours_start ?? '22:00:00').slice(0, 5))
      setQuietEnd((prefs.quiet_hours_end ?? '07:00:00').slice(0, 5))
    }
  }, [prefs])

  async function persist(patch) {
    try {
      await updateNotifPrefs({
        rows: patch.rows ?? rows,
        quiet_hours_enabled: patch.quiet_hours_enabled ?? quietEnabled,
        quiet_hours_start: quietStart,
        quiet_hours_end: quietEnd,
      })
      reload()
    } catch (err) {
      alert(err.message || t('settings.updateError'))
    }
  }

  function tog(i, k) {
    const next = rows.map((r, idx) => idx === i ? { ...r, [k]: !r[k] } : r)
    setRows(next)
    persist({ rows: next })
  }

  function toggleQuiet(v) {
    setQuietEnabled(v)
    persist({ quiet_hours_enabled: v })
  }

  if (loading || !rows) return <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>{t('common.loading')}</div>
  if (error) return <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{error.message}</div>

  return (
    <div style={{ maxWidth: 580 }}>
      <SectionHead>{t('settings.eventsHead')}</SectionHead>
      <div style={{ border: `1px solid ${TZ.line}`, borderRadius: 12, overflow: 'hidden', background: TZ.surface }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px',
          padding: '10px 16px', background: TZ.surface2, borderBottom: `1px solid ${TZ.line}` }}>
          {[t('settings.colEvent'), t('settings.colPush'), t('settings.colSms'), t('settings.colEmail')].map((h, i) => (
            <span key={h} style={{ fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700, color: TZ.muted,
              textTransform: 'uppercase', letterSpacing: 0.5, textAlign: i > 0 ? 'center' : 'left' }}>{h}</span>
          ))}
        </div>
        {rows.map((r, i) => (
          <div key={r.key ?? i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px',
            alignItems: 'center', padding: '13px 16px',
            borderBottom: i < rows.length - 1 ? `1px solid ${TZ.lineSoft}` : 'none' }}>
            <span style={{ fontFamily: TZ.sans, fontSize: 13.5, fontWeight: 600, color: TZ.ink }}>
              {t(EVENT_LABEL_KEYS[r.key] ?? 'settings.eventNewOrder')}
            </span>
            {['push','sms','email'].map(k => (
              <div key={k} style={{ display: 'flex', justifyContent: 'center' }}>
                <Toggle on={r[k]} onChange={() => tog(i, k)} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <SectionHead>{t('settings.quietHoursHead')}</SectionHead>
      <Row label={t('settings.quietHours')} hint={t('settings.quietHoursHint')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Toggle on={quietEnabled} onChange={toggleQuiet} />
          <span style={{ fontFamily: TZ.mono, fontSize: 13, color: TZ.ink, padding: '8px 12px',
            border: `1px solid ${TZ.line}`, borderRadius: 8, background: TZ.surface }}>
            {quietStart} — {quietEnd}
          </span>
        </div>
      </Row>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function SettingsPage({ shell }) {
  const TZ = useTZ()
  const t = useT()
  const [active, setActive] = useState('company')

  const { data: settingsData, loading: settingsLoading, error: settingsError, reload: reloadSettings } =
    useApi(getSettings, [])
  const settings = settingsData?.result

  const SECTIONS = [
    { id: 'company', label: t('settings.secCompany'), Icon: Truck    },
    { id: 'locale',  label: t('settings.secLocale'),  Icon: Globe    },
    { id: 'pricing', label: t('settings.secPricing'), Icon: Banknote },
    { id: 'team',    label: t('settings.secTeam'),    Icon: Users    },
    { id: 'notif',   label: t('settings.secNotif'),   Icon: Bell     },
  ]

  const sectionProps = { t, settings, settingsLoading, settingsError, reloadSettings }

  return (
    <AdminShell {...shell}
      active="settings"
      title={t('settings.title')}
      subtitle={SECTIONS.find(s => s.id === active)?.label}
    >
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

        {/* Sub-nav */}
        <div style={{ width: 208, flexShrink: 0, borderRight: `1px solid ${TZ.line}`,
          background: TZ.surface, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {SECTIONS.map(s => {
            const on = s.id === active
            return (
              <button key={s.id} onClick={() => setActive(s.id)} type="button"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                  fontFamily: TZ.sans, fontSize: 13.5, fontWeight: on ? 600 : 500,
                  border: 0, textAlign: 'left', width: '100%',
                  background: on ? TZ.navyTint : 'transparent',
                  color: on ? TZ.navy : TZ.body,
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => { if (!on) e.currentTarget.style.background = TZ.surface2 }}
                onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent' }}>
                <s.Icon size={16} color={on ? TZ.navy : TZ.muted}
                  strokeWidth={on ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                {s.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '24px 32px' }}>
          {active === 'company' && <SecCompany {...sectionProps} />}
          {active === 'locale'  && <SecLocale  {...sectionProps} />}
          {active === 'pricing' && <SecPricing t={t} />}
          {active === 'team'    && <SecTeam t={t} />}
          {active === 'notif'   && <SecNotif t={t} />}
        </div>
      </div>
    </AdminShell>
  )
}
