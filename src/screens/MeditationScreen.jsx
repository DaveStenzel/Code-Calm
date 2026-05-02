import { useState, useEffect } from 'react'
import { C } from '../constants.js'
import { useAudio } from '../hooks/useAudio.js'

export default function MeditationScreen({ activity, onBack, onComplete }) {
  const { steps } = activity
  const [stepIdx, setStepIdx] = useState(-1) // -1 = intro
  const [done, setDone] = useState(false)
  const { speak, stop } = useAudio()

  useEffect(() => {
    speak(`${activity.title}. ${activity.subtitle}. Tap Next Step when you're ready to begin.`)
  }, [])

  const current = stepIdx >= 0 ? steps[stepIdx] : null
  const isLast = stepIdx === steps.length - 1

  const next = () => {
    if (stepIdx === -1) {
      setStepIdx(0)
      speak(steps[0].body)
    } else if (isLast) {
      setDone(true)
      stop()
    } else {
      const n = stepIdx + 1
      setStepIdx(n)
      speak(steps[n].body)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem 1.25rem', borderBottom: `0.5px solid ${C.border}`, background: C.card }}>
        <button onClick={() => { stop(); onBack() }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: C.muted }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div>
          <div style={{ fontWeight: 500, fontSize: '16px' }}>{activity.title}</div>
          <div style={{ fontSize: '12px', color: C.muted }}>{activity.duration} min · Meditation</div>
        </div>
        {stepIdx >= 0 && (
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: C.subtle }}>
            {stepIdx + 1} / {steps.length}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {stepIdx >= 0 && (
        <div style={{ height: '2px', background: C.border }}>
          <div style={{ height: '100%', background: C.blue, width: `${((stepIdx + 1) / steps.length) * 100}%`, transition: 'width 0.3s' }} />
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', textAlign: 'center', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        {done ? (
          <>
            <div style={{ fontSize: '48px', marginBottom: '1rem' }}>✓</div>
            <h3 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '0.5rem' }}>Session complete</h3>
            <p style={{ fontSize: '15px', color: C.muted, lineHeight: 1.6, marginBottom: '2rem' }}>
              Well done. Take a moment to notice how your body feels.
            </p>
            <button onClick={() => { onComplete?.(); onBack() }} style={btnStyle(C.blue, '#fff')}>Done</button>
          </>
        ) : stepIdx === -1 ? (
          <>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a4 4 0 100 8 4 4 0 000-8zM6 20c0-3.31 2.69-6 6-6s6 2.69 6 6"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 500, marginBottom: '0.5rem' }}>{activity.title}</h2>
            <p style={{ fontSize: '15px', color: C.muted, lineHeight: 1.6, marginBottom: '0.5rem' }}>{activity.subtitle}</p>
            <p style={{ fontSize: '13px', color: C.subtle, marginBottom: '2.5rem' }}>{steps.length} steps · {activity.duration} min</p>
            <p style={{ fontSize: '14px', color: C.muted, lineHeight: 1.6, marginBottom: '2rem' }}>
              Find a comfortable position. Tap "Begin" when you're ready. Each step will be read aloud.
            </p>
            <button onClick={next} style={btnStyle(C.blue, '#fff')}>Begin</button>
          </>
        ) : (
          <>
            <div style={{ background: C.blueLight, borderRadius: '99px', padding: '4px 14px', fontSize: '12px', fontWeight: 500, color: C.blue, marginBottom: '2rem' }}>
              {current.heading}
            </div>
            <p style={{ fontSize: '17px', lineHeight: 1.75, color: C.text, marginBottom: '2.5rem', maxWidth: '360px' }}>
              {current.body}
            </p>
            <button onClick={next} style={btnStyle(C.blue, '#fff')}>
              {isLast ? 'Complete' : 'Next step'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const btnStyle = (bg, color) => ({
  background: bg, border: 'none', borderRadius: '999px',
  padding: '10px 36px', fontSize: '15px', fontWeight: 500, color, cursor: 'pointer',
})
