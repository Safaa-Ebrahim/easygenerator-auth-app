import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/utils'

const html = document.documentElement

describe('theme toggle', () => {
  it('follows the system theme until the user chooses one', async () => {
    // The test matchMedia stub reports a light system theme.
    const { user } = renderApp('/signin')

    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))

    expect(html.dataset.theme).toBe('dark')
    expect(window.localStorage.getItem('theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }))
    expect(html.dataset.theme).toBe('light')
    expect(window.localStorage.getItem('theme')).toBe('light')
  })

  it('uses the theme applied before React loaded', () => {
    html.dataset.theme = 'dark'
    renderApp('/signin')
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
  })
})
