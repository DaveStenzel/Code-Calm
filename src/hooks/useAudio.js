import { useCallback, useRef, useEffect } from 'react'

const VOICE_PRIORITY = ['Ava', 'Allison', 'Aria', 'Kate', 'Karen', 'Moira', 'Daniel']

function pickVoice(voices) {
  for (const name of VOICE_PRIORITY) {
    const v = voices.find(v => v.name.includes(name) && v.lang.startsWith('en'))
    if (v) return v
  }
  for (const lang of ['en-AU', 'en-GB', 'en-IE']) {
    const v = voices.find(v => v.lang === lang)
    if (v) return v
  }
  return voices.find(v => v.lang.startsWith('en')) ?? voices[0] ?? null
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
    utt.rate = 0.86
    utt.pitch = 1.0
    speechSynthesis.speak(utt)
  }, [])

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) speechSynthesis.cancel()
  }, [])

  return { speak, stop }
}
