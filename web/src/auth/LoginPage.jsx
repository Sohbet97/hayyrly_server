import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Eye, EyeOff } from 'lucide-react'
import { useTZ } from '../design/tokens.js'
import hayyrlyLogo from '../assets/hayyrly-logo.png'
import { login } from '../api/auth.js'
import { useT } from '../i18n/useT.js'
import { setLang } from '../store/uiSlice.js'

export default function LoginPage({ onLogin }) {
  const lang = useSelector(state => state.ui.lang)
  const TZ = useTZ()
  const dispatch = useDispatch()
  const t = useT()
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [busy,     setBusy]     = useState(false)
  const [focused,  setFocused]  = useState(null)

  async function submit(e) {
    e.preventDefault()
    if (!phone || !password) { setError(t('login.validationError')); return }
    setError('')
    setBusy(true)
    try {
      const user = await login(`+993${phone}`, password)
      onLogin(user)
    } catch (err) {
      setError(err.message || t('login.loginError'))
    } finally {
      setBusy(false)
    }
  }

  const fieldStyle = (name) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '0 14px', height: 46, borderRadius: 10,
    border: `1.5px solid ${focused === name ? TZ.navy : TZ.line}`,
    background: focused === name ? TZ.navyTint : TZ.surface,
    transition: 'border-color 0.15s, background 0.15s',
  })

  return (
    <div style={{ minHeight: '100%', display: 'flex', fontFamily: TZ.sans }}>

      {/* ── Left brand panel ── */}
      <div style={{ width: 480, flexShrink: 0, background: TZ.navy, position: 'relative',
        display: 'flex', flexDirection: 'column', padding: '52px 48px', overflow: 'hidden' }}>

        {/* Decorative circles */}
        {[520, 380, 240].map((r, i) => (
          <div key={i} style={{ position: 'absolute', borderRadius: '50%',
            width: r, height: r, border: '1px solid rgba(255,255,255,0.07)',
            right: -r / 2.2, bottom: -r / 3.5 }} />
        ))}
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(242,107,31,0.07)', top: -80, left: -60 }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
          <img src={hayyrlyLogo} alt="Hayyrly"
            style={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0 }} />
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 22, letterSpacing: -0.6, lineHeight: 1 }}>
              Hayyrly
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600,
              letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 3 }}>Admin Panel</div>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 36,
            letterSpacing: -1.2, lineHeight: 1.15, marginBottom: 14 }}>
            {t('login.heroLine1')}<br />{t('login.heroLine2')}<br />{t('login.heroLine3')}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6, maxWidth: 320 }}>
            {t('login.heroSub')}
          </div>
        </div>

        {/* Bottom stats */}
        <div style={{ display: 'flex', gap: 24, position: 'relative', zIndex: 1 }}>
          {[
            { v: '7', l: t('login.statDrivers') },
            { v: '4', l: t('login.statCities') },
            { v: '24/7', l: t('login.statSupport') },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>{s.v}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600,
                letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 40, background: TZ.surface }}>

        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Heading */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <h1 style={{ fontFamily: TZ.sans, fontWeight: 800, fontSize: 26,
                color: TZ.ink, letterSpacing: -0.7, margin: 0 }}>{t('login.heading')}</h1>
              <p style={{ fontFamily: TZ.sans, fontSize: 14, color: TZ.muted, marginTop: 6 }}>
                {t('login.subheading')}
              </p>
            </div>
            <div style={{ display: 'flex', background: TZ.surface2, borderRadius: 8, padding: 3, flexShrink: 0 }}>
              {['tk', 'ru'].map(l => (
                <button key={l} onClick={() => dispatch(setLang(l))} type="button"
                  style={{ border: 0, padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
                    fontFamily: TZ.sans, fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                    background: lang === l ? TZ.surface : 'transparent',
                    color: lang === l ? TZ.ink : TZ.muted,
                    boxShadow: lang === l ? '0 1px 2px rgba(0,0,0,0.06)' : 'none' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: TZ.redSoft,
                color: TZ.red, fontFamily: TZ.sans, fontSize: 13, fontWeight: 600 }}>
                {error}
              </div>
            )}

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontFamily: TZ.sans, fontSize: 12, fontWeight: 700,
                color: TZ.body, marginBottom: 6, letterSpacing: 0.2 }}>{t('login.phoneLabel')}</label>
              <div style={fieldStyle('phone')}>
                <span style={{ fontFamily: TZ.mono, fontSize: 13, fontWeight: 700,
                  color: TZ.muted, paddingRight: 10, borderRight: `1.5px solid ${TZ.line}`,
                  whiteSpace: 'nowrap' }}>+993</span>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)}
                  placeholder="65 XX-XX-XX"
                  style={{ flex: 1, border: 0, outline: 'none', background: 'transparent',
                    fontFamily: TZ.sans, fontSize: 14, color: TZ.ink }} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontFamily: TZ.sans, fontSize: 12, fontWeight: 700,
                color: TZ.body, marginBottom: 6, letterSpacing: 0.2 }}>{t('login.passwordLabel')}</label>
              <div style={fieldStyle('password')}>
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                  placeholder="••••••••"
                  style={{ flex: 1, border: 0, outline: 'none', background: 'transparent',
                    fontFamily: TZ.sans, fontSize: 14, color: TZ.ink }} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer',
                    color: TZ.muted, display: 'flex', lineHeight: 0 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={busy}
              style={{ height: 48, width: '100%', borderRadius: 10, border: 0,
                background: TZ.navy, color: '#fff', fontFamily: TZ.sans,
                fontSize: 15, fontWeight: 700, cursor: busy ? 'default' : 'pointer', marginTop: 4,
                opacity: busy ? 0.7 : 1,
                transition: 'background 0.15s', letterSpacing: -0.2 }}
              onMouseEnter={e => { if (!busy) e.currentTarget.style.background = TZ.navyDk }}
              onMouseLeave={e => { if (!busy) e.currentTarget.style.background = TZ.navy }}>
              {busy ? t('login.submitting') : t('login.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
