import { useState, useEffect, useRef } from 'react'
import { C } from '../constants.js'
import { useAudio } from '../hooks/useAudio.js'

export default function BreathingScreen({ activity, voiceGender, voiceGuide, onBack, onComplete }) {
  const { phases, scripts } = activity
  const [running, setRunning]   = useState(false)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [count, setCount]       = useState(phases[0].duration)
  const [cycles, setCycles]     = useState(0)
  const [done, setDone]         = useState(false)
  const phaseRef = useRef(0)
  const { speak, stop } = useAudio(voiceGender, voiceGuide ?? true)

  useEffect(() => { phaseRef.current = phaseIdx }, [phaseIdx])

  // Speak intro on mount
  useEffect(() => { speak(scripts.intro) }, [])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setCount(c => {
        if (c > 1) return c - 1
        const next = (phaseRef.current + 1) % phases.length
        const newCycles = next === 0 ? cycles + 1 : cycles
        if (next === 0) setCycles(prev => prev + 1)
        if (newCycles >= 4 && next === 0) {
          // 4 cycles complete
          clearInterval(id)
          setRunning(false)
          setDone(true)
          speak(scripts.closing)
          return phases[0].duration
        }
        setPhaseIdx(next)
        speak(scripts.phases[next])
        return phases[next].duration
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  const handleStart = () => {
    setRunning(true)
    speak(scripts.phases[0])
  }

  const handleStop = () => {
    setRunning(false)
    stop()
    setPhaseIdx(0)
    setCount(phases[0].duration)
    setCycles(0)
    phaseRef.current = 0
  }

  const progress = (phases[phaseIdx].duration - count) / phases[phaseIdx].duration
  let scale = 0.6
  if (running || done) {
    if (phaseIdx === 0) scale = 0.6 + progress * 0.4
    else if (phaseIdx === phases.length - 1 && phases[phaseIdx].label === 'Hold') scale = 0.6
    else if (phases[phaseIdx].label === 'Hold') scale = 1.0
    else if (phases[phaseIdx].label === 'Breathe out') scale = 1.0 - progress * 0.4
    else scale = 0.6
  }
  const size = Math.round(scale * 200)

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem 1.25rem', borderBottom: `0.5px solid ${C.border}`, background: C.card }}>
        <button onClick={() => { stop(); onBack() }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: C.muted }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div>
          <div style={{ fontWeight: 500, fontSize: '16px' }}>{activity.title}</div>
          <div style={{ fontSize: '12px', color: C.muted }}>{activity.duration} min · Breathing</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem', textAlign: 'center' }}>

        {done ? (
          <div style={{ maxWidth: '320px' }}>
            <div style={{ fontSize: '48px', marginBottom: '1rem' }}>✓</div>
            <h3 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '0.5rem' }}>Session complete</h3>
            <p style={{ fontSize: '15px', color: C.muted, lineHeight: 1.6, marginBottom: '2rem' }}>{scripts.closing}</p>
            <button onClick={() => { onComplete?.(); onBack() }} style={btnStyle(C.primary, '#fff')}>Done</button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '13px', color: C.muted, marginBottom: '2.5rem' }}>
              {phases.map((p, i) => `${p.label} ${p.duration}`).join(' · ')}
            </p>

            <div style={{ position: 'relative', width: '220px', height: '220px', marginBottom: '2rem' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid rgba(15,110,86,0.15)' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: `${size}px`, height: `${size}px`, borderRadius: '50%',
                  background: 'radial-gradient(circle at 38% 38%, #1faa84, #0F6E56)',
                  transition: 'width 1s linear, height 1s linear',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#fff',
                }}>
                  {running && (
                    <>
                      <span style={{ fontSize: '10px', fontWeight: 500, opacity: 0.85, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        {phases[phaseIdx].label}
                      </span>
                      <span style={{ fontSize: '36px', fontWeight: 300, lineHeight: 1.1 }}>{count}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {cycles > 0 && (
              <p style={{ fontSize: '13px', color: C.muted, marginBottom: '1rem' }}>
                {cycles} of 4 cycles
              </p>
            )}

            {!running ? (
              <button onClick={handleStart} style={btnStyle(C.primary, '#fff')}>Start</button>
            ) : (
              <button onClick={handleStop} style={btnStyle('none', C.primary, C.primary)}>Stop</button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const btnStyle = (bg, color, borderColor) => ({
  background: bg, border: `0.5px solid ${borderColor ?? 'transparent'}`,
  borderRadius: '999px', padding: '10px 36px',
  fontSize: '15px', fontWeight: 500, color, cursor: 'pointer',
})
