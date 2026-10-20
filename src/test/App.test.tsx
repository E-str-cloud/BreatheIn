import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../app/App.tsx'

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
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)

    const { container } = render(<App />)

    expect(playSpy).not.toHaveBeenCalled()
    expect(container.querySelector('audio, video')).toBeNull()
    playSpy.mockRestore()
  })
})
