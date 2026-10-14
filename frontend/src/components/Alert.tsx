import type { ReactNode } from 'react'

/**
 * Inline error shown above a form or failed view. It stays until the user
 * acts, unlike transient notices, which are toasts. role="alert" announces it
 * immediately to assistive tech.
 */
export function Alert({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-lg border border-danger-line bg-danger-bg px-4 py-3 text-[0.95rem] text-danger"
      role="alert"
    >
      {children}
    </div>
  )
}
