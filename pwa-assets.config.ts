import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Generates every app icon size from the single SVG source in public/.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    // The source already has a full-bleed background and keeps its rings inside the maskable safe zone.
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background: '#FAF9F6' } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: '#FAF9F6' } },
  },
  images: ['public/icon-source.svg'],
})
