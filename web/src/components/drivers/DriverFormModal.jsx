import { useState, useEffect } from 'react'
import { X, Camera } from 'lucide-react'
import { useTZ } from '../../design/tokens.js'
import { useT } from '../../i18n/useT.js'

// Coalesce every field to a string so callers can pass `null`/`undefined` for
// unset driver fields (as the API returns them) without breaking controlled
// inputs or the `.trim()` calls in submit(). `park` is boolean ("belongs to a
// taxi park/fleet"), so it defaults to false rather than ''.
function normalizeForm(values = {}) {
  return {
    firstName: values.firstName ?? '',
    lastName: values.lastName ?? '',
    phone: values.phone ?? '',
    birthday: values.birthday ?? '',
    cityId: values.cityId ?? '',
    park: values.park ?? false,
    autoNumber: values.autoNumber ?? '',
    markaId: values.markaId ?? '',
    modelId: values.modelId ?? '',
    autoYear: values.autoYear ?? '',
  }
}

export function DriverFormModal({
  title, submitLabel, initialValues, initialAvatarUrl, initialCarImageUrl,
  cities, markas, onClose, onSave, errorFallback,
}) {
  const TZ = useTZ()
  const t = useT()
  const [form, setForm] = useState(() => normalizeForm(initialValues))
  const [files, setFiles] = useState({ avatar: null, carImage: null })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const modelsForMarka = markas.find(m => String(m.id) === String(form.markaId))?.models ?? []

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      // Files ride along in the same multipart request as the fields (see
      // api/drivers.js) — a picked file always wins; otherwise the backend
      // leaves the driver's existing photo untouched.
      await onSave({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        birthday: form.birthday,
        cityId: parseInt(form.cityId, 10),
        park: form.park,
        autoNumber: form.autoNumber.trim(),
        markaId: parseInt(form.markaId, 10),
        modelId: parseInt(form.modelId, 10),
        autoYear: parseInt(form.autoYear, 10),
      }, files)
    } catch (err) {
      setError(err.message || errorFallback || t('drivers.addError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <form onSubmit={submit} style={{ background: TZ.surface, borderRadius: 16, padding: 28,
        width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontFamily: TZ.sans, fontSize: 18, fontWeight: 800, color: TZ.ink, margin: 0 }}>{title}</h3>
          <button onClick={onClose} type="button"
            style={{ background: 'none', border: 0, cursor: 'pointer', color: TZ.faint, padding: 2 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <input required placeholder={t('drivers.firstNamePlaceholder')} value={form.firstName}
            onChange={e => setForm({ ...form, firstName: e.target.value })} style={inputStyle(TZ)} />
          <input required placeholder={t('drivers.lastNamePlaceholder')} value={form.lastName}
            onChange={e => setForm({ ...form, lastName: e.target.value })} style={inputStyle(TZ)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <input required placeholder={t('drivers.phonePlaceholder')} value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle(TZ)} />
          <input required type="date" title={t('drivers.birthdayPlaceholder')} value={form.birthday}
            onChange={e => setForm({ ...form, birthday: e.target.value })} style={inputStyle(TZ)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <select required value={form.cityId} onChange={e => setForm({ ...form, cityId: e.target.value })} style={inputStyle(TZ)}>
            <option value="">{t('drivers.cityPlaceholder')}</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name_tm}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
            borderRadius: 10, border: `1.5px solid ${TZ.line}`, background: TZ.surface2, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.park}
              onChange={e => setForm({ ...form, park: e.target.checked })} />
            <span style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.ink }}>{t('drivers.parkLabel')}</span>
          </label>
        </div>

        <input required placeholder={t('drivers.autoNumberPlaceholder')} value={form.autoNumber}
          onChange={e => setForm({ ...form, autoNumber: e.target.value })}
          style={{ ...inputStyle(TZ), width: '100%', marginBottom: 10, boxSizing: 'border-box' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
          <select required value={form.markaId}
            onChange={e => setForm({ ...form, markaId: e.target.value, modelId: '' })} style={inputStyle(TZ)}>
            <option value="">{t('drivers.markaPlaceholder')}</option>
            {markas.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select required value={form.modelId} disabled={!form.markaId}
            onChange={e => setForm({ ...form, modelId: e.target.value })} style={inputStyle(TZ)}>
            <option value="">{t('drivers.modelPlaceholder')}</option>
            {modelsForMarka.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <input required type="number" placeholder={t('drivers.yearPlaceholder')} value={form.autoYear}
            onChange={e => setForm({ ...form, autoYear: e.target.value })} style={inputStyle(TZ)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <FilePickerField TZ={TZ} label={t('drivers.avatarPlaceholder')} file={files.avatar} currentUrl={initialAvatarUrl}
            onChange={file => setFiles({ ...files, avatar: file })} />
          <FilePickerField TZ={TZ} label={t('drivers.carImagePlaceholder')} file={files.carImage} currentUrl={initialCarImageUrl}
            onChange={file => setFiles({ ...files, carImage: file })} />
        </div>

        {error && (
          <div style={{ fontFamily: TZ.sans, fontSize: 12.5, color: TZ.red, marginBottom: 8 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={onClose} type="button"
            style={{ padding: '9px 18px', borderRadius: 9, border: `1px solid ${TZ.line}`,
              background: TZ.surface, fontFamily: TZ.sans, fontSize: 13, fontWeight: 600,
              color: TZ.body, cursor: 'pointer' }}>{t('common.close')}</button>
          <button type="submit" disabled={saving}
            style={{ padding: '9px 18px', borderRadius: 9, border: 0,
              background: TZ.navy, color: '#fff', fontFamily: TZ.sans,
              fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}

function FilePickerField({ TZ, label, file, currentUrl, onChange }) {
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const thumbUrl = previewUrl ?? currentUrl

  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
      borderRadius: 10, border: `1.5px dashed ${TZ.line}`, background: TZ.surface2, cursor: 'pointer' }}>
      <input type="file" accept="image/*" onChange={e => onChange(e.target.files?.[0] ?? null)}
        style={{ display: 'none' }} />
      {thumbUrl ? (
        <img src={thumbUrl} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 32, height: 32, borderRadius: 8, background: TZ.surface3, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: TZ.faint }}>
          <Camera size={15} />
        </div>
      )}
      <span style={{ fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: file ? TZ.ink : TZ.muted,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {file ? file.name : label}
      </span>
    </label>
  )
}

function inputStyle(TZ) {
  return { padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${TZ.line}`,
    background: TZ.surface2, fontFamily: TZ.sans, fontSize: 13, color: TZ.ink, outline: 'none' }
}
