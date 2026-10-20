// Line icons used by the app. They are decorative; the accessible name lives on the button.
const common = {
  'aria-hidden': true,
  focusable: false,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true" focusable="false">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill="currentColor" />
    </svg>
  )
}

// Speaker inside a circle with a diagonal slash ("sound off").
export function MutedSpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" {...common}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M7.5 10h2l3-2.5v9l-3-2.5h-2z" />
      <path d="M15 10.5c.6.8.6 2.2 0 3" />
      <path d="M5.3 5.3l13.4 13.4" />
    </svg>
  )
}
