import { useCallback, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import type { FieldErrors } from '../lib/validation'

export interface FieldBindings {
  name: string
  value: string
  error?: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onBlur: () => void
}

/**
 * Small controlled-form helper. Errors are derived from the current values and
 * shown once a field has been filled in and left, or after a submit attempt,
 * so users are not greeted with errors before they start typing.
 */
export function useForm<TField extends string>(
  initialValues: Record<TField, string>,
  validate: (values: Record<TField, string>) => FieldErrors<TField>,
) {
  const [values, setValues] = useState(initialValues)
  const [touched, setTouched] = useState<Partial<Record<TField, boolean>>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const inFlight = useRef(false)

  const errors = useMemo(() => validate(values), [validate, values])

  const field = (name: TField): FieldBindings => {
    const showError = submitAttempted || (touched[name] === true && values[name] !== '')
    return {
      name,
      value: values[name],
      error: showError ? errors[name] : undefined,
      onChange: (event) => {
        const { value } = event.target
        setValues((previous) => ({ ...previous, [name]: value }))
      },
      onBlur: () => setTouched((previous) => ({ ...previous, [name]: true })),
    }
  }

  /** Replaces field values and hides their errors until they are edited again. */
  const resetFields = useCallback((next: Partial<Record<TField, string>>) => {
    setValues((previous) => ({ ...previous, ...next }))
    setTouched((previous) => {
      const updated = { ...previous }
      for (const name of Object.keys(next) as TField[]) delete updated[name]
      return updated
    })
    setSubmitAttempted(false)
  }, [])

  /**
   * Validates on submit and focuses the first invalid field, or runs
   * `onValid`. While `onValid` is pending, further submits are ignored; the
   * ref guards against double clicks that land before the re-render.
   */
  const handleSubmit =
    (onValid: (values: Record<TField, string>) => Promise<void>) =>
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (inFlight.current) return
      setSubmitAttempted(true)

      const firstInvalid = (Object.keys(values) as TField[]).find((name) => errors[name])
      if (firstInvalid) {
        const element = event.currentTarget.elements.namedItem(firstInvalid)
        if (element instanceof HTMLElement) element.focus()
        return
      }

      inFlight.current = true
      setSubmitting(true)
      try {
        await onValid(values)
      } finally {
        inFlight.current = false
        setSubmitting(false)
      }
    }

  return { values, field, handleSubmit, resetFields, submitting }
}
