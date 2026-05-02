import { C } from '../constants.js'
import { ACTIVITIES, AFFIRMATIONS, MOOD_SUGGESTIONS } from '../data.js'
import ActivityCard from '../components/ActivityCard.jsx'
import SupportPanel from '../components/SupportPanel.jsx'
import MoodHistoryChart from './MoodHistoryScreen.jsx'

const MOODS = [
  { value: 1, emoji: '😔', label: 'Rough' },
  { value: 2, emoji: '😐', label: 'Okay' },
  { value: 3, emoji: '😊', label: 'Good' },
]

export default function HomeScreen({ moodLogs, onLogMood, onStartActivity }) {
  const today = new Date().toDateString()
  const todayLog = moodLogs.find(l => new Date(l.date).toDateString() === today)
  const affirmation = AFFIRMATIONS[new Date().getDate() % AFFIRMATIONS.length]

  const suggestedIds = todayLog ? (MOOD_SUGGESTIONS[todayLog.value] ?? []) : []
  const suggested = suggestedIds.map(id => ACTIVITIES.find(a => a.id === id)).filter(Boolean)

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1.25rem 0' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '4px' }}>CodeCalm</h1>
        <p style={{ fontSize: '13px', color: C.muted }}>{affirmation}</p>
      </div>

      {/* Mood check-in */}
      <div style={{ margin: '1.25rem 1.25rem 0', background: C.card, border: `0.5px solid ${C.border}`, borderRadius: '16px', padding: '1.125rem' }}>
        <p style={{ fontSize: '13px', fontWeight: 500, color: C.muted, marginBottom: '0.75rem' }}>
          {todayLog ? "Today you checked in:" : "How are you feeling right now?"}
        </p>
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          {MOODS.map(({ value, emoji, label }) => {
            const selected = todayLog?.value === value
            return (
              <button
                key={value}
                onClick={() => onLogMood(value)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '6px', padding: '0.75rem 0.5rem',
                  background: selected ? C.primaryLight : '#f8f8f6',
                  border: `0.5px solid ${selected ? C.primary : C.border}`,
                  borderRadius: '12px', cursor: 'pointer', transition: 'background 0.15s',
                }}
              >
                <span style={{ fontSize: '26px', lineHeight: 1 }}>{emoji}</span>
                <span style={{ fontSize: '12px', fontWeight: selected ? 500 : 400, color: selected ? C.primary : C.muted }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Suggested activities */}
      {suggested.length > 0 && (
        <div style={{ margin: '1.25rem 1.25rem 0' }}>
          <p style={{ fontSize: '11px', fontWeight: 500, color: C.subtle, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.625rem' }}>
            Suggested for you
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {suggested.map(a => <ActivityCard key={a.id} activity={a} onStart={onStartActivity} />)}
          </div>
        </div>
      )}

      {/* Mood history chart */}
      {moodLogs.length > 0 && (
        <div style={{ margin: '1.25rem 1.25rem 0' }}>
          <MoodHistoryChart moodLogs={moodLogs} />
        </div>
      )}

      {/* Immediate support */}
      <div style={{ margin: '1.25rem 1.25rem 0' }}>
        <SupportPanel />
      </div>
    </div>
  )
}
