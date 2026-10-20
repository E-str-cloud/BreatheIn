import { expect, test, type Page } from '@playwright/test'

declare global {
  interface Window {
    __plays: HTMLMediaElement[]
    __blockPlay: boolean
  }
}

const SOUND_FILE = /\/(fart|burp|bouncy-cartoon|boing)[^/]*\.mp3$/

// Record every play() call and optionally simulate the browser blocking playback.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__plays = []
    window.__blockPlay = false
    const originalPlay = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      window.__plays.push(this)
      if (window.__blockPlay) {
        return Promise.reject(new DOMException('Blocked for test', 'NotAllowedError'))
      }
      return originalPlay.call(this)
    }
  })
  await page.goto('/')
})

const playedSources = (page: Page) => page.evaluate(() => window.__plays.map((el) => el.src))

test('home screen shows the title and Enter, without playing sound', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'נשום פנימה' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Enter' })).toBeVisible()
  expect(await playedSources(page)).toEqual([])
})

test('Enter opens the action screen and plays the fart sound', async ({ page }) => {
  await page.getByRole('button', { name: 'Enter' }).click()

  await expect(page.getByRole('button', { name: 'Start' })).toHaveCount(2)
  await expect(page.getByRole('button', { name: 'Home' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'הפעלת קול' })).toHaveCount(0)

  const sources = await playedSources(page)
  expect(sources).toHaveLength(1)
  expect(sources[0]).toMatch(/\/fart[^/]*\.mp3$/)
  // The sound really started playing in the browser.
  await expect.poll(() => page.evaluate(() => window.__plays[0].currentTime)).toBeGreaterThan(0)
})

test('Start and the Play circle play one random sound per press, never overlapping', async ({ page }) => {
  await page.getByRole('button', { name: 'Enter' }).click()
  const [playCircle, start] = [
    page.getByRole('button', { name: 'Start' }).first(),
    page.getByRole('button', { name: 'Start' }).last(),
  ]

  for (let i = 0; i < 6; i++) {
    await (i % 2 ? playCircle : start).click()
  }

  const sources = await playedSources(page)
  expect(sources).toHaveLength(7)
  for (const src of sources) expect(src).toMatch(SOUND_FILE)

  const active = await page.evaluate(() => new Set(window.__plays.filter((el) => !el.paused)).size)
  expect(active).toBeLessThanOrEqual(1)
})

test('every sound file is local and at most two seconds long', async ({ page }) => {
  await page.getByRole('button', { name: 'Enter' }).click()
  for (let i = 0; i < 30; i++) await page.getByRole('button', { name: 'Start' }).last().click()

  const durations = await page.evaluate(async () => {
    const unique = [...new Set(window.__plays.map((el) => el.src))]
    return Promise.all(
      unique.map(
        (src) =>
          new Promise<[string, number]>((resolve) => {
            const audio = new Audio()
            audio.addEventListener('loadedmetadata', () => resolve([src, audio.duration]))
            audio.src = src
          }),
      ),
    )
  })

  for (const [src, duration] of durations) {
    expect(new URL(src).origin).toBe('http://localhost:5173')
    expect(duration).toBeLessThanOrEqual(2.05)
  }
})

test('blocked playback shows the muted-speaker button, and pressing it plays the sound', async ({ page }) => {
  await page.evaluate(() => (window.__blockPlay = true))
  await page.getByRole('button', { name: 'Enter' }).click()

  const retry = page.getByRole('button', { name: 'הפעלת קול' })
  await expect(retry).toBeVisible()
  await expect(retry).toHaveText('')

  await page.evaluate(() => (window.__blockPlay = false))
  await retry.click()

  await expect(retry).toHaveCount(0)
  const sources = await playedSources(page)
  expect(sources).toHaveLength(2)
  expect(sources[1]).toMatch(/\/fart[^/]*\.mp3$/)
})

test('the action screen has no way back; reopening the app shows the home screen', async ({ page }) => {
  await page.getByRole('button', { name: 'Enter' }).click()
  await expect(page.getByRole('button')).toHaveCount(2)
  await expect(page.getByRole('link')).toHaveCount(0)

  await page.reload()
  await expect(page.getByRole('heading', { name: 'נשום פנימה' })).toBeVisible()
  expect(await playedSources(page)).toEqual([])
})

test('no horizontal scrolling on the action screen', async ({ page }) => {
  await page.getByRole('button', { name: 'Enter' }).click()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})
