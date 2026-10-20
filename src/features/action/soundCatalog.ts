import fartUrl from '../../assets/sounds/fart.mp3'
import burpUrl from '../../assets/sounds/burp.mp3'
import bouncyCartoonUrl from '../../assets/sounds/bouncy-cartoon.mp3'
import boingUrl from '../../assets/sounds/boing.mp3'

export type SoundId = 'fart' | 'burp' | 'bouncy-cartoon' | 'boing'

export type Sound = {
  id: SoundId
  src: string
  // Per-sound volume (0–1) used to balance loudness without editing the files.
  volume: number
}

// Single source of truth for the app's sounds.
export const SOUND_CATALOG: readonly Sound[] = [
  { id: 'fart', src: fartUrl, volume: 1 },
  { id: 'burp', src: burpUrl, volume: 1 },
  { id: 'bouncy-cartoon', src: bouncyCartoonUrl, volume: 1 },
  { id: 'boing', src: boingUrl, volume: 1 },
]

export const ENTRY_SOUND_ID: SoundId = 'fart'

// Every sound is a candidate on every pick; repeats are intentionally allowed.
export function pickRandomSound(random: () => number = Math.random): Sound {
  const index = Math.min(Math.floor(random() * SOUND_CATALOG.length), SOUND_CATALOG.length - 1)
  return SOUND_CATALOG[index]
}

export function getSound(id: SoundId): Sound {
  const sound = SOUND_CATALOG.find((s) => s.id === id)
  if (!sound) throw new Error(`Unknown sound: ${id}`)
  return sound
}
