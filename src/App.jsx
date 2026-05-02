import { useState } from 'react'
import { FONT } from './constants.js'
import { OfflineBanner } from '../OfflineBanner.jsx'
import { useServiceWorker } from '../useServiceWorker.js'
import { useStorage } from './hooks/useStorage.js'
import BottomNav from './components/BottomNav.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import ActivitiesScreen from './screens/ActivitiesScreen.jsx'
import JournalScreen from './screens/JournalScreen.jsx'
import SettingsScreen from './screens/SettingsScreen.jsx'
import BreathingScreen from './screens/BreathingScreen.jsx'
import MeditationScreen from './screens/MeditationScreen.jsx'
import RelaxationScreen from './screens/RelaxationScreen.jsx'

const DEFAULT_SETTINGS = {
  trackingOn: true,
  saveJournal: true,
  voiceGender: 'female',
  remindersOn: false,
  reminderTime: '18:00',
}

export default function App() {
  const sw = useServiceWorker()
  const [tab, setTab] = useState('home')
  const [session, setSession] = useState(null) // { activity }

  const [moodLogs, setMoodLogs]         = useStorage('cc_mood_logs', [])
  const [journalEntries, setJournalEntries] = useStorage('cc_journal_entries', [])
  const [activityLog, setActivityLog]   = useStorage('cc_activity_log', [])
  const [settings, setSettings]         = useStorage('cc_settings', DEFAULT_SETTINGS)

  const logMood = value => {
    const today = new Date().toISOString()
    setMoodLogs(prev => {
      const filtered = prev.filter(l => new Date(l.date).toDateString() !== new Date().toDateString())
      return [...filtered, { date: today, value }]
    })
  }

  const saveJournalEntry = entry => {
    setJournalEntries(prev => [...prev, entry])
  }

  const startActivity = activity => setSession({ activity })

  const endSession = activity => {
    if (activity) {
      setActivityLog(prev => [...prev, { activity_id: activity.id, completed_at: new Date().toISOString() }])
    }
    setSession(null)
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f8f8f6', fontFamily: FONT, color: '#2c2c2a', WebkitFontSmoothing: 'antialiased' }}>
      <OfflineBanner
        isOffline={sw.isOffline}
        isStale={sw.isStale}
        pendingWrites={sw.pendingWrites}
        updateReady={sw.updateReady}
        applyUpdate={sw.applyUpdate}
      />

      {session ? (
        // Full-screen activity session — no bottom nav
        (() => {
          const { activity } = session
          const props = { activity, voiceGender: settings.voiceGender, onBack: () => endSession(null), onComplete: () => endSession(activity) }
          if (activity.type === 'breathing')  return <BreathingScreen  {...props} />
          if (activity.type === 'meditation') return <MeditationScreen {...props} />
          if (activity.type === 'relaxation') return <RelaxationScreen {...props} />
          return null
        })()
      ) : (
        <>
          <div style={{ paddingTop: 0 }}>
            {tab === 'home' && (
              <HomeScreen
                moodLogs={settings.trackingOn ? moodLogs : []}
                onLogMood={logMood}
                onStartActivity={startActivity}
              />
            )}
            {tab === 'activities' && (
              <ActivitiesScreen onStartActivity={startActivity} />
            )}
            {tab === 'journal' && (
              <JournalScreen
                journalEntries={journalEntries}
                onSaveEntry={saveJournalEntry}
                saveJournal={settings.saveJournal}
                sw={sw}
              />
            )}
            {tab === 'settings' && (
              <SettingsScreen settings={settings} onUpdateSettings={setSettings} />
            )}
          </div>
          <BottomNav tab={tab} setTab={setTab} />
        </>
      )}
    </div>
  )
}
