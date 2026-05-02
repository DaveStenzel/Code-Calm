import { useState } from 'react'
import { C } from '../constants.js'
import { JOURNAL_PROMPTS } from '../data.js'

export default function JournalScreen({ journalEntries, onSaveEntry, sw }) {
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)
  const [view, setView] = useState('write') // 'write' | 'history'

  const prompt = JOURNAL_PROMPTS[new Date().getDate() % JOURNAL_PROMPTS.length]

  const save = () => {
    if (!text.trim()) return
    onSaveEntry({ body: text.trim(), prompt, created_at: new Date().toISOString() })
    if (sw) sw.queueWrite({ url: '/api/journal', method: 'POST', body: { entry: text, timestamp: Date.now() } })
    setSaved(true)
    setText('')
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ paddingBottom: '80px' }}>
      <div style={{ padding: '1.25rem 1.25rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>Journal</h2>
          <button
            onClick={() => setView(v => v === 'write' ? 'history' : 'write')}
            style={{ background: 'none', border: `0.5px solid ${C.border}`, borderRadius: '99px', padding: '5px 14px', fontSize: '13px', color: C.muted, cursor: 'pointer' }}
          >
            {view === 'write' ? 'Past entries' : 'Write'}
          </button>
        </div>

        {view === 'write' ? (
          <WriteView prompt={prompt} text={text} setText={setText} save={save} saved={saved} isOffline={sw?.isOffline} />
        ) : (
          <HistoryView entries={journalEntries} />
        )}
      </div>
    </div>
  )
}

function WriteView({ prompt, text, setText, save, saved, isOffline }) {
  return (
    <>
      <div style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: '12px', padding: '0.875rem 1.125rem', marginBottom: '1rem' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888780', marginBottom: '6px' }}>
          Today's prompt
        </p>
        <p style={{ fontSize: '15px', lineHeight: 1.6, color: C.text }}>{prompt}</p>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write freely — this is private…"
        style={{
          width: '100%', minHeight: '160px', border: `0.5px solid ${C.border}`,
          borderRadius: '12px', padding: '0.875rem 1rem', fontSize: '15px',
          lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit',
          background: C.card, color: C.text, outline: 'none', boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '0.75rem', gap: '0.75rem' }}>
        {saved && (
          <span style={{ fontSize: '13px', color: C.primary }}>
            {isOffline ? 'Saved — will sync when online' : 'Saved'}
          </span>
        )}
        <button
          onClick={save}
          disabled={!text.trim()}
          style={{
            background: text.trim() ? C.primary : '#d1d1ce',
            border: 'none', borderRadius: '999px', padding: '8px 20px',
            fontSize: '14px', fontWeight: 500, color: '#fff',
            cursor: text.trim() ? 'pointer' : 'default',
          }}
        >
          Save entry
        </button>
      </div>
    </>
  )
}

function HistoryView({ entries }) {
  if (!entries.length) {
    return (
      <p style={{ fontSize: '14px', color: C.muted, textAlign: 'center', padding: '3rem 0' }}>
        No entries yet. Your saved reflections will appear here.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {[...entries].reverse().map((entry, i) => (
        <div key={i} style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: '12px', padding: '0.875rem 1.125rem' }}>
          <div style={{ fontSize: '11px', color: C.subtle, marginBottom: '4px' }}>
            {new Date(entry.created_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
          <div style={{ fontSize: '12px', color: C.muted, fontStyle: 'italic', marginBottom: '6px' }}>{entry.prompt}</div>
          <div style={{ fontSize: '14px', color: C.text, lineHeight: 1.6 }}>{entry.body}</div>
        </div>
      ))}
    </div>
  )
}
