import { useState } from 'react'
import { C } from '../constants.js'
import { SUPPORT_RESOURCES } from '../data.js'

export default function SupportPanel() {
  const [open, setOpen] = useState(false)
  const { emergency, crisis, firstResponder, talkToSomeone } = SUPPORT_RESOURCES

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: open ? '#FFF3E0' : C.card,
          border: `0.5px solid ${open ? '#FBCB9A' : C.border}`,
          borderRadius: '14px', padding: '0.875rem 1.125rem',
          cursor: 'pointer', transition: 'background 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>🆘</span>
          <span style={{ fontWeight: 500, fontSize: '15px', color: C.text }}>Immediate Support</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

          {/* Emergency */}
          <a href={`tel:${emergency.number}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#FEE2E2', border: '0.5px solid #FCA5A5',
              borderRadius: '12px', padding: '0.75rem 1rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px', color: '#991B1B' }}>{emergency.label}</div>
                <div style={{ fontSize: '12px', color: '#B91C1C' }}>{emergency.note}</div>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#991B1B' }}>{emergency.number}</div>
            </div>
          </a>

          <SectionLabel>Crisis Lines · 24/7</SectionLabel>
          {crisis.map(r => <ResourceRow key={r.name} r={r} />)}

          <SectionLabel>Built for First Responders</SectionLabel>
          {firstResponder.map(r => <ResourceRow key={r.name} r={r} />)}

          <SectionLabel>Talk to Someone</SectionLabel>
          {talkToSomeone.map(r => <ResourceRow key={r.name} r={r} />)}
        </div>
      )}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.subtle, padding: '4px 4px 0' }}>
      {children}
    </div>
  )
}

function ResourceRow({ r }) {
  const href = r.type === 'phone' ? `tel:${r.contact}` : `https://${r.contact}`
  return (
    <a href={href} target={r.type === 'web' ? '_blank' : undefined} rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
      <div style={{
        background: C.card, border: `0.5px solid ${C.border}`,
        borderRadius: '12px', padding: '0.75rem 1rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: '14px', color: C.text, marginBottom: '2px' }}>{r.name}</div>
            <div style={{ fontSize: '12px', color: C.muted }}>{r.note}</div>
          </div>
          <div style={{ fontSize: '13px', color: C.primary, fontWeight: 500, textAlign: 'right', flexShrink: 0 }}>
            {r.type === 'phone' ? r.contact : 'Visit →'}
          </div>
        </div>
      </div>
    </a>
  )
}
