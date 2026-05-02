import { useState } from 'react'
import { C } from '../constants.js'
import { ACTIVITIES } from '../data.js'
import ActivityCard from '../components/ActivityCard.jsx'

const TYPE_FILTERS = ['All', 'Breathing', 'Meditation', 'Relaxation']
const DURATION_FILTERS = [{ label: 'All', max: Infinity }, { label: '≤ 5 min', max: 5 }, { label: '6–10 min', min: 6, max: 10 }]

export default function ActivitiesScreen({ onStartActivity }) {
  const [typeFilter, setTypeFilter] = useState('All')
  const [durationFilter, setDurationFilter] = useState(0)

  const df = DURATION_FILTERS[durationFilter]
  const filtered = ACTIVITIES.filter(a => {
    const typeMatch = typeFilter === 'All' || a.tag === typeFilter
    const durationMatch = a.duration <= df.max && a.duration >= (df.min ?? 0)
    return typeMatch && durationMatch
  })

  return (
    <div style={{ paddingBottom: '80px' }}>
      <div style={{ padding: '1.25rem 1.25rem 0' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: '1rem' }}>Activities</h2>

        {/* Type filter */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px', marginBottom: '0.625rem' }}>
          {TYPE_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              style={{
                flexShrink: 0, padding: '5px 14px', borderRadius: '99px', fontSize: '13px',
                fontWeight: typeFilter === f ? 500 : 400, cursor: 'pointer',
                background: typeFilter === f ? C.primary : C.card,
                border: `0.5px solid ${typeFilter === f ? C.primary : C.border}`,
                color: typeFilter === f ? '#fff' : C.muted,
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Duration filter */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {DURATION_FILTERS.map((f, i) => (
            <button
              key={f.label}
              onClick={() => setDurationFilter(i)}
              style={{
                flexShrink: 0, padding: '4px 12px', borderRadius: '99px', fontSize: '12px',
                fontWeight: durationFilter === i ? 500 : 400, cursor: 'pointer',
                background: durationFilter === i ? '#F1EFE8' : 'none',
                border: `0.5px solid ${durationFilter === i ? '#888780' : C.border}`,
                color: durationFilter === i ? '#444441' : C.subtle,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Activity list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {filtered.length === 0 ? (
            <p style={{ fontSize: '14px', color: C.muted, textAlign: 'center', padding: '2rem 0' }}>
              No activities match those filters.
            </p>
          ) : (
            filtered.map(a => <ActivityCard key={a.id} activity={a} onStart={onStartActivity} />)
          )}
        </div>
      </div>
    </div>
  )
}
