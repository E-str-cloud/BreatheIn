import { expect, test, type Page } from '@playwright/test'

declare global {
  interface Window {
    __plays: HTMLMediaElement[]
  }
}

const SOUNDS = ['fart', 'burp', 'bouncy-cartoon', 'boing']
const SOUND_FILE = /\/(fart|burp|bouncy-cartoon|boing)-[\w-]+\.mp3$/

// Record every play() call so the test can check which sounds actually started.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__plays = []
    const originalPlay = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      window.__plays.push(this)
      return originalPlay.call(this)
    }
  })
})

// First full load: wait until the service worker is active and controls the page.
async function loadAndWaitForServiceWorker(page: Page) {
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)
}

async function cachedUrls(page: Page) {
  return page.evaluate(async () => {
    const urls: string[] = []
    for (const name of await caches.keys()) {
      const cache = await caches.open(name)
      for (const request of await cache.keys()) urls.push(new URL(request.url).pathname)
    }
    return urls
  })
}

// Expect the latest recorded sound to really play: it advances and has no load error.
async function expectLastSoundPlays(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const el = window.__plays[window.__plays.length - 1]
        return el.error === null && (el.currentTime > 0 || el.ended)
      }),
    )
    .toBe(true)
}

test('manifest is valid and its icons load', async ({ page, request }) => {
  await page.goto('/')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(href).toBeTruthy()

  const manifest = await (await request.get(new URL(href!, page.url()).href)).json()
  expect(manifest).toMatchObject({
    name: 'נשום פנימה',
    short_name: 'נשום פנימה',
    lang: 'he',
    dir: 'rtl',
    start_url: '/',
    scope: '/',
    display: 'standalone',
  })
  const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes)
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']))
  expect(manifest.icons.some((icon: { purpose?: string }) => icon.purpose === 'maskable')).toBe(true)

  for (const icon of manifest.icons) {
    const response = await request.get(`/${icon.src}`)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toBe('image/png')
  }
})

test('after the first load, the app, fonts and all four sounds are cached', async ({ page }) => {
  await loadAndWaitForServiceWorker(page)
  const urls = await cachedUrls(page)

  expect(urls).toContain('/index.html')
  expect(urls.some((url) => /^\/assets\/index-[\w-]+\.js$/.test(url))).toBe(true)
  expect(urls.some((url) => /^\/assets\/index-[\w-]+\.css$/.test(url))).toBe(true)
  expect(urls.some((url) => /^\/assets\/heebo-hebrew-400-normal-[\w-]+\.woff2$/.test(url))).toBe(true)
  for (const sound of SOUNDS) {
    expect(urls.some((url) => new RegExp(`^/assets/${sound}-[\\w-]+\\.mp3$`).test(url))).toBe(true)
  }
})

test('offline: the app opens, moves to the action screen and plays sounds', async ({ page, context }) => {
  const requests: string[] = []
  page.on('request', (req) => requests.push(req.url()))

  await loadAndWaitForServiceWorker(page)
  await context.setOffline(true)
  await page.reload()

  await expect(page.getByRole('heading', { name: 'נשום פנימה' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.fonts.check('700 32px Heebo', 'נשום'))).toBe(true)

  await page.getByRole('button', { name: 'Enter' }).click()
  await expect(page.getByRole('button', { name: 'Start' })).toHaveCount(2)
  await expectLastSoundPlays(page)
  expect(await page.evaluate(() => window.__plays[0].src)).toMatch(/\/fart-[\w-]+\.mp3$/)

  const [playCircle, start] = [
    page.getByRole('button', { name: 'Start' }).first(),
    page.getByRole('button', { name: 'Start' }).last(),
  ]
  for (let i = 0; i < 4; i++) {
    await (i % 2 ? playCircle : start).click()
    await expectLastSoundPlays(page)
  }
  await expect(page.getByRole('button', { name: 'הפעלת קול' })).toHaveCount(0)

  const played = await page.evaluate(() => window.__plays.map((el) => el.src))
  expect(played).toHaveLength(5)
  for (const src of played) expect(src).toMatch(SOUND_FILE)

  // Nothing is ever requested from another origin.
  for (const url of requests) expect(new URL(url).origin).toBe('http://localhost:4173')
})
