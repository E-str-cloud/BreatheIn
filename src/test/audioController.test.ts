import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_PLAY_MS, createAudioController, type AudioLike } from '../features/action/audioController.ts'
import { getSound } from '../features/action/soundCatalog.ts'

class FakeAudio implements AudioLike {
  currentTime = 0
  volume = 1
  preload = ''
  playing = false
  // Result of the next play() call; resolves by default.
  nextPlay: () => Promise<void> = () => Promise.resolve()
  private listeners: Record<string, Array<() => void>> = {}
  readonly src: string

  constructor(src: string) {
    this.src = src
  }

  play = vi.fn(() => {
    const result = this.nextPlay()
    result.then(() => (this.playing = true), () => {})
    return result
  })

  pause = vi.fn(() => {
    this.playing = false
  })

  addEventListener(type: string, listener: () => void) {
    ;(this.listeners[type] ??= []).push(listener)
  }

  emit(type: string) {
    this.listeners[type]?.forEach((l) => l())
  }
}

function setup() {
  const elements = new Map<string, FakeAudio>()
  const controller = createAudioController((src) => {
    const el = new FakeAudio(src)
    elements.set(src, el)
    return el
  })
  const el = (id: Parameters<typeof getSound>[0]) => elements.get(getSound(id).src)!
  return { controller, el, elements }
}

function domError(name: string) {
  const error = new Error(name)
  error.name = name
  return error
}

const flush = () => Promise.resolve().then(() => Promise.resolve())

describe('audioController', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('preloads one element per sound', () => {
    const { elements } = setup()
    expect(elements.size).toBe(4)
    for (const el of elements.values()) expect(el.preload).toBe('auto')
  })

  it('plays the fart sound on entry and reports playing', async () => {
    const { controller, el } = setup()
    controller.playEntrySound()
    await flush()
    expect(el('fart').play).toHaveBeenCalledTimes(1)
    expect(controller.getStatus()).toBe('playing')
  })

  it('reports blocked when the browser rejects play() with NotAllowedError', async () => {
    const { controller, el } = setup()
    el('fart').nextPlay = () => Promise.reject(domError('NotAllowedError'))
    controller.playEntrySound()
    await flush()
    expect(controller.getStatus()).toBe('blocked')
  })

  it('reports error for other playback failures and file load errors', async () => {
    const { controller, el } = setup()
    el('burp').nextPlay = () => Promise.reject(domError('NotSupportedError'))
    controller.playSound('burp')
    await flush()
    expect(controller.getStatus()).toBe('error')

    controller.playSound('boing')
    await flush()
    el('boing').emit('error')
    expect(controller.getStatus()).toBe('error')
  })

  it('handles play() throwing synchronously', () => {
    const { controller, el } = setup()
    el('fart').play.mockImplementationOnce(() => {
      throw domError('NotAllowedError')
    })
    expect(() => controller.playEntrySound()).not.toThrow()
    expect(controller.getStatus()).toBe('blocked')
  })

  it('retries the last blocked sound and returns to playing', async () => {
    const { controller, el } = setup()
    el('boing').nextPlay = () => Promise.reject(domError('NotAllowedError'))
    controller.playSound('boing')
    await flush()
    expect(controller.getStatus()).toBe('blocked')

    el('boing').nextPlay = () => Promise.resolve()
    controller.retryLastSound()
    await flush()
    expect(el('boing').play).toHaveBeenCalledTimes(2)
    expect(controller.getStatus()).toBe('playing')
  })

  it('stops the previous sound before starting a new one (no overlap)', async () => {
    const { controller, el, elements } = setup()
    controller.playSound('fart')
    await flush()
    controller.playSound('burp')
    await flush()
    expect(el('fart').pause).toHaveBeenCalled()
    const playingNow = [...elements.values()].filter((e) => e.playing)
    expect(playingNow).toEqual([el('burp')])
  })

  it('restarts the same sound from the beginning when picked again', async () => {
    const { controller, el } = setup()
    controller.playSound('boing')
    await flush()
    el('boing').currentTime = 1.2
    controller.playSound('boing')
    expect(el('boing').currentTime).toBe(0)
    expect(el('boing').play).toHaveBeenCalledTimes(2)
  })

  it('cuts every sound off after two seconds', async () => {
    const { controller, el } = setup()
    controller.playSound('bouncy-cartoon')
    await flush()
    vi.advanceTimersByTime(MAX_PLAY_MS - 1)
    expect(controller.getStatus()).toBe('playing')
    vi.advanceTimersByTime(1)
    expect(el('bouncy-cartoon').pause).toHaveBeenCalled()
    expect(controller.getStatus()).toBe('idle')
  })

  it('returns to idle when a sound ends naturally', async () => {
    const { controller, el } = setup()
    controller.playSound('fart')
    await flush()
    el('fart').emit('ended')
    expect(controller.getStatus()).toBe('idle')
  })

  it('ignores the outcome of an outdated play() call', async () => {
    const { controller, el } = setup()
    let rejectOld: (e: Error) => void = () => {}
    el('fart').nextPlay = () => new Promise((_, reject) => (rejectOld = reject))
    controller.playSound('fart')
    controller.playSound('burp')
    rejectOld(domError('AbortError'))
    await flush()
    expect(controller.getStatus()).toBe('playing')
  })

  it('notifies subscribers on status changes', async () => {
    const { controller, el } = setup()
    const listener = vi.fn()
    const unsubscribe = controller.subscribe(listener)
    el('fart').nextPlay = () => Promise.reject(domError('NotAllowedError'))
    controller.playEntrySound()
    await flush()
    expect(listener).toHaveBeenCalledTimes(2) // playing, then blocked
    unsubscribe()
    controller.playSound('burp')
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
