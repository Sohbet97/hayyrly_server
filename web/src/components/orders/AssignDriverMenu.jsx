import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { useTZ } from '../../design/tokens.js'

// Popover trigger used wherever an order has no driver yet — click it to
// search the active driver list and assign one without leaving the page.
export function AssignDriverMenu({ drivers, onSelect, busy, label, searchPlaceholder, emptyLabel,
  iconSize = 10, fontSize = 11.5 }) {
  const TZ = useTZ()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const filtered = drivers.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()))

  function pick(d) {
    setOpen(false)
    setSearch('')
    onSelect(d.id)
  }

  return (
    <div ref={ref} onClick={e => e.stopPropagation()} style={{ position: 'relative', display: 'inline-flex', flex: 1, minWidth: 0 }}>
      <button type="button" disabled={busy} onClick={() => setOpen(o => !o)}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 3, border: 0, background: 'transparent',
          padding: 0, cursor: busy ? 'default' : 'pointer', textAlign: 'left',
          fontFamily: TZ.sans, fontSize, fontWeight: 600, color: TZ.orange, opacity: busy ? 0.6 : 1,
        }}>
        <Plus size={iconSize} /> {label}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4, width: 210, zIndex: 1000,
          background: TZ.surface, border: `1px solid ${TZ.line}`, borderRadius: 10,
          boxShadow: '0 6px 20px rgba(0,0,0,0.16)', overflow: 'hidden',
        }}>
          <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            style={{
              width: '100%', border: 0, borderBottom: `1px solid ${TZ.lineSoft}`, outline: 'none',
              padding: '8px 10px', fontFamily: TZ.sans, fontSize: 12, color: TZ.ink,
              background: 'transparent', boxSizing: 'border-box',
            }} />
          <div style={{ maxHeight: 190, overflowY: 'auto' }}>
            {filtered.map(d => (
              <div key={d.id} onClick={() => pick(d)}
                style={{
                  padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 7,
                  cursor: 'pointer', fontFamily: TZ.sans, fontSize: 12.5, color: TZ.ink,
                }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: d.online ? TZ.green : TZ.faint,
                }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.name}
                </span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '10px', textAlign: 'center', fontFamily: TZ.sans, fontSize: 11.5, color: TZ.faint }}>
                {emptyLabel}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
