import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../lib/cn'

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'value' | 'children'> {
  label: string
  name: string
  value: string
  error?: string
  /** Helper content rendered below the input and linked via aria-describedby. */
  hint?: ReactNode
  /** Control rendered inside the input frame, e.g. a visibility toggle. */
  trailing?: ReactNode
}

const inputClasses = cn(
  'min-h-11 w-full rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-fg',
  'motion-safe:transition-[border-color,box-shadow] hover:border-muted',
  'focus-visible:border-focus focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/30',
  'aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/25',
)

export function TextField({
  label,
  error,
  hint,
  trailing,
  id,
  className,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-[0.95rem] font-semibold" htmlFor={inputId}>
        {label}
      </label>
      <div className="relative">
        <input
          {...inputProps}
          id={inputId}
          className={cn(inputClasses, trailing ? 'pr-19' : null)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
        />
        {trailing}
      </div>
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
      {hint && (
        <div id={hintId} className="text-sm text-muted">
          {hint}
        </div>
      )}
    </div>
  )
}
