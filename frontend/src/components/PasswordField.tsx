import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '../lib/cn'
import { getPasswordChecks } from '../lib/validation'
import { CheckIcon, EyeIcon, EyeOffIcon } from './icons'
import { TextField, type TextFieldProps } from './TextField'

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'trailing' | 'hint'> & {
  /**
   * Show a live checklist of the password rules while the field is focused or
   * filled in, collapsing once every rule is met. Meant for password creation
   * (sign-up), not for the sign-in password.
   */
  showRequirements?: boolean
}

/** Password input with an accessible show/hide toggle and optional rule checklist. */
export function PasswordField({
  id,
  showRequirements = false,
  onFocus,
  onBlur,
  ...props
}: PasswordFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [visible, setVisible] = useState(false)
  const [focused, setFocused] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Always mask the password again once the form is submitted.
  useEffect(() => {
    const form = toggleRef.current?.form
    if (!form) return
    const hide = () => setVisible(false)
    form.addEventListener('submit', hide)
    return () => form.removeEventListener('submit', hide)
  }, [])

  const checks = getPasswordChecks(props.value)
  const allMet = checks.every((check) => check.met)
  const revealChecklist = showRequirements && (focused || props.value.length > 0) && !allMet

  return (
    <TextField
      {...props}
      id={inputId}
      type={visible ? 'text' : 'password'}
      // Prevent the browser from autocapitalising or spell-checking a revealed password.
      autoCapitalize="none"
      spellCheck={false}
      onFocus={(event) => {
        setFocused(true)
        onFocus?.(event)
      }}
      onBlur={(event) => {
        setFocused(false)
        onBlur?.(event)
      }}
      trailing={
        <button
          ref={toggleRef}
          type="button"
          className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-muted hover:bg-primary/10 hover:text-fg motion-safe:transition-colors"
          aria-controls={inputId}
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
        </button>
      }
      hint={
        revealChecklist ? (
          <ul className="flex flex-col gap-1" aria-label="Password requirements">
            {checks.map((check) => (
              <li
                key={check.id}
                className={cn(
                  'flex items-center gap-1.5 text-[0.8125rem] motion-safe:transition-colors',
                  check.met ? 'text-success' : 'text-muted',
                )}
              >
                <CheckIcon size={13} className={cn('shrink-0', !check.met && 'opacity-30')} />
                {check.label}
                <span className="sr-only">{check.met ? ' (met)' : ' (not met)'}</span>
              </li>
            ))}
          </ul>
        ) : undefined
      }
    />
  )
}
