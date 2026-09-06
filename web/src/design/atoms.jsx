import { useSelector } from 'react-redux'
import { STATUS } from './tokens.js'

// ── Logo ──────────────────────────────────────────────────────────────────────
import hayyrlyLogoSrc from '../assets/hayyrly-logo.png'

export function HayyrlyLogo({ size = 40 }) {
  return (
    <img src={hayyrlyLogoSrc} alt="Hayyrly"
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />
  )
}

export function HayyrlyLockup({ size = 40 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.35 }}>
      <img src={hayyrlyLogoSrc} alt="Hayyrly"
        style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />
      <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800,
        fontSize: size * 0.78, letterSpacing: -size * 0.04, color: '#0E2A4D', lineHeight: 1 }}>
        Hayyrly
      </span>
    </div>
  )
}

// ── Status Pill ───────────────────────────────────────────────────────────────
const PILL_CLS = {
  pending:   { wrap: 'bg-surface-3 text-muted',       dot: 'bg-muted'   },
  created:   { wrap: 'bg-surface-3 text-muted',       dot: 'bg-muted'   },
  accepted:  { wrap: 'bg-violet-soft text-violet',    dot: 'bg-violet'  },
  arrived:   { wrap: 'bg-amber-soft text-amber',      dot: 'bg-amber'   },
  on_way:    { wrap: 'bg-navy-soft text-navy',        dot: 'bg-navy'    },
  completed: { wrap: 'bg-green-soft text-green',      dot: 'bg-green'   },
  cancelled:           { wrap: 'bg-red-soft text-red', dot: 'bg-red'    },
  cancelled_by_user:   { wrap: 'bg-red-soft text-red', dot: 'bg-red'    },
  cancelled_by_driver: { wrap: 'bg-red-soft text-red', dot: 'bg-red'    },
  online:    { wrap: 'bg-green-soft text-green',      dot: 'bg-green'   },
  busy:      { wrap: 'bg-amber-soft text-amber',      dot: 'bg-amber'   },
  offline:   { wrap: 'bg-surface-3 text-faint',       dot: 'bg-faint'   },
  paid:      { wrap: 'bg-green-soft text-green',      dot: 'bg-green'   },
  refunded:  { wrap: 'bg-red-soft text-red',          dot: 'bg-red'     },
  approved:  { wrap: 'bg-green-soft text-green',      dot: 'bg-green'   },
  confirmed: { wrap: 'bg-green-soft text-green',      dot: 'bg-green'   },
  rejected:  { wrap: 'bg-red-soft text-red',          dot: 'bg-red'     },
  open:          { wrap: 'bg-red-soft text-red',      dot: 'bg-red'     },
  acknowledged:  { wrap: 'bg-amber-soft text-amber',  dot: 'bg-amber'   },
  resolved:      { wrap: 'bg-green-soft text-green',  dot: 'bg-green'   },
}

export function StatusPill({ status, size = 'md' }) {
  const lang = useSelector(state => state.ui.lang)
  const s  = STATUS[status] || STATUS.pending
  const c  = PILL_CLS[status] || PILL_CLS.pending
  const px = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold ${px} ${c.wrap}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {s[lang] ?? s.tk}
    </span>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange?.(!on)} type="button"
      className={`relative w-10 h-5 rounded-full transition-colors border-0 outline-none shrink-0
        ${on ? 'bg-navy' : 'bg-faint'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
        ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

// ── Segmented ─────────────────────────────────────────────────────────────────
export function Segmented({ options, active = 0, onChange }) {
  return (
    <div className="flex bg-surface-2 border border-line rounded-lg p-0.5">
      {options.map((o, i) => (
        <button key={i} onClick={() => onChange?.(i)} type="button"
          className={`px-3 py-1.5 rounded-md text-xs font-semibold border-0 transition-all
            ${i === active ? 'bg-surface text-ink shadow-sm' : 'bg-transparent text-muted hover:text-body'}`}>
          {o}
        </button>
      ))}
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ name = '', size = 32, color = '#0E2A4D', src = null }) {
  if (src) {
    return (
      <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0,
        objectFit: 'cover' }} />
    )
  }
  const initials = name.split(' ').map(s => s[0] || '').join('').slice(0, 2).toUpperCase()
  return (
    <div style={{ width: size, height: size, background: color, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.36 }}>
      {initials}
    </div>
  )
}

// ── GhostBtn ──────────────────────────────────────────────────────────────────
export function GhostBtn({ icon: Icon, label, accent = false, onClick, danger = false }) {
  const cls = danger ? 'border-red-soft text-red hover:bg-red-soft'
            : accent ? 'border-navy text-navy hover:bg-navy-soft'
            :          'border-line text-body hover:bg-surface-2'
  return (
    <button onClick={onClick} type="button"
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${cls}`}>
      {Icon && <Icon size={14} />}
      {label}
    </button>
  )
}

// ── Btn ───────────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'primary', size = 'md', icon: Icon, full = false }) {
  const v = {
    primary:   'bg-navy text-white hover:bg-navy-dk border-transparent',
    secondary: 'bg-surface text-body border-line hover:bg-surface-2',
    danger:    'bg-red text-white border-transparent hover:opacity-90',
    ghost:     'bg-transparent text-body border-line hover:bg-surface-2',
  }[variant] || 'bg-navy text-white border-transparent'
  const s = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
  return (
    <button onClick={onClick} type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg border font-semibold transition-colors
        ${v} ${s} ${full ? 'w-full' : ''}`}>
      {Icon && <Icon size={14} />}
      {children}
    </button>
  )
}

// ── SettingsRow ───────────────────────────────────────────────────────────────
export function SettingsRow({ label, hint, children }) {
  return (
    <div className="flex items-start gap-8 py-4 border-b border-line-soft last:border-b-0">
      <div className="w-52 shrink-0">
        <div className="text-sm font-semibold text-ink">{label}</div>
        {hint && <div className="text-xs text-muted mt-0.5">{hint}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

// ── TextField ─────────────────────────────────────────────────────────────────
export function TextField({ value, prefix, suffix, width = 320, onChange, type = 'text', placeholder }) {
  return (
    <div className="flex items-center bg-surface border border-line rounded-lg overflow-hidden" style={{ width }}>
      {prefix && <span className="px-3 py-2 text-xs font-bold text-muted bg-surface-2 border-r border-line whitespace-nowrap">{prefix}</span>}
      <input type={type} defaultValue={value} onChange={onChange} placeholder={placeholder}
        className="flex-1 px-3 py-2 text-sm text-ink outline-none bg-transparent min-w-0" />
      {suffix && <span className="px-3 py-2 text-xs font-bold text-muted bg-surface-2 border-l border-line whitespace-nowrap">{suffix}</span>}
    </div>
  )
}

// ── SectionLabel ──────────────────────────────────────────────────────────────
export function SectionLabel({ children }) {
  return (
    <div className="text-[10px] font-bold text-muted uppercase tracking-widest mt-6 mb-2 first:mt-0">
      {children}
    </div>
  )
}
