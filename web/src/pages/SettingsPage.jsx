import { useState } from 'react'
import { Truck, Globe, Banknote, Users, Bell, Check, Plus, MoreHorizontal, X } from 'lucide-react'
import { AdminShell } from '../components/shell/AdminShell.jsx'
import { TZ } from '../design/tokens.js'
import { useApi } from '../api/useApi.js'
import { listPricing, updatePricing } from '../api/pricing.js'
import { listTeam, createTeamMember, updateTeamMember, removeTeamMember } from '../api/team.js'

const SECTIONS = [
  { id: 'company', label: 'Kompaniýa',      Icon: Truck    },
  { id: 'locale',  label: 'Dil we format',  Icon: Globe    },
  { id: 'pricing', label: 'Nyrh sazlamasy', Icon: Banknote },
  { id: 'team',    label: 'Topar we rollar', Icon: Users   },
  { id: 'notif',   label: 'Habarnamalar',   Icon: Bell     },
]

// ── Atoms ──────────────────────────────────────────────────────────────────

function Label({ children, hint }) {
  return (
    <div style={{ width: 200, flexShrink: 0 }}>
      <div style={{ fontFamily: TZ.sans, fontSize: 13.5, fontWeight: 600, color: TZ.ink }}>{children}</div>
      {hint && <div style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.muted, marginTop: 2 }}>{hint}</div>}
    </div>
  )
}

function Row({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, padding: '16px 0',
      borderBottom: `1px solid ${TZ.lineSoft}` }}>
      <Label hint={hint}>{label}</Label>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

function Field({ value, prefix, suffix, width = 300, type = 'text', placeholder }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${TZ.line}`,
      borderRadius: 8, overflow: 'hidden', width, background: TZ.surface }}>
      {prefix && (
        <span style={{ padding: '8px 12px', fontFamily: TZ.sans, fontSize: 12, fontWeight: 700,
          color: TZ.muted, background: TZ.surface2, borderRight: `1px solid ${TZ.line}`, whiteSpace: 'nowrap' }}>
          {prefix}
        </span>
      )}
      <input defaultValue={value} type={type} placeholder={placeholder}
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
  return (
    <div style={{ fontFamily: TZ.sans, fontSize: 10, fontWeight: 700, color: TZ.faint,
      textTransform: 'uppercase', letterSpacing: 1.2, margin: '20px 0 4px' }}>
      {children}
    </div>
  )
}

// ── Section bodies ─────────────────────────────────────────────────────────

function SecCompany() {
  return (
    <div style={{ maxWidth: 580 }}>
      <SectionHead>Kompaniýa maglumaty</SectionHead>
      <Row label="Kompaniýa ady" hint="Müşderilere SMS-de görkezilýär">
        <Field value="Hayyrly Taxi" />
      </Row>
      <Row label="Goldaw telefony">
        <Field value="65 80-12-00" prefix="+993" />
      </Row>
      <Row label="Wagt guşaklygy">
        <Field value="(GMT+5) Aşgabat" suffix="ASHT" width={280} />
      </Row>
    </div>
  )
}

function SecLocale() {
  const [lang, setLang] = useState(0)
  const [curr, setCurr] = useState(0)
  const [dist, setDist] = useState(0)
  const [date, setDate] = useState(0)
  return (
    <div style={{ maxWidth: 580 }}>
      <SectionHead>Interfeýs dili</SectionHead>
      <Row label="Esasy dil">
        <Segmented options={['Türkmen', 'Русский']} active={lang} onChange={setLang} />
      </Row>
      <SectionHead>Formatlar</SectionHead>
      <Row label="Pul birligi">
        <Segmented options={['TMT (manat)', 'USD']} active={curr} onChange={setCurr} />
      </Row>
      <Row label="Aralyk birligi">
        <Segmented options={['Kilometr', 'Mil']} active={dist} onChange={setDist} />
      </Row>
      <Row label="Sene formaty">
        <Segmented options={['GG.AA.ÝÝÝÝ', 'ÝÝÝÝ-AA-GG']} active={date} onChange={setDate} />
      </Row>
    </div>
  )
}

function SecPricing() {
  const { data, loading, error, reload } = useApi(listPricing, [])
  const prices = data?.data ?? []

  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState({})
  const [saved,   setSaved]   = useState(null)
  const [saving,  setSaving]  = useState(false)

  function startEdit(p) {
    setEditing(p.city_id)
    setForm({
      base_price: Number(p.base_price),
      price_per_km: Number(p.price_per_km),
      free_wait_min: Number(p.free_wait_min),
      wait_price_min: Number(p.wait_price_min),
    })
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
      alert(err.message || 'Saklama şowsuz boldy')
    } finally {
      setSaving(false)
    }
  }

  const FIELDS = [
    { k: 'base_price',     l: 'Başlangyç nyrh',  unit: 'TMT' },
    { k: 'price_per_km',   l: '1 km nyrhy',       unit: 'TMT' },
    { k: 'free_wait_min',  l: 'Mugt garaşma',     unit: 'min' },
    { k: 'wait_price_min', l: 'Garaşma / min',    unit: 'TMT' },
  ]

  if (loading) return <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>Ýüklenýär…</div>
  if (error)   return <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{error.message}</div>

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: TZ.sans, fontSize: 15, fontWeight: 700, color: TZ.ink }}>Nyrh sazlamasy</div>
          <div style={{ fontFamily: TZ.sans, fontSize: 12, color: TZ.muted, marginTop: 2 }}>Şäherler boýunça nyrh düzgünnamasy</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {prices.map(p => {
          const basePrice = Number(p.base_price)
          const perKm     = Number(p.price_per_km)
          return (
          <div key={p.city_id} style={{ border: `1px solid ${TZ.line}`, borderRadius: 12, overflow: 'hidden' }}>
            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', background: TZ.surface2, borderBottom: `1px solid ${TZ.lineSoft}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: TZ.sans, fontSize: 13.5, fontWeight: 700, color: TZ.ink }}>
                  {p.city?.name_tm ?? `Şäher #${p.city_id}`}
                </span>
                {saved === p.city_id && (
                  <span style={{ fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700, color: TZ.green,
                    background: TZ.greenSoft, borderRadius: 10, padding: '2px 8px' }}>✓ Saklandy</span>
                )}
              </div>
              {editing === p.city_id ? (
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
                <button onClick={() => startEdit(p)} type="button"
                  style={{ padding: '5px 12px', borderRadius: 7, border: `1px solid ${TZ.line}`,
                    background: TZ.surface, fontFamily: TZ.sans, fontSize: 12, fontWeight: 600,
                    color: TZ.body, cursor: 'pointer' }}>
                  Üýtget
                </button>
              )}
            </div>

            {/* Card body */}
            <div style={{ padding: '12px 16px', background: TZ.surface }}>
              {editing === p.city_id ? (
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
                    ⚠ Üýtgetme derrew güýje girer.
                  </div>
                </div>
              ) : (
                <>
                  {[
                    { l: 'Başlangyç nyrh', v: `${basePrice} TMT` },
                    { l: '1 km nyrhy',     v: `${perKm} TMT`     },
                    { l: 'Mugt garaşma',   v: `${Number(p.free_wait_min)} min`  },
                    { l: 'Garaşma / min',  v: `${Number(p.wait_price_min)} TMT`},
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
                      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>Mysal</div>
                    <div style={{ fontFamily: TZ.sans, fontSize: 12.5, color: TZ.body, display: 'flex', gap: 16 }}>
                      <span>3 km: <b style={{ color: TZ.ink }}>{(basePrice + perKm * 3).toFixed(2)} T</b></span>
                      <span>5 km: <b style={{ color: TZ.ink }}>{(basePrice + perKm * 5).toFixed(2)} T</b></span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )})}
      </div>
    </div>
  )
}

