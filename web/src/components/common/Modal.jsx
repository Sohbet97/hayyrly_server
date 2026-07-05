import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useTZ } from '../../design/tokens.js'

// Shared overlay + card shell for modal dialogs — matches the inline modal
// pattern used across DriversPage/SettingsPage before it was extracted here.
export function Modal({ open, onClose, title, subtitle, width = 380, children, as: As = 'div', ...formProps }) {
  const TZ = useTZ()

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <As onClick={e => e.stopPropagation()} {...formProps} style={{ background: TZ.surface, borderRadius: 16, padding: 24,
        width: '100%', maxWidth: width, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
        {(title || onClose) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: subtitle ? 4 : 16 }}>
            <h3 style={{ fontFamily: TZ.sans, fontSize: 16, fontWeight: 800, color: TZ.ink, margin: 0 }}>{title}</h3>
            <button onClick={onClose} type="button"
              style={{ background: 'none', border: 0, cursor: 'pointer', color: TZ.faint, padding: 2 }}>
              <X size={18} />
            </button>
          </div>
        )}
        {subtitle && (
          <p style={{ fontFamily: TZ.sans, fontSize: 12.5, color: TZ.muted, margin: '0 0 16px' }}>{subtitle}</p>
        )}
        {children}
      </As>
    </div>
  )
}
