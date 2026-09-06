import { useState } from 'react'
import { Check } from 'lucide-react'
import { usePageHeader } from '../components/shell/AdminShell.jsx'
import { useTZ } from '../design/tokens.js'
import { updateProfile } from '../api/auth.js'
import { useT } from '../i18n/useT.js'

function Row({ label, hint, children }) {
  const TZ = useTZ()
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, padding: '16px 0',
      borderBottom: `1px solid ${TZ.lineSoft}` }}>
      <div style={{ width: 200, flexShrink: 0 }}>
        <div style={{ fontFamily: TZ.sans, fontSize: 13.5, fontWeight: 600, color: TZ.ink }}>{label}</div>
        {hint && <div style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.muted, marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

function Field({ value, onChange, width = 300, type = 'text', placeholder, disabled }) {
  const TZ = useTZ()
  return (
    <input value={value ?? ''} type={type} placeholder={placeholder} disabled={disabled}
      onChange={e => onChange?.(e.target.value)}
      style={{ width, padding: '8px 12px', borderRadius: 8, border: `1px solid ${TZ.line}`,
        fontFamily: TZ.sans, fontSize: 13, color: disabled ? TZ.muted : TZ.ink,
        background: disabled ? TZ.surface2 : TZ.surface, outline: 'none', boxSizing: 'border-box' }} />
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
      {t('profile.saved')}
    </span>
  )
}

function SaveBtn({ onClick, disabled, children }) {
  const TZ = useTZ()
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
        border: 0, background: TZ.navy, color: '#fff', fontFamily: TZ.sans, fontSize: 12.5,
        fontWeight: 700, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.7 : 1 }}>
      <Check size={13} /> {children}
    </button>
  )
}

function AccountInfo({ t, user, onUserUpdate }) {
  const TZ = useTZ()
  const [form, setForm] = useState({ name: user?.name ?? '', phone: user?.phone ?? '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const updated = await updateProfile({ name: form.name, phone: form.phone })
      onUserUpdate?.(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert(err.message || t('profile.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 580 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <SectionHead>{t('profile.accountInfoHead')}</SectionHead>
        {saved && <SavedBadge t={t} />}
      </div>
      <Row label={t('profile.name')}>
        <Field value={form.name} onChange={v => setForm({ ...form, name: v })} />
      </Row>
      <Row label={t('profile.phone')}>
        <Field value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
      </Row>
      <Row label={t('profile.role')}>
        <span style={{ fontFamily: TZ.sans, fontSize: 11.5, fontWeight: 700, borderRadius: 10, padding: '3px 11px',
          color: user?.role === 'admin' ? TZ.orange : TZ.navy,
          background: user?.role === 'admin' ? TZ.orangeSoft : TZ.navySoft }}>
          {user?.role === 'admin' ? t('settings.roleAdmin') : t('settings.roleOperator')}
        </span>
      </Row>
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <SaveBtn onClick={save} disabled={saving}>{t('profile.save')}</SaveBtn>
      </div>
    </div>
  )
}

function ChangePassword({ t }) {
  const TZ = useTZ()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    if (form.newPassword !== form.confirmPassword) {
      alert(t('profile.passwordMismatch'))
      return
    }
    setSaving(true)
    try {
      await updateProfile({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert(err.message || t('profile.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 580 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <SectionHead>{t('profile.changePasswordHead')}</SectionHead>
        {saved && <SavedBadge t={t} />}
      </div>
      <Row label={t('profile.currentPassword')}>
        <Field type="password" value={form.currentPassword} onChange={v => setForm({ ...form, currentPassword: v })} />
      </Row>
      <Row label={t('profile.newPassword')}>
        <Field type="password" value={form.newPassword} onChange={v => setForm({ ...form, newPassword: v })} />
      </Row>
      <Row label={t('profile.confirmPassword')}>
        <Field type="password" value={form.confirmPassword} onChange={v => setForm({ ...form, confirmPassword: v })} />
      </Row>
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <SaveBtn onClick={save} disabled={saving || !form.newPassword}>{t('profile.save')}</SaveBtn>
      </div>
    </div>
  )
}

export default function ProfilePage({ shell }) {
  const TZ = useTZ()
  const t = useT()
  const { user, onUserUpdate } = shell

  usePageHeader({ title: t('profile.title') })

  return (
    <>
      <div style={{ height: '100%', overflowY: 'auto', padding: '24px 32px' }}>
        <AccountInfo t={t} user={user} onUserUpdate={onUserUpdate} />
        <div style={{ height: 1, background: TZ.line, maxWidth: 580, margin: '24px 0' }} />
        <ChangePassword t={t} />
      </div>
    </>
  )
}
