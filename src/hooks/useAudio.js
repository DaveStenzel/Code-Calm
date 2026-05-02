import { useCallback, useRef, useEffect } from 'react'

const FEMALE_NAMES = ['Aria', 'Jenny', 'Natasha', 'Libby', 'Sonia', 'Hazel', 'Mia', 'Clara',
                      'Ava', 'Allison', 'Samantha', 'Zira', 'Kate', 'Karen', 'Moira', 'Victoria']
const MALE_NAMES   = ['Guy', 'Ryan', 'Davis', 'Tony', 'Jason', 'Andrew', 'Brian', 'Liam',
                      'Daniel', 'David', 'Mark', 'James', 'Thomas', 'Reed']

function pickVoice(voices, gender = 'female') {
  const en = voices.filter(v => v.lang.startsWith('en'))
  const names = gender === 'female' ? FEMALE_NAMES : MALE_NAMES

  const match = (v) => names.some(n => v.name.includes(n))

  // 1. Microsoft Neural "Natural" voice matching gender (Edge on Windows — best quality)
  const naturalMatch = en.find(v => v.name.includes('Natural') && match(v))
  if (naturalMatch) return naturalMatch

  // 2. Any Natural voice (neural, even if gender not detected)
  const anyNatural = en.find(v => v.name.includes('Natural'))
  if (anyNatural) return anyNatural

  // 3. Online/cloud voice matching gender
  const onlineMatch = en.find(v => v.name.includes('Online') && match(v))
  if (onlineMatch) return onlineMatch

  // 4. Any online voice
  const anyOnline = en.find(v => v.name.includes('Online'))
  if (anyOnline) return anyOnline

  // 5. Premium voice matching gender (macOS)
  const premiumMatch = en.find(v => v.name.includes('Premium') && match(v))
  if (premiumMatch) return premiumMatch

  // 6. Any Premium
  const anyPremium = en.find(v => v.name.includes('Premium'))
  if (anyPremium) return anyPremium

  // 7. Named voice matching gender
  for (const name of names) {
    const v = en.find(v => v.name.includes(name))
    if (v) return v
  }

  // 8. Prefer regional accents over flat en-US defaults
  for (const lang of ['en-AU', 'en-GB', 'en-IE', 'en-NZ']) {
    const v = en.find(v => v.lang === lang)
    if (v) return v
  }

  // 9. Any English voice
  return en[0] ?? voices[0] ?? null
}

export function useAudio(gender = 'female') {
  const voiceRef = useRef(null)

  useEffect(() => {
    const load = () => {
      const voices = speechSynthesis.getVoices()
      if (voices.length) voiceRef.current = pickVoice(voices, gender)
    }
    load()
    speechSynthesis.addEventListener('voiceschanged', load)
    return () => speechSynthesis.removeEventListener('voiceschanged', load)
  }, [gender])

  const speak = useCallback((text, onEnd) => {
    if (!('speechSynthesis' in window) || !text) { onEnd?.(); return }
    speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    if (voiceRef.current) utt.voice = voiceRef.current
    utt.rate = 0.82
    utt.pitch = 1.0
    if (onEnd) utt.onend = onEnd
    speechSynthesis.speak(utt)
  }, [])

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) speechSynthesis.cancel()
  }, [])

  return { speak, stop }
}
