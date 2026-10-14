import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

// Keep in sync with the inline script in index.html.
const STORAGE_KEY = 'theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

const listeners = new Set<() => void>()
/** The explicit choice made in this tab, kept for when storage is unavailable. */
let chosenTheme: Theme | null = null
let stopWatching: (() => void) | null = null

function readSavedTheme(): Theme | null {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Storage unavailable: fall back to this tab's choice.
  }
  return chosenTheme
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
    // Storage unavailable: remember the choice in memory until reload.
    chosenTheme = theme
  }
  applyTheme(theme)
}

/**
 * Watches for outside theme changes: the OS theme (until the user picks one)
 * and a choice made in another tab. Shared by all subscribers.
 */
function startWatching() {
  const media = window.matchMedia(DARK_QUERY)
  const onSystemChange = () => {
    if (!readSavedTheme()) applyTheme(systemTheme())
  }
  // Fires only for changes made by other tabs; key is null when storage is cleared.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      applyTheme(readSavedTheme() ?? systemTheme())
    }
  }
  media.addEventListener('change', onSystemChange)
  window.addEventListener('storage', onStorage)
  return () => {
    media.removeEventListener('change', onSystemChange)
    window.removeEventListener('storage', onStorage)
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  stopWatching ??= startWatching()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      stopWatching?.()
      stopWatching = null
    }
  }
}

/** The theme currently on screen, and a function to switch it. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme)
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')
  return { theme, toggleTheme }
}
