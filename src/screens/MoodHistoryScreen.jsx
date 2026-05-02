import { C } from '../constants.js'

const MOOD_COLORS = { 1: '#FBCB9A', 2: C.primary, 3: '#185FA5' }
const MOOD_LABELS = { 1: 'Rough', 2: 'Okay', 3: 'Good' }

function getLast7Days(moodLogs) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toDateString()
    return {
      label: d.toLocaleDateString('en-AU', { weekday: 'short' }).slice(0, 2),
      log: moodLogs.find(l => new Date(l.date).toDateString() === dateStr) ?? null,
    }
  })
}

export default function MoodHistoryChart({ moodLogs }) {
  const days = getLast7Days(moodLogs)
  if (!days.some(d => d.log)) return null

  const W = 280, H = 96
  const barW = 28
  const gap = (W - 7 * barW) / 6

  return (
    <div style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: '14px', padding: '1rem 1.125rem' }}>
      <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.subtle, marginBottom: '0.75rem' }}>
        Past 7 days
      </p>
      <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ display: 'block' }}>
        {days.map((day, i) => {
          const x = i * (barW + gap)
          const val = day.log?.value
          const barH = val ? (val / 3) * H : 4
          const y = H - barH
          const color = val ? MOOD_COLORS[val] : C.border
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx="5" fill={color} opacity={val ? 0.85 : 1} />
              <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize="10" fill={C.subtle}>{day.label}</text>
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
        {Object.entries(MOOD_LABELS).map(([val, label]) => (
          <div key={val} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: MOOD_COLORS[val] }} />
            <span style={{ fontSize: '11px', color: C.subtle }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
