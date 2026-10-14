import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** Shows a spinner, swaps the label and disables the button. */
  loading?: boolean
  loadingText?: string
}

// Each variant sets its own border color; a shared `border-transparent`
// would compete with `border-line-strong` and could hide the secondary border.
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-primary text-on-primary enabled:hover:bg-primary-hover',
  secondary: 'border-line-strong bg-surface text-fg enabled:hover:bg-canvas',
  soft: 'border-transparent bg-soft text-fg enabled:hover:bg-soft-hover',
  danger: 'border-transparent bg-danger-solid text-white enabled:hover:bg-danger-solid-hover',
}

export function Button({
  variant = 'primary',
  loading = false,
  loadingText,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={cn(
        'inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4.5 py-2.5 font-semibold',
        'motion-safe:transition-colors disabled:cursor-not-allowed disabled:opacity-70',
        variantClasses[variant],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && <Spinner />}
      <span>{loading && loadingText ? loadingText : children}</span>
    </button>
  )
}
