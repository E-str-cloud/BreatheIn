import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../app/App.tsx'

let playSpy: MockInstance<HTMLMediaElement['play']>

beforeEach(() => {
  playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

function playedSources() {
  return playSpy.mock.contexts.map((el) => (el as HTMLMediaElement).src)
}

function notAllowed() {
  const error = new Error('blocked')
  error.name = 'NotAllowedError'
  return error
}

async function enterActionScreen() {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Enter' }))
  return user
}

describe('Home screen', () => {
  it('shows only the app title and the Enter button', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'נשום פנימה' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading')).toHaveLength(1)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveAccessibleName('Enter')
  })

  it('does not play any sound on load', () => {
    const { container } = render(<App />)

    expect(playSpy).not.toHaveBeenCalled()
    expect(container.querySelector('audio, video')).toBeNull()
  })
})

describe('Action screen', () => {
  it('Enter opens the action screen and tries to play the fart sound', async () => {
    await enterActionScreen()

    expect(screen.queryByRole('heading', { name: 'נשום פנימה' })).not.toBeInTheDocument()
    expect(playSpy).toHaveBeenCalledTimes(1)
    expect(playedSources()[0]).toMatch(/fart.*\.mp3$/)
  })

  it('shows only the Play circle and Start, with no way back to the home screen', async () => {
    await enterActionScreen()

    const names = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? b.textContent)
    expect(names).toEqual(['Start', 'Start'])
    expect(screen.queryByRole('button', { name: 'Home' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'הפעלת קול' })).not.toBeInTheDocument()
  })

  it('groups the decorative rings in a rotating orbit that excludes the Play circle', async () => {
    await enterActionScreen()

    const orbit = document.querySelector('.action-screen__orbit')
    expect(orbit).not.toBeNull()
    expect(orbit).toHaveAttribute('aria-hidden', 'true')
    expect(orbit!.querySelectorAll('.action-screen__ring')).toHaveLength(5)

    const [playCircle] = screen.getAllByRole('button', { name: 'Start' })
    expect(orbit!.contains(playCircle)).toBe(false)
  })

  it('Start and the Play circle each play one sound from the catalog', async () => {
    const user = await enterActionScreen()
    const [playCircle, startButton] = screen.getAllByRole('button', { name: 'Start' })

    await user.click(startButton)
    await user.click(playCircle)
    await user.click(startButton)

    expect(playSpy).toHaveBeenCalledTimes(4)
    for (const src of playedSources()) {
      expect(src).toMatch(/(fart|burp|bouncy-cartoon|boing).*\.mp3$/)
    }
  })

  it('shows the muted-speaker retry button when playback is blocked, and retrying plays the sound', async () => {
    playSpy.mockRejectedValueOnce(notAllowed())
    const user = await enterActionScreen()

    const retry = await screen.findByRole('button', { name: 'הפעלת קול' })
    expect(retry).not.toHaveTextContent(/\S/)

    await user.click(retry)

    expect(playSpy).toHaveBeenCalledTimes(2)
    expect(playedSources()[1]).toMatch(/fart.*\.mp3$/)
    expect(screen.queryByRole('button', { name: 'הפעלת קול' })).not.toBeInTheDocument()
  })
})
