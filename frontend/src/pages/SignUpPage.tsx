import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { signUp } from '../api/auth'
import { describeApiError } from '../api/client'
import type { SignInLocationState } from '../auth/locationState'
import { Alert } from '../components/Alert'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/Button'
import { PasswordField } from '../components/PasswordField'
import { TextField } from '../components/TextField'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useForm } from '../hooks/useForm'
import { EMAIL_MAX_LENGTH, NAME_MAX_LENGTH, PASSWORD_MAX_LENGTH, validateSignUp } from '../lib/validation'
import { ROUTES } from '../paths'

export function SignUpPage() {
  useDocumentTitle('Create account')
  const navigate = useNavigate()
  const { field, handleSubmit, submitting } = useForm(
    { name: '', email: '', password: '' },
    validateSignUp,
  )
  const [formError, setFormError] = useState<string | null>(null)

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setFormError(null)
    try {
      const trimmedEmail = email.trim()
      await signUp({ name: name.trim(), email: trimmedEmail, password })
      const state: SignInLocationState = { notice: 'registered', email: trimmedEmail }
      navigate(ROUTES.signIn, { replace: true, state })
    } catch (error) {
      setFormError(
        describeApiError(error, {
          409: 'An account with this email already exists. Try signing in instead.',
        }),
      )
    }
  })

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Sign up to get started."
      footer={
        <p>
          Already have an account? <Link to={ROUTES.signIn}>Sign in</Link>
        </p>
      }
    >
      {formError && <Alert variant="error">{formError}</Alert>}

      <form className="flex flex-col gap-4" noValidate onSubmit={onSubmit}>
        <TextField
          {...field('name')}
          label="Name"
          placeholder="Jane Doe"
          type="text"
          autoComplete="name"
          maxLength={NAME_MAX_LENGTH}
          required
        />
        <TextField
          {...field('email')}
          label="Email"
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          inputMode="email"
          maxLength={EMAIL_MAX_LENGTH}
          required
        />
        <PasswordField
          {...field('password')}
          label="Password"
          placeholder="Create a password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          required
          showRequirements
        />

        <Button type="submit" className="mt-2 w-full" loading={submitting} loadingText="Creating account…">
          Create account
        </Button>
      </form>
    </AuthLayout>
  )
}
