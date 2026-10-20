// Verifies after `vite build` that the service worker precaches every built file,
// including all four sounds, the fonts and the manifest icons.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const DIST = 'dist'
const SOUNDS = ['fart', 'burp', 'bouncy-cartoon', 'boing']
// Files that belong to the service worker itself and are not precached.
const SW_FILES = /^(sw\.js|workbox-[\w-]+\.js)$/

const errors = []

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? listFiles(path) : [relative(DIST, path).split(sep).join('/')]
  })
}

const sw = readFileSync(join(DIST, 'sw.js'), 'utf8')
const precached = new Set([...sw.matchAll(/url:"([^"]+)"/g)].map((match) => match[1]))

for (const file of listFiles(DIST)) {
  if (!SW_FILES.test(file) && !precached.has(file)) errors.push(`Not precached: ${file}`)
}

for (const sound of SOUNDS) {
  const pattern = new RegExp(`^assets/${sound}-[\\w-]+\\.mp3$`)
  if (![...precached].some((url) => pattern.test(url))) errors.push(`Sound missing from precache: ${sound}`)
}

if (![...precached].some((url) => /^assets\/heebo-hebrew-400-normal-[\w-]+\.woff2$/.test(url))) {
  errors.push('Heebo (Hebrew) font missing from precache')
}

const manifest = JSON.parse(readFileSync(join(DIST, 'manifest.webmanifest'), 'utf8'))
for (const icon of manifest.icons ?? []) {
  if (!existsSync(join(DIST, icon.src))) errors.push(`Manifest icon file missing: ${icon.src}`)
  if (!precached.has(icon.src)) errors.push(`Manifest icon not precached: ${icon.src}`)
}

if (errors.length > 0) {
  console.error(`Precache check failed:\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
console.log(`Precache check passed: ${precached.size} files, including ${SOUNDS.length} sounds, fonts and icons.`)
