import { expect, test, type Locator, type Page } from '@playwright/test'

const orbitTransform = (page: Page) =>
  page.locator('.action-screen__orbit').evaluate((el) => getComputedStyle(el).transform)

const animationName = (locator: Locator) => locator.evaluate((el) => getComputedStyle(el).animationName)

// Samples the transform twice; a running rotation yields two different matrices.
async function expectRotating(page: Page) {
  const first = await orbitTransform(page)
  await page.waitForTimeout(500)
  const second = await orbitTransform(page)
  expect(second).not.toBe(first)
}

async function expectStill(locator: Locator, page: Page) {
  const first = await locator.boundingBox()
  await page.waitForTimeout(500)
  const second = await locator.boundingBox()
  expect(second).toEqual(first)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('the home screen has no running animation', async ({ page }) => {
  const animated = await page.evaluate(() => document.getAnimations().length)
  expect(animated).toBe(0)
})

test('the rings and the white disc rotate while the Play button, its icon and Start stay still', async ({ page }) => {
  await page.getByRole('button', { name: 'Enter' }).click()
  const playCircle = page.getByRole('button', { name: 'Start' }).first()
  const start = page.getByRole('button', { name: 'Start' }).last()

  expect(await animationName(page.locator('.action-screen__orbit'))).toBe('action-screen-orbit')
  expect(await animationName(playCircle)).toBe('none')
  expect(await animationName(page.locator('.action-screen__play-disc'))).toBe('action-screen-orbit')
  expect(await animationName(playCircle.locator('svg'))).toBe('none')
  await expectRotating(page)
  await expectStill(playCircle, page)
  await expectStill(playCircle.locator('svg'), page)
  await expectStill(start, page)

  // Only the rings' orbit and the white disc animate on the screen.
  const animated = await page.evaluate(() =>
    document.getAnimations().map((a) => ((a.effect as KeyframeEffect).target as Element).className),
  )
  expect(animated.sort()).toEqual(['action-screen__orbit', 'action-screen__play-disc'])
})

test('the rings keep rotating while a sound plays, and the Play circle still works', async ({ page }) => {
  await page.getByRole('button', { name: 'Enter' }).click()
  await page.getByRole('button', { name: 'Start' }).first().click()
  await expectRotating(page)
  await page.getByRole('button', { name: 'Start' }).last().click()
  await expectRotating(page)
})

test('the rotating rings stay inside the screen with no horizontal scrolling', async ({ page }) => {
  await page.getByRole('button', { name: 'Enter' }).click()
  for (let i = 0; i < 4; i++) {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)

    const rings = await page.locator('.action-screen__ring').evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect()).map((r) => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom })),
    )
    const { width, height } = page.viewportSize()!
    for (const r of rings) {
      expect(r.left).toBeGreaterThanOrEqual(0)
      expect(r.top).toBeGreaterThanOrEqual(0)
      expect(r.right).toBeLessThanOrEqual(width)
      expect(r.bottom).toBeLessThanOrEqual(height)
    }
    await page.waitForTimeout(250)
  }
})

test('with reduced motion the rings stand still and the screen works as usual', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Enter' }).click()

  expect(await animationName(page.locator('.action-screen__orbit'))).toBe('none')
  expect(await animationName(page.locator('.action-screen__play-disc'))).toBe('none')
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0)
  await expect(page.getByRole('button', { name: 'Start' })).toHaveCount(2)
})
