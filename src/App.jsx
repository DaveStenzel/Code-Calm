import { useState, useEffect, useRef } from 'react'
import { OfflineBanner } from '../OfflineBanner.jsx'
import { useServiceWorker } from '../useServiceWorker.js'

const C = {
  bg: '#f8f8f6',
  primary: '#0F6E56',
  text: '#2c2c2a',
  muted: '#5f5e5a',
  card: '#fff',
  border: 'rgba(0,0,0,0.08)',
}

export default function App() {
  const sw = useServiceWorker()
  return (
    <div style={{ minHeight: '100dvh', background: C.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: C.text }}>
      <OfflineBanner
        isOffline={sw.isOffline}
        isStale={sw.isStale}
        pendingWrites={sw.pendingWrites}
        updateReady={sw.updateReady}
        applyUpdate={sw.applyUpdate}
      />
      <AppShell sw={sw} />
    </div>
  )
}

function AppShell({ sw }) {
  const [tab, setTab] = useState('breathe')
  const tabs = [['breathe', 'Breathe'], ['reflect', 'Reflect'], ['resources', 'Resources']]

  return (
    <>
      <header style={{ background: C.card, borderBottom: `0.5px solid ${C.border}`, padding: '1rem 1.25rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 600, fontSize: '17px', letterSpacing: '-0.01em' }}>CodeCalm</span>
          {sw.isOffline && (
            <span style={{ fontSize: '11px', color: '#854F0B', background: '#FFF3E0', padding: '2px 8px', borderRadius: '99px', fontWeight: 500 }}>
              Offline
            </span>
          )}
        </div>
        <nav style={{ display: 'flex' }}>
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                background: 'none', border: 'none', padding: '6px 14px 10px',
                fontSize: '14px', fontWeight: tab === id ? 500 : 400,
                color: tab === id ? C.primary : C.muted,
                borderBottom: tab === id ? `2px solid ${C.primary}` : '2px solid transparent',
                cursor: 'pointer', transition: 'color 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '1.75rem 1.25rem' }}>
        {tab === 'breathe'    && <BreatheTab />}
        {tab === 'reflect'    && <ReflectTab sw={sw} />}
        {tab === 'resources'  && <ResourcesTab />}
      </main>
    </>
  )
}

/* ── Box Breathing ──────────────────────────────────────────────────────────*/

const PHASES = [
  { label: 'Breathe in',  duration: 4 },
  { label: 'Hold',        duration: 4 },
  { label: 'Breathe out', duration: 4 },
  { label: 'Hold',        duration: 4 },
]

function BreatheTab() {
  const [running, setRunning]   = useState(false)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [count, setCount]       = useState(PHASES[0].duration)
  const [cycles, setCycles]     = useState(0)
  const phaseRef = useRef(0)

  useEffect(() => { phaseRef.current = phaseIdx }, [phaseIdx])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setCount(c => {
        if (c > 1) return c - 1
        const next = (phaseRef.current + 1) % PHASES.length
        if (next === 0) setCycles(prev => prev + 1)
        setPhaseIdx(next)
        return PHASES[next].duration
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  const stop = () => {
    setRunning(false)
    setPhaseIdx(0)
    setCount(PHASES[0].duration)
    phaseRef.current = 0
  }

  const progress = running ? (PHASES[phaseIdx].duration - count) / PHASES[phaseIdx].duration : 0
  let scale = 0.6
  if (running) {
    if (phaseIdx === 0) scale = 0.6 + progress * 0.4
    else if (phaseIdx === 1) scale = 1.0
    else if (phaseIdx === 2) scale = 1.0 - progress * 0.4
    else scale = 0.6
  }
  const size = Math.round(scale * 200)

  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '4px' }}>Box Breathing</h2>
      <p style={{ fontSize: '13px', color: C.muted, marginBottom: '2.5rem' }}>
        4 counts in · 4 hold · 4 out · 4 hold
      </p>

      <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 2rem' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid rgba(15,110,86,0.15)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: `${size}px`, height: `${size}px`, borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 38%, #1faa84, #0F6E56)',
            transition: 'width 1s linear, height 1s linear',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', color: '#fff',
          }}>
            {running && (
              <>
                <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.85, letterSpacing: '0.03em' }}>
                  {PHASES[phaseIdx].label.toUpperCase()}
                </span>
                <span style={{ fontSize: '32px', fontWeight: 300, lineHeight: 1.1 }}>{count}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {cycles > 0 && (
        <p style={{ fontSize: '13px', color: C.muted, marginBottom: '1rem' }}>
          {cycles} {cycles === 1 ? 'cycle' : 'cycles'} completed
        </p>
      )}

      <button
        onClick={() => running ? stop() : setRunning(true)}
        style={{
          background: running ? 'none' : C.primary,
          border: `0.5px solid ${running ? C.primary : 'transparent'}`,
          borderRadius: '999px', padding: '10px 32px',
          fontSize: '15px', fontWeight: 500,
          color: running ? C.primary : '#fff', cursor: 'pointer',
        }}
      >
        {running ? 'Stop' : 'Start'}
      </button>
    </div>
  )
}

