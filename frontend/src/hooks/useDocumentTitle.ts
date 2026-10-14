import { useEffect } from 'react'

const APP_NAME = 'Easygenerator'

/** Gives each route a distinct title, which screen readers announce on navigation. */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · ${APP_NAME}`
  }, [title])
}
