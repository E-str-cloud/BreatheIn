import { ENTRY_SOUND_ID, SOUND_CATALOG, getSound, pickRandomSound, type SoundId } from './soundCatalog.ts'

export type AudioStatus = 'idle' | 'playing' | 'blocked' | 'error'

// The subset of HTMLAudioElement the controller relies on (keeps it easy to fake in tests).
export type AudioLike = {
  play(): Promise<void> | void
  pause(): void
  currentTime: number
  volume: number
  preload: string
  addEventListener(type: 'ended' | 'error', listener: () => void): void
}

export type CreateAudio = (src: string) => AudioLike

export type AudioController = {
  playSound(id: SoundId): void
  playEntrySound(): void
  playRandomSound(random?: () => number): void
  retryLastSound(): void
  getStatus(): AudioStatus
  subscribe(listener: () => void): () => void
}

// Every sound is cut off after this long, even if the file is longer.
export const MAX_PLAY_MS = 2000

const defaultCreateAudio: CreateAudio = (src) => new Audio(src)

export function createAudioController(createAudio: CreateAudio = defaultCreateAudio): AudioController {
  const listeners = new Set<() => void>()
  const elements = new Map<SoundId, AudioLike>()
  let status: AudioStatus = 'idle'
  let lastSoundId: SoundId = ENTRY_SOUND_ID
  let current: AudioLike | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  // Incremented on every play so results of outdated play() calls are ignored.
  let request = 0

  function setStatus(next: AudioStatus) {
    if (status === next) return
    status = next
    listeners.forEach((listener) => listener())
  }

  // Stops the active sound (if any) without changing the status.
  function halt() {
    clearTimeout(timer)
    timer = undefined
    if (current) {
      current.pause()
      current.currentTime = 0
      current = null
    }
  }

  function finish(element: AudioLike, next: AudioStatus) {
    if (element !== current) return
    request++
    halt()
    setStatus(next)
  }

  // One reusable, preloaded element per sound.
  for (const sound of SOUND_CATALOG) {
    const element = createAudio(sound.src)
    element.preload = 'auto'
    element.addEventListener('ended', () => finish(element, 'idle'))
    element.addEventListener('error', () => finish(element, 'error'))
    elements.set(sound.id, element)
  }

  function fail(req: number, error: unknown) {
    if (req !== request) return
    request++
    halt()
    const blocked = error instanceof Error && error.name === 'NotAllowedError'
    setStatus(blocked ? 'blocked' : 'error')
  }

  function playSound(id: SoundId) {
    // Never overlap: a new sound always replaces the previous one.
    halt()
    const req = ++request
    const element = elements.get(id)!
    element.volume = getSound(id).volume
    element.currentTime = 0
    current = element
    lastSoundId = id
    setStatus('playing')

    let result: Promise<void> | void
    try {
      result = element.play()
    } catch (error) {
      fail(req, error)
      return
    }
    Promise.resolve(result).then(
      () => {
        if (req !== request) return
        timer = setTimeout(() => finish(element, 'idle'), MAX_PLAY_MS)
      },
      (error: unknown) => fail(req, error),
    )
  }

  return {
    playSound,
    playEntrySound: () => playSound(ENTRY_SOUND_ID),
    playRandomSound: (random) => playSound(pickRandomSound(random).id),
    retryLastSound: () => playSound(lastSoundId),
    getStatus: () => status,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