/* ── Reflect / Journal ──────────────────────────────────────────────────────*/

const PROMPTS = [
  "What's one thing you handled well today?",
  'How is your body feeling right now?',
  'What would help you decompress tonight?',
  "Name something you're grateful for from your shift.",
  "Is there anything weighing on you that you'd like to set down?",
  'What did you learn about yourself today?',
  'Who supported you today, and how?',
  'What do you need most right now?',
]

function ReflectTab({ sw }) {
  const [text, setText]   = useState('')
  const [saved, setSaved] = useState(false)
  const prompt = PROMPTS[new Date().getDate() % PROMPTS.length]

  const save = () => {
    if (!text.trim()) return
    sw.queueWrite({ url: '/api/journal', method: 'POST', body: { entry: text, timestamp: Date.now() } })
    setSaved(true)
    setText('')
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '4px' }}>Reflect</h2>
      <p style={{ fontSize: '13px', color: C.muted, marginBottom: '1.5rem' }}>A private space for your thoughts.</p>

      <div style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: '12px', padding: '0.875rem 1.125rem', marginBottom: '1rem' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888780', marginBottom: '6px' }}>
          Today's prompt
        </p>
        <p style={{ fontSize: '15px', lineHeight: 1.6, color: C.text }}>{prompt}</p>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write freely…"
        style={{
          width: '100%', minHeight: '150px', border: `0.5px solid ${C.border}`,
          borderRadius: '12px', padding: '0.875rem 1rem', fontSize: '15px',
          lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit',
          background: C.card, color: C.text, outline: 'none', boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '0.75rem', gap: '0.75rem' }}>
        {saved && (
          <span style={{ fontSize: '13px', color: C.primary }}>
            {sw.isOffline ? 'Saved — will sync when online' : 'Saved'}
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
    </div>
  )
}

/* ── Resources ──────────────────────────────────────────────────────────────*/

const RESOURCES = [
  { name: 'Safe Call Now',         contact: '1-206-459-3020',    note: '24/7 confidential for first responders' },
  { name: 'Crisis Text Line',      contact: 'Text HOME to 741741', note: 'Free, confidential, 24/7' },
  { name: 'Veterans Crisis Line',  contact: '988, press 1',      note: 'Also available to first responders' },
  { name: 'SAMHSA Helpline',       contact: '1-800-662-4357',    note: 'Substance use & mental health' },
]

function ResourcesTab() {
  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '4px' }}>Support Resources</h2>
      <p style={{ fontSize: '13px', color: C.muted, marginBottom: '1.5rem' }}>Available even when offline.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {RESOURCES.map(r => (
          <div key={r.name} style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: '12px', padding: '0.875rem 1.125rem' }}>
            <div style={{ fontWeight: 500, fontSize: '15px', marginBottom: '3px' }}>{r.name}</div>
            <div style={{ fontSize: '14px', color: C.primary, marginBottom: '3px' }}>{r.contact}</div>
            <div style={{ fontSize: '12px', color: C.muted }}>{r.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
