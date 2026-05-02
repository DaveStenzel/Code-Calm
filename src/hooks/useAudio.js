import { useCallback, useRef, useEffect } from 'react'

function pickVoice(voices) {
  const en = voices.filter(v => v.lang.startsWith('en'))

  // 1. Microsoft Neural "Natural" voices (Edge on Windows — best quality)
  //    e.g. "Microsoft Natasha Online (Natural) - English (Australia)"
  const natural = en.find(v => v.name.includes('Natural'))
  if (natural) return natural

  // 2. Any online/cloud voice (still far better than local synth)
  const online = en.find(v => v.name.includes('Online'))
  if (online) return online

  // 3. macOS/iOS Premium voices
  const premium = en.find(v => v.name.includes('Premium'))
  if (premium) return premium

  // 4. Known good named voices across platforms
  const NAMED = ['Ava', 'Allison', 'Samantha', 'Aria', 'Zira', 'Kate', 'Karen', 'Moira', 'Daniel']
  for (const name of NAMED) {
    const v = en.find(v => v.name.includes(name))
    if (v) return v
  }

  // 5. Prefer regional accents over flat en-US defaults
  for (const lang of ['en-AU', 'en-GB', 'en-IE', 'en-NZ']) {
    const v = en.find(v => v.lang === lang)
    if (v) return v
  }

  // 6. Any English voice
  return en[0] ?? voices[0] ?? null
}

export function useAudio() {
  const voiceRef = useRef(null)

  useEffect(() => {
    const load = () => {
      const voices = speechSynthesis.getVoices()
      if (voices.length) voiceRef.current = pickVoice(voices)
    }
    load()
    speechSynthesis.addEventListener('voiceschanged', load)
    return () => speechSynthesis.removeEventListener('voiceschanged', load)
  }, [])

  const speak = useCallback((text) => {
    if (!('speechSynthesis' in window) || !text) return
    speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    if (voiceRef.current) utt.voice = voiceRef.current
    utt.rate = 0.82   // slightly slower — calmer, less robotic
    utt.pitch = 1.0   // never raise pitch (makes voices sound synthetic)
    speechSynthesis.speak(utt)
  }, [])

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) speechSynthesis.cancel()
  }, [])

  return { speak, stop }
}
