import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

type AlertVariant = 'error' | 'success' | 'info'

interface AlertProps {
  variant: AlertVariant
  children: ReactNode
}

const variantClasses: Record<AlertVariant, string> = {
  error: 'border-danger-line bg-danger-bg text-danger',
  success: 'border-success-line bg-success-bg text-success',
  info: 'border-info-line bg-info-bg text-info',
}

/** Errors interrupt assistive tech (role="alert"); other notices are polite. */
export function Alert({ variant, children }: AlertProps) {
  return (
    <div
      className={cn('rounded-lg border px-4 py-3 text-[0.95rem]', variantClasses[variant])}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  )
}
