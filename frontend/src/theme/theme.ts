import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

// Keep in sync with the inline script in index.html.
const STORAGE_KEY = 'theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

const listeners = new Set<() => void>()

function readSavedTheme(): Theme | null {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

function readTheme(): Theme {
  const attribute = document.documentElement.dataset.theme
  return attribute === 'light' || attribute === 'dark' ? attribute : (readSavedTheme() ?? systemTheme())
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  for (const listener of listeners) listener()
}

/** Saves an explicit choice; from then on the system preference is ignored. */
export function setTheme(theme: Theme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage unavailable: the choice still applies until reload.
  }
  applyTheme(theme)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Follow live OS theme changes until the user picks a theme.
  const media = window.matchMedia(DARK_QUERY)
  const onSystemChange = () => {
    if (!readSavedTheme()) applyTheme(systemTheme())
  }
  media.addEventListener('change', onSystemChange)
  return () => {
    listeners.delete(listener)
    media.removeEventListener('change', onSystemChange)
  }
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme)
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')
  return { theme, toggleTheme }
}
