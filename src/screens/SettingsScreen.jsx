import { C } from '../constants.js'

export default function SettingsScreen({ settings, onUpdateSettings }) {
  const toggle = key => onUpdateSettings({ ...settings, [key]: !settings[key] })

  return (
    <div style={{ paddingBottom: '80px' }}>
      <div style={{ padding: '1.25rem' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: '1.5rem' }}>Settings</h2>

        <Section label="Tracking">
          <ToggleRow
            label="Mood tracking"
            description="Log how you're feeling each day"
            on={settings.trackingOn}
            onToggle={() => toggle('trackingOn')}
          />
          <ToggleRow
            label="Save journal entries"
            description="Keep a history of past reflections"
            on={settings.saveJournal}
            onToggle={() => toggle('saveJournal')}
            last
          />
        </Section>

        <Section label="Audio">
          <ToggleRow
            label="Voice guide"
            description="Read each step aloud during activities"
            on={settings.voiceGuide ?? true}
            onToggle={() => toggle('voiceGuide')}
          />
          {(settings.voiceGuide ?? true) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderTop: `0.5px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: '15px', color: C.text, marginBottom: '2px' }}>Guide voice</div>
                <div style={{ fontSize: '12px', color: C.muted }}>Voice used during activities</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['female', 'male'].map(g => {
                  const active = (settings.voiceGender ?? 'female') === g
                  return (
                    <button
                      key={g}
                      onClick={() => onUpdateSettings({ ...settings, voiceGender: g })}
                      style={{
                        padding: '5px 14px', borderRadius: '99px', fontSize: '13px',
                        fontWeight: active ? 500 : 400, cursor: 'pointer',
                        background: active ? C.primary : 'none',
                        border: `0.5px solid ${active ? C.primary : C.border}`,
                        color: active ? '#fff' : C.muted,
                      }}
                    >
                      {g === 'female' ? 'Female' : 'Male'}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </Section>

        <Section label="Reminders">
          <ToggleRow
            label="Daily reminder"
            description="A single gentle nudge each day"
            on={settings.remindersOn}
            onToggle={() => toggle('remindersOn')}
          />
          {settings.remindersOn && (
            <div style={{ padding: '0 1rem 0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: C.muted }}>Reminder time</span>
              <input
                type="time"
                value={settings.reminderTime}
                onChange={e => onUpdateSettings({ ...settings, reminderTime: e.target.value })}
                style={{ border: `0.5px solid ${C.border}`, borderRadius: '8px', padding: '4px 8px', fontSize: '14px', color: C.text, background: C.bg, outline: 'none' }}
              />
            </div>
          )}
        </Section>

        <Section label="About">
          <div style={{ padding: '0.875rem 1rem' }}>
            <p style={{ fontSize: '14px', color: C.muted, lineHeight: 1.6 }}>
              CodeCalm is a private wellness tool built for first responders. Your journal entries and mood logs are stored only on this device.
            </p>
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.subtle, marginBottom: '0.5rem' }}>
        {label}
      </p>
      <div style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

function ToggleRow({ label, description, on, onToggle, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderBottom: last ? 'none' : `0.5px solid ${C.border}` }}
      onClick={onToggle}
    >
      <div>
        <div style={{ fontSize: '15px', fontWeight: 400, color: C.text, marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '12px', color: C.muted }}>{description}</div>
      </div>
      <div style={{
        width: '44px', height: '26px', borderRadius: '13px',
        background: on ? C.primary : '#d1d1ce',
        position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: '3px', left: on ? '21px' : '3px',
          width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
    </div>
  )
}
