import { describe, expect, it } from 'vitest'
import { ENTRY_SOUND_ID, SOUND_CATALOG, pickRandomSound } from '../features/action/soundCatalog.ts'

describe('soundCatalog', () => {
  it('contains exactly the four sounds, each with a local source', () => {
    expect(SOUND_CATALOG.map((s) => s.id)).toEqual(['fart', 'burp', 'bouncy-cartoon', 'boing'])
    for (const sound of SOUND_CATALOG) {
      expect(sound.src).toMatch(/\.mp3$/)
      expect(sound.src).not.toMatch(/^https?:/)
      expect(sound.volume).toBeGreaterThan(0)
      expect(sound.volume).toBeLessThanOrEqual(1)
    }
  })

  it('uses the fart sound on entry', () => {
    expect(ENTRY_SOUND_ID).toBe('fart')
  })

  it('can pick every one of the four sounds', () => {
    const picked = [0, 0.25, 0.5, 0.75, 0.999].map((r) => pickRandomSound(() => r).id)
    expect(new Set(picked)).toEqual(new Set(['fart', 'burp', 'bouncy-cartoon', 'boing']))
  })

  it('allows the same sound to be picked twice in a row', () => {
    const first = pickRandomSound(() => 0.3)
    const second = pickRandomSound(() => 0.3)
    expect(second.id).toBe(first.id)
  })

  it('reaches all sounds with the real random source', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 400; i++) seen.add(pickRandomSound().id)
    expect(seen.size).toBe(4)
  })
})
