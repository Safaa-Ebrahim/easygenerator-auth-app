import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { describeApiError } from '../api/client'
import { parseSignInState } from '../auth/locationState'
import { useAuth } from '../auth/useAuth'
import { Alert } from '../components/Alert'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/Button'
import { PasswordField } from '../components/PasswordField'
import { TextField } from '../components/TextField'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useForm } from '../hooks/useForm'
import { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH, validateSignIn } from '../lib/validation'
import { ROUTES } from '../paths'

export function SignInPage() {
  useDocumentTitle('Sign in')
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const [routeState] = useState(() => parseSignInState(location.state))

  const { field, handleSubmit, resetFields, submitting } = useForm(
    { email: routeState.email ?? '', password: '' },
    validateSignIn,
  )
  const [formError, setFormError] = useState<string | null>(null)

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null)
    try {
      await signIn({ email: email.trim(), password })
      navigate(routeState.from ?? ROUTES.app, { replace: true })
    } catch (error) {
      // Do not keep a rejected password around in the form.
      resetFields({ password: '' })
      setFormError(
        describeApiError(error, { 401: 'Incorrect email or password. Please try again.' }),
      )
    }
  })

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue."
      footer={
        <p>
          New here? <Link to={ROUTES.signUp}>Create an account</Link>
        </p>
      }
    >
      {formError && <Alert>{formError}</Alert>}

      <form className="flex flex-col gap-4" noValidate onSubmit={onSubmit}>
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
          placeholder="Enter your password"
          autoComplete="current-password"
          maxLength={PASSWORD_MAX_LENGTH}
          required
        />

        <Button type="submit" className="mt-2 w-full" loading={submitting} loadingText="Signing in…">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  )
}
