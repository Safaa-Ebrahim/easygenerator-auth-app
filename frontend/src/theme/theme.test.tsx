import { act, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderApp } from '../test/utils'

const html = document.documentElement

/** Replaces matchMedia with an OS theme the test can change. */
function fakeSystemTheme(initial: 'light' | 'dark') {
  const listeners = new Set<() => void>()
  const media = {
    matches: initial === 'dark',
    addEventListener: vi.fn((_type: string, listener: () => void) => listeners.add(listener)),
    removeEventListener: vi.fn((_type: string, listener: () => void) =>
      listeners.delete(listener),
    ),
  }
  vi.stubGlobal('matchMedia', () => media)
  return {
    listenerCount: () => listeners.size,
    change(theme: 'light' | 'dark') {
      media.matches = theme === 'dark'
      act(() => listeners.forEach((listener) => listener()))
    },
  }
}

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

  it('follows live OS changes only until the user picks a theme', async () => {
    const system = fakeSystemTheme('light')
    const { user } = renderApp('/signin')

    system.change('dark')
    expect(html.dataset.theme).toBe('dark')

    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }))
    system.change('dark')
    expect(html.dataset.theme).toBe('light')
  })

  it('watches the OS theme with one shared listener', () => {
    const system = fakeSystemTheme('light')
    const { unmount } = renderApp('/signin')

    expect(system.listenerCount()).toBe(1)
    unmount()
    expect(system.listenerCount()).toBe(0)
  })

  it('applies a theme chosen in another tab', () => {
    renderApp('/signin')

    window.localStorage.setItem('theme', 'dark')
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: 'dark' }))
    })

    expect(html.dataset.theme).toBe('dark')
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
  })

  // Keep last: the in-memory fallback choice lasts for the rest of this file.
  it('keeps the choice when storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is disabled', 'SecurityError')
    })
    const system = fakeSystemTheme('light')
    const { user } = renderApp('/signin')

    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    system.change('light')

    expect(html.dataset.theme).toBe('dark')
  })
})
