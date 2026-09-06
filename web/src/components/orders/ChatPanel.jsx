import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { useTZ } from '../../design/tokens.js'
import { useT } from '../../i18n/useT.js'
import { getSocket } from '../../api/socket.js'
import { listMessages, sendMessage } from '../../api/orders.js'

const SENDER_KEY = { admin: 'senderAdmin', client: 'senderClient', driver: 'senderDriver' }

// Order chat is driver↔client only — admin can't post into it (see server/socket/orderSocket.js),
// so this panel renders read-only for the admin web app. Admins message users through the
// separate support chat instead.
export function ChatPanel({ orderId, readOnly = true }) {
  const TZ = useTZ()
  const t = useT()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    listMessages(orderId).then(res => { if (!cancelled) setMessages(res.messages ?? []) }).catch(() => {})

    const socket = getSocket()
    socket.emit('order:watch', { orderId })
    function onMessage(msg) {
      if (String(msg.order_id) !== String(orderId)) return
      setMessages(prev => [...prev, msg])
    }
    socket.on('chat:message', onMessage)

    return () => { cancelled = true; socket.off('chat:message', onMessage) }
  }, [orderId])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  async function send() {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    try {
      const res = await sendMessage(orderId, body)
      setMessages(prev => [...prev, res.message])
      setText('')
    } catch (err) {
      alert(err.message || t('chat.sendError'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex',
        flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
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
                maxWidth: '78%', padding: '7px 11px', borderRadius: 12,
                background: mine ? TZ.navy : TZ.surface2,
                color: mine ? '#fff' : TZ.ink,
                fontFamily: TZ.sans, fontSize: 13, lineHeight: 1.4,
                border: mine ? 'none' : `1px solid ${TZ.line}`,
              }}>
                {m.body}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 2, fontFamily: TZ.sans, fontSize: 10.5, color: TZ.faint }}>
                <span>{t(`chat.${SENDER_KEY[m.sender_type] ?? 'senderClient'}`)}</span>
                <span>{new Date(m.created_at).toLocaleTimeString()}</span>
              </div>
            </div>
          )
        })}
      </div>

      {readOnly ? (
        <div style={{ padding: 12, borderTop: `1px solid ${TZ.lineSoft}`, flexShrink: 0,
          textAlign: 'center', fontFamily: TZ.sans, fontSize: 11.5, color: TZ.faint }}>
          {t('chat.readOnly')}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: `1px solid ${TZ.lineSoft}`, flexShrink: 0 }}>
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={t('chat.placeholder')}
            style={{ flex: 1, border: `1px solid ${TZ.line}`, borderRadius: 8, padding: '8px 12px',
              outline: 'none', background: TZ.surface, fontFamily: TZ.sans, fontSize: 13, color: TZ.ink }} />
          <button type="button" onClick={send} disabled={sending || !text.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: 0,
              borderRadius: 8, background: TZ.navy, color: '#fff', cursor: sending ? 'default' : 'pointer',
              opacity: sending || !text.trim() ? 0.6 : 1,
              fontFamily: TZ.sans, fontSize: 12.5, fontWeight: 600 }}>
            <Send size={13} /> {t('chat.send')}
          </button>
        </div>
      )}
    </div>
  )
}
