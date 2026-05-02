import { C } from '../constants.js'

const TYPE_COLORS = {
  breathing:  { bg: '#E1F5EE', text: C.primary },
  meditation: { bg: '#E6F1FB', text: C.blue },
  relaxation: { bg: '#F1EFE8', text: '#444441' },
}

export default function ActivityCard({ activity, onStart }) {
  const color = TYPE_COLORS[activity.type] ?? TYPE_COLORS.relaxation

  return (
    <div
      style={{
        background: C.card, border: `0.5px solid ${C.border}`,
        borderRadius: '14px', padding: '1rem 1.125rem',
        display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer',
      }}
      onClick={() => onStart(activity)}
    >
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: color.bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
      }}>
        <ActivityIcon type={activity.type} color={color.text} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: '15px', color: C.text, marginBottom: '2px' }}>
          {activity.title}
        </div>
        <div style={{ fontSize: '13px', color: C.muted, marginBottom: activity.description ? '6px' : 0 }}>
          {activity.subtitle}
        </div>
        {activity.description && (
          <div style={{ fontSize: '12px', color: C.subtle, lineHeight: 1.5 }}>
            {activity.description}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
        <span style={{
          fontSize: '11px', fontWeight: 500, padding: '2px 8px',
          borderRadius: '99px', background: color.bg, color: color.text,
        }}>
          {activity.tag}
        </span>
        <span style={{ fontSize: '11px', color: C.subtle }}>{activity.duration} min</span>
      </div>
    </div>
  )
}

function ActivityIcon({ type, color }) {
  if (type === 'breathing') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 8v4M12 16h.01"/>
    </svg>
  )
  if (type === 'meditation') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 100 8 4 4 0 000-8zM6 20c0-3.31 2.69-6 6-6s6 2.69 6 6"/>
      <path d="M3 20h18"/>
    </svg>
  )
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/>
    </svg>
  )
}
