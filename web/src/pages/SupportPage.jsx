import { useEffect, useRef, useState } from 'react'
import { Send, Search } from 'lucide-react'
import { usePageHeader } from '../components/shell/AdminShell.jsx'
import { useTZ } from '../design/tokens.js'
import { useApi } from '../api/useApi.js'
import { listSupportThreads, getSupportMessages, replySupport } from '../api/support.js'
import { getSocket, registerAdmin } from '../api/socket.js'
import { useT } from '../i18n/useT.js'

export default function SupportPage({ shell }) {
  const TZ = useTZ()
  const t = useT()
  const [search, setSearch] = useState('')
  const [activeUserId, setActiveUserId] = useState(null)

  const { data, loading, error, reload } = useApi(() => listSupportThreads({ limit: 100 }), [])
  const threads = data?.data ?? []
  const unreadTotal = threads.reduce((sum, th) => sum + Number(th.unread_count || 0), 0)

  useEffect(() => {
    registerAdmin()
    const socket = getSocket()
    function onMessage() { reload() }
    socket.on('support:message', onMessage)
    return () => socket.off('support:message', onMessage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = threads.filter(th => {
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    return (th.full_name || '').toLowerCase().includes(q) || String(th.user_id).includes(q)
  })

  const activeThread = threads.find(th => th.user_id === activeUserId) ?? null

  usePageHeader({
    title: t('support.title'),
    subtitle: unreadTotal > 0 ? `${unreadTotal} ${t('support.subtitleUnread')}` : undefined,
  })

  return (
    <>
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

        <div style={{ width: 300, flexShrink: 0, borderRight: `1px solid ${TZ.line}`,
          display: 'flex', flexDirection: 'column', background: TZ.surface }}>
          <div style={{ padding: 12, borderBottom: `1px solid ${TZ.lineSoft}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
              borderRadius: 8, background: TZ.surface2 }}>
              <Search size={14} color={TZ.muted} style={{ flexShrink: 0 }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('support.searchPlaceholder')}
                style={{ flex: 1, border: 0, outline: 'none', background: 'transparent',
                  fontFamily: TZ.sans, fontSize: 13, color: TZ.ink, minWidth: 0 }} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>{t('common.loading')}</div>}
            {error && <div style={{ padding: 16, fontFamily: TZ.sans, fontSize: 13, color: TZ.red }}>{error.message}</div>}
            {!loading && !error && filtered.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', fontFamily: TZ.sans, fontSize: 12, color: TZ.faint }}>
                {t('support.empty')}
              </div>
            )}
            {filtered.map(th => (
              <ThreadRow key={th.user_id} thread={th} active={th.user_id === activeUserId}
                onClick={() => setActiveUserId(th.user_id)} />
            ))}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: TZ.surface2 }}>
          {activeThread ? (
            <ThreadPanel key={activeThread.user_id} thread={activeThread} onSent={reload} />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: TZ.sans, fontSize: 13, color: TZ.faint }}>
              {t('support.selectThread')}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function ThreadRow({ thread, active, onClick }) {
  const TZ = useTZ()
  const t = useT()
  const unread = thread.unread_count > 0
  return (
    <button type="button" onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
        padding: '10px 14px', border: 0, borderBottom: `1px solid ${TZ.lineSoft}`, cursor: 'pointer',
        background: active ? TZ.surface2 : 'transparent' }}>
      <div style={{ width: 34, height: 34, borderRadius: 17, background: TZ.navySoft, color: TZ.navy,
        fontFamily: TZ.sans, fontWeight: 700, fontSize: 12.5, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0 }}>
        {(thread.full_name || '?').slice(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <span style={{ fontFamily: TZ.sans, fontSize: 13, fontWeight: unread ? 700 : 600, color: TZ.ink,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {thread.full_name || t('support.noName')}
          </span>
          {thread.last_created_at && (
            <span style={{ fontFamily: TZ.sans, fontSize: 10.5, color: TZ.faint, flexShrink: 0 }}>
              {new Date(thread.last_created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 2 }}>
          <span style={{ fontFamily: TZ.sans, fontSize: 12, color: unread ? TZ.body : TZ.muted,
            fontWeight: unread ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {thread.last_sender_type === 'admin' ? '↳ ' : ''}{thread.last_message || (thread.last_photo_url ? '📷' : '')}
          </span>
          {unread && (
            <span style={{ minWidth: 17, height: 17, padding: '0 4px', borderRadius: 999, background: TZ.orange,
              color: '#fff', fontFamily: TZ.sans, fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {thread.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function ThreadPanel({ thread, onSent }) {
  const TZ = useTZ()
  const t = useT()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getSupportMessages(thread.user_id, { limit: 200 })
      .then(res => { if (!cancelled) setMessages(res.result ?? []) })
      .finally(() => { if (!cancelled) setLoading(false) })

    const socket = getSocket()
    function onMessage(msg) {
      if (String(msg.user_id) !== String(thread.user_id)) return
      setMessages(prev => [...prev, msg])
    }
    socket.on('support:message', onMessage)

    return () => { cancelled = true; socket.off('support:message', onMessage) }
  }, [thread.user_id])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  async function send() {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    try {
      const res = await replySupport(thread.user_id, { message: body })
      setMessages(prev => [...prev, res.result])
      setText('')
      onSent?.()
    } catch (err) {
      alert(err.message || t('chat.sendError'))
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${TZ.line}`, background: TZ.surface, flexShrink: 0 }}>
        <div style={{ fontFamily: TZ.sans, fontSize: 14.5, fontWeight: 700, color: TZ.ink }}>
          {thread.full_name || t('support.noName')}
        </div>
        <div style={{ fontFamily: TZ.mono, fontSize: 11.5, color: TZ.muted }}>#{thread.user_id}</div>
      </div>

      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex',
        flexDirection: 'column', gap: 8 }}>
        {loading && <div style={{ fontFamily: TZ.sans, fontSize: 13, color: TZ.muted }}>{t('common.loading')}</div>}
        {!loading && messages.length === 0 && (
          <div style={{ textAlign: 'center', fontFamily: TZ.sans, fontSize: 12, color: TZ.faint, padding: '20px 0' }}>
            {t('chat.empty')}
          </div>
        )}
        {messages.map(m => {
          const mine = m.sender_type === 'admin'
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column',
              alignItems: mine ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '70%', padding: '8px 12px', borderRadius: 12,
                background: mine ? TZ.navy : TZ.surface,
                color: mine ? '#fff' : TZ.ink,
                fontFamily: TZ.sans, fontSize: 13, lineHeight: 1.4,
                border: mine ? 'none' : `1px solid ${TZ.line}`,
              }}>
                {m.message}
                {m.photo_url && (
                  <img src={m.photo_url} alt="" style={{ display: 'block', marginTop: m.message ? 6 : 0,
                    maxWidth: '100%', borderRadius: 8 }} />
                )}
              </div>
              <div style={{ fontFamily: TZ.sans, fontSize: 10.5, color: TZ.faint, marginTop: 2 }}>
                {new Date(m.created_at).toLocaleTimeString()}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderTop: `1px solid ${TZ.line}`,
        background: TZ.surface, flexShrink: 0 }}>
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder={t('chat.placeholder')}
          style={{ flex: 1, border: `1px solid ${TZ.line}`, borderRadius: 8, padding: '9px 12px',
            outline: 'none', background: TZ.surface, fontFamily: TZ.sans, fontSize: 13, color: TZ.ink }} />
        <button type="button" onClick={send} disabled={sending || !text.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: 0,
            borderRadius: 8, background: TZ.navy, color: '#fff', cursor: sending ? 'default' : 'pointer',
            opacity: sending || !text.trim() ? 0.6 : 1,
            fontFamily: TZ.sans, fontSize: 12.5, fontWeight: 600 }}>
          <Send size={13} /> {t('chat.send')}
        </button>
      </div>
    </>
  )
}
