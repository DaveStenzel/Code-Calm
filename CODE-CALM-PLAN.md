# Code Calm — First Responder Wellness App
## Project Plan

---

## Intent & Goal

A mental wellness app designed specifically for people in high-stress, demanding roles like police officers, firefighters, paramedics, and correctional officers. The app provides simple, accessible wellness activities (meditation, breathing exercises, journaling, relaxation techniques) that can be done in short windows between shifts or at home. The goal is to reduce stress and burnout by giving users practical tools they can reach for anytime, without pressure or complexity.

---

## Audience & Roles

- Single user role (individual account)
- Target audience: first responders and emergency services workers
- Tools must be quick, simple, and non-clinical
- No admin role needed — users manage only their own data

---

## Screen Map

| Screen | Purpose |
|---|---|
| Home | Mood check-in (emoji scale) + suggested activities |
| Activities | Browse/filter by type and duration |
| Breathing exercise | Animated circle + guided audio |
| Meditation | Step-through guided text prompt |
| Journal | Prompt + free-text entry + past entries |
| Relaxation | Step-by-step instructions (PMR, grounding) |
| Mood history | Weekly bar chart (toggleable) |
| Settings | Toggle tracking, reminders, preferences |

---

## Core Flows

1. User opens app → mood check-in (rough / okay / good emoji) → suggested activities
2. User browses Activities library → filters by type or time → taps activity → guided session
3. **Breathing:** animated expanding/contracting circle + guided voice audio
4. **Meditation:** guided text prompt broken into steps → mark complete
5. **Journal:** prompt shown → free-text entry → saved privately → reviewable
6. **Relaxation:** step-by-step cards (PMR, 5-4-3-2-1 grounding) + guided voice audio
7. **Mood tracking:** log after activity or standalone → weekly chart → toggle on/off in Settings

---

## Activity Types & Content

### Breathing
- Animated CSS circle (expand = inhale, hold, contract = exhale)
- Guided voice audio — single calm neutral voice
- Activities: Box breathing (4 min), 4-7-8 breathing (3 min)
- Phase timings driven by activity data, not hardcoded

### Meditation
- Guided text prompt broken into pages
- User taps through steps, marks complete
- Duration: 5–10 min

### Journaling
- Prompt displayed (e.g. "What's one thing that went well today?")
- Free-text input, saved privately with timestamp
- Past entries list with date + preview

### Relaxation
- Progressive muscle relaxation (PMR) — 8 min
- 5-4-3-2-1 grounding — 5 min
- Step-by-step plain language cards + guided voice audio

---

## Guided Audio — Voice Configuration

Single neutral guide voice (no gender selection). Voice selected automatically using a priority list ordered by naturalness:

**Priority order:**
1. Neural/Enhanced voices: Ava, Allison (macOS), Aria (Windows Neural), Kate/Karen/Moira/Daniel (regional accents)
2. Any en-AU / en-GB / en-IE voice (warmer than en-US defaults)
3. First available English voice

**Settings:** Pitch 1.0 (never raised — higher pitch causes robotic sound), Rate 0.86 (calm, unhurried)

**Script layers per activity:**
- Intro — plays before first phase
- Per-phase instructions — fire as each phase starts
- Closing affirmation — on completion

---

## Immediate Support Feature

Highly visible button on the home screen. Expands to show crisis lines and peer support resources for Australian first responders.

### Emergency
- **000** — Police, Ambulance, Fire

### Crisis Lines (24/7)
- **Lifeline** — 13 11 14
- **Beyond Blue** — 1300 22 4636
- **Suicide Call Back Service** — 1300 659 467

### Built for First Responders
- **Black Dog Institute — NEWSS** (National Emergency Worker Support Service) — free specialist therapy for emergency workers — nationalemergencyworkersupportservice.blackdoginstitute.org.au
- **Beyond Blue — Police & Emergency Services** — beyondblue.org.au/who-does-it-affect/police-and-emergency-service-workers
- **Code 9 Foundation** — peer support & community for first responders with PTSD — code9ptsd.org.au

### Talk to Someone
- **MensLine Australia** — 1300 789 978
- **Open Arms** (veterans & families) — 1800 011 046

---

## Offline / Service Worker Strategy

Users may be in areas with no signal (basements, remote sites). All activity content is available offline.

### Caching strategies by resource type

| Resource | Strategy |
|---|---|
| App shell (HTML, CSS, JS) | Cache First |
| Activity content (activities.json, affirmations.json) | Cache First — pre-cached at install |
| API reads (journal entries, mood logs) | Network First with cache fallback |
| Offline writes (journal, mood) | Queue in IndexedDB → Background Sync |

### Files
- `service-worker.js` — routing, cache strategies, sync queue
- `useServiceWorker.js` — React hook exposing isOffline, pendingWrites, queueWrite()
- `OfflineBanner.jsx` — status strip (offline / stale data / update ready)
- `offline.html` — fallback page with plain-text breathing instruction

### Key behaviours
- Activity content pre-cached on first app load — no "download for offline" step needed
- Journal/mood saves queue optimistically — UI updates immediately, syncs when online
- Toggling tracking off hides UI only — data is retained, restored when toggled back on

---

## Data Model

### User data (stored in Base44 backend)
- `mood_logs` — date, value (1–3), note
- `journal_entries` — id, prompt_id, body, created_at
- `activity_log` — activity_id, completed_at, duration
- `settings` — tracking_on, reminders_on, reminder_time

### Static content (shipped as JSON in app bundle)
- `activities[]` — id, type, title, duration_min, steps[], scripts{}
- `journal_prompts[]` — id, text
- `affirmations[]` — id, text
- `support-resources.json` — crisis line numbers and URLs

---

## Design Principles

- **Palette:** White base, muted blues (#185FA5) and greens (#0F6E56) for accents, cool grey neutrals
- **Typography:** Clear readable sans-serif, no jargon
- **Tone:** Plain, human, encouraging — like a trusted colleague, not a doctor or app coach
- **No pressure mechanics:** No streaks, no completion percentages on home screen, no "you missed X days" messaging
- **Reminders:** Opt-in only, gentle, single daily maximum
- **Layout:** Generous white space, simple rounded cards, never overwhelming the user with too many choices

---

## Tech Stack

- **Frontend:** React + Tailwind CSS
- **Backend:** Base44 (user data storage)
- **Offline:** Service Worker + Cache Storage API + Background Sync + IndexedDB
- **Audio:** Web Speech API (SpeechSynthesis) — no external audio files needed
- **Animations:** CSS keyframes (breathing circle scale transform)
- **Charts:** Recharts or plain SVG for mood history

---

## Files Built So Far

| File | Purpose |
|---|---|
| `AudioActivityCard.jsx` | Breathing and relaxation cards with guided audio playback |
| `service-worker.js` | Offline caching and Background Sync |
| `useServiceWorker.js` | React hook for SW registration and offline state |
| `OfflineBanner.jsx` | Offline/stale/update status banner + fetch wrapper |
| `offline.html` | Fallback page served when fully offline before cache warms |

---

## Suggested Build Order

1. Home screen + mood check-in
2. Activities library (browse + filter)
3. Breathing exercise flow (circle animation + audio)
4. Meditation flow
5. Journaling flow
6. Relaxation flow (PMR + grounding)
7. Mood tracking + weekly chart
8. Settings + toggles
9. Immediate Support button + resources panel
10. Service worker + offline strategy
11. Polish, tone review, accessibility pass

---

## GitHub Repository

github.com/DaveStenzel/Code-Calm