function SecTeam() {
  const { data, loading, error, reload } = useApi(listTeam, [])
  const team = data?.data ?? []

  const [inviting, setInviting] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', password: '', role: 'operator' })
  const [busy, setBusy] = useState(false)

  async function invite(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await createTeamMember(form)
      setInviting(false)
      setForm({ name: '', phone: '', password: '', role: 'operator' })
      reload()
    } catch (err) {
      alert(err.message || 'Goşmak şowsuz boldy')
    } finally {
      setBusy(false)
    }
  }

  async function remove(m) {
    if (!confirm(`${m.name} pozulsynmy?`)) return
    try {
      await removeTeamMember(m.id)
      reload()
    } catch (err) {
      alert(err.message || 'Pozmak şowsuz boldy')
    }
  }

  async function toggleActive(m) {
    try {
      await updateTeamMember(m.id, { is_active: !m.is_active })
      reload()
    } catch (err) {
      alert(err.message || 'Üýtgetmek şowsuz boldy')
    }
  }

  if (loading) return <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>Ýüklenýär…</div>
  if (error)   return <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{error.message}</div>

  return (
    <div style={{ maxWidth: 580 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontFamily: TZ.sans, fontSize: 15, fontWeight: 700, color: TZ.ink }}>
          Topar
          <span style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: 600, color: TZ.muted, marginLeft: 6 }}>
            · {team.length}
          </span>
        </div>
        <button type="button" onClick={() => setInviting(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            border: `1px solid ${TZ.navy}`, borderRadius: 8, background: 'transparent',
            fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.navy, cursor: 'pointer' }}>
          <Plus size={13} /> Çagyr
        </button>
      </div>

      {inviting && (
        <form onSubmit={invite} style={{ border: `1px solid ${TZ.line}`, borderRadius: 12, padding: 14,
          marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8, background: TZ.surface2 }}>
          <input required placeholder="Ady" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${TZ.line}`, fontFamily: TZ.sans, fontSize: 13 }} />
          <input required placeholder="Telefon (+993...)" value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${TZ.line}`, fontFamily: TZ.sans, fontSize: 13 }} />
          <input required type="password" placeholder="Parol" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${TZ.line}`, fontFamily: TZ.sans, fontSize: 13 }} />
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
            style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${TZ.line}`, fontFamily: TZ.sans, fontSize: 13 }}>
            <option value="operator">Dispetçer</option>
            <option value="admin">Admin</option>
          </select>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setInviting(false)}
              style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${TZ.line}`, background: TZ.surface,
                fontFamily: TZ.sans, fontSize: 12, fontWeight: 600, color: TZ.body, cursor: 'pointer' }}>Ýap</button>
            <button type="submit" disabled={busy}
              style={{ padding: '7px 14px', borderRadius: 8, border: 0, background: TZ.navy, color: '#fff',
                fontFamily: TZ.sans, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Goş</button>
          </div>
        </form>
      )}

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
              {m.role === 'admin' ? 'Admin' : 'Dispetçer'}
            </span>
            <button type="button" onClick={() => toggleActive(m)}
              style={{ background: 'none', border: `1px solid ${TZ.line}`, borderRadius: 7, cursor: 'pointer',
                color: TZ.body, padding: '4px 8px', fontFamily: TZ.sans, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
              {m.is_active ? 'Öçür' : 'Işjeňleşdir'}
            </button>
            <button type="button" onClick={() => remove(m)} style={{ background: 'none', border: 0, cursor: 'pointer',
              color: TZ.faint, padding: 2, flexShrink: 0 }}>
              <MoreHorizontal size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function SecNotif() {
  const ROWS_INIT = [
    { l: 'Täze sargyt',       push: true,  sms: false, email: false },
    { l: 'Sargyt gijä galdy', push: true,  sms: true,  email: false },
    { l: 'Sargyt ýatyryldy',  push: true,  sms: true,  email: true  },
    { l: 'Sürüji offline',    push: true,  sms: false, email: false },
    { l: 'Günlük hasabat',    push: false, sms: false, email: true  },
  ]
  const [rows, setRows] = useState(ROWS_INIT)
  const tog = (i, k) => setRows(p => p.map((r, idx) => idx === i ? { ...r, [k]: !r[k] } : r))

  return (
    <div style={{ maxWidth: 580 }}>
      <SectionHead>Wakalar we kanallar</SectionHead>
      <div style={{ border: `1px solid ${TZ.line}`, borderRadius: 12, overflow: 'hidden', background: TZ.surface }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px',
          padding: '10px 16px', background: TZ.surface2, borderBottom: `1px solid ${TZ.line}` }}>
          {['Waka','Push','SMS','Email'].map((h, i) => (
            <span key={h} style={{ fontFamily: TZ.sans, fontSize: 10.5, fontWeight: 700, color: TZ.muted,
              textTransform: 'uppercase', letterSpacing: 0.5, textAlign: i > 0 ? 'center' : 'left' }}>{h}</span>
          ))}
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px',
            alignItems: 'center', padding: '13px 16px',
            borderBottom: i < rows.length - 1 ? `1px solid ${TZ.lineSoft}` : 'none' }}>
            <span style={{ fontFamily: TZ.sans, fontSize: 13.5, fontWeight: 600, color: TZ.ink }}>{r.l}</span>
            {['push','sms','email'].map(k => (
              <div key={k} style={{ display: 'flex', justifyContent: 'center' }}>
                <Toggle on={r[k]} onChange={() => tog(i, k)} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <SectionHead>Asuda sagatlar</SectionHead>
      <Row label="Biynjalyk etme" hint="Gije push öçýär">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Toggle on />
          <Field value="22:00 — 07:00" width={160} />
        </div>
      </Row>
    </div>
  )
}

const BODIES = { company: SecCompany, locale: SecLocale, pricing: SecPricing, team: SecTeam, notif: SecNotif }

// ── Page ───────────────────────────────────────────────────────────────────

export default function SettingsPage({ shell }) {
  const [active, setActive] = useState('company')
  const Body = BODIES[active]

  return (
    <AdminShell {...shell}
      active="settings"
      title="Sazlamalar"
      subtitle={SECTIONS.find(s => s.id === active)?.label}
      actions={
        <button type="button"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px',
            border: 0, borderRadius: 8, background: TZ.navy, color: '#fff',
            fontFamily: TZ.sans, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          <Check size={13} /> Sakla
        </button>
      }
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
          <Body />
        </div>
      </div>
    </AdminShell>
  )
}
