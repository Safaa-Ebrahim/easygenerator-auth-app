// Client-side rules mirror backend/src/auth/dto/signup.dto.ts and signin.dto.ts.
// They exist for fast feedback only; the backend remains the source of truth.

export const NAME_MIN_LENGTH = 3
export const NAME_MAX_LENGTH = 100
export const EMAIL_MAX_LENGTH = 254
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 72

// Pragmatic check (something@domain.tld); full RFC validation happens server-side.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type FieldErrors<TField extends string> = Partial<Record<TField, string>>

export interface PasswordCheck {
  id: 'length' | 'letter' | 'number' | 'special'
  label: string
  met: boolean
}

export function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    {
      id: 'length',
      label: `At least ${PASSWORD_MIN_LENGTH} characters`,
      met: password.length >= PASSWORD_MIN_LENGTH,
    },
    { id: 'letter', label: 'At least one letter', met: /[A-Za-z]/.test(password) },
    { id: 'number', label: 'At least one number', met: /\d/.test(password) },
    {
      id: 'special',
      label: 'At least one special character',
      met: /[^A-Za-z\d]/.test(password),
    },
  ]
}

export function validateName(name: string): string | undefined {
  const trimmed = name.trim()
  if (!trimmed) return 'Name is required.'
  if (trimmed.length < NAME_MIN_LENGTH) {
    return `Name must be at least ${NAME_MIN_LENGTH} characters.`
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `Name must be at most ${NAME_MAX_LENGTH} characters.`
  }
  return undefined
}

export function validateEmail(email: string): string | undefined {
  const trimmed = email.trim()
  if (!trimmed) return 'Email is required.'
  if (trimmed.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(trimmed)) {
    return 'Enter a valid email address, like name@example.com.'
  }
  return undefined
}

export function validateNewPassword(password: string): string | undefined {
  if (!password) return 'Password is required.'
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`
  }
  const missing = getPasswordChecks(password).filter((check) => !check.met)
  if (missing.length > 0) {
    return `Password must meet every requirement: ${missing
      .map((check) => check.label.toLowerCase())
      .join(', ')}.`
  }
  return undefined
}

export type SignUpField = 'name' | 'email' | 'password'
export type SignInField = 'email' | 'password'

export function validateSignUp(values: Record<SignUpField, string>): FieldErrors<SignUpField> {
  return pruneEmpty({
    name: validateName(values.name),
    email: validateEmail(values.email),
    password: validateNewPassword(values.password),
  })
}

export function validateSignIn(values: Record<SignInField, string>): FieldErrors<SignInField> {
  return pruneEmpty({
    email: validateEmail(values.email),
    password: values.password ? undefined : 'Password is required.',
  })
}

function pruneEmpty<TField extends string>(
  errors: Record<TField, string | undefined>,
): FieldErrors<TField> {
  const result: FieldErrors<TField> = {}
  for (const field of Object.keys(errors) as TField[]) {
    const message = errors[field]
    if (message) result[field] = message
  }
  return result
}
