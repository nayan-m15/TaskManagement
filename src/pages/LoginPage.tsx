import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Eye, EyeOff, LockKeyhole, Mail, Sparkles } from 'lucide-react'
import AuthLayout from '../layouts/AuthLayout'
import { useAuth } from '../hooks/useAuth'
import { login } from '../services/authService'
import { ROUTES } from '../routes/routeConstants'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isInitialized, isLoading, setSession } = useAuth()
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const registrationComplete =
    typeof location.state === 'object' &&
    location.state &&
    'registrationComplete' in location.state &&
    location.state.registrationComplete === true

  async function onSubmit(values: LoginFormValues) {
    setSubmissionError(null)

    try {
      const session = await login(values)

      if (!session) {
        throw new Error('Login succeeded, but no active session was returned.')
      }

      setSession(session)
      navigate(ROUTES.dashboard, { replace: true })
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : 'Unable to sign in right now.',
      )
    }
  }

  if (isInitialized && isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  if (isLoading || !isInitialized) {
    return (
      <AuthLayout>
        <section className="auth-status-screen" aria-live="polite">
          <div className="auth-status-card">
            <h2>Checking your session</h2>
            <p>Please wait while we prepare sign-in.</p>
          </div>
        </section>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <section className="auth-shell">
        <div className="auth-panel">
          <div className="auth-brand-lockup">
            <div className="auth-brand-mark" aria-hidden="true">
              <Sparkles size={18} strokeWidth={2.1} />
            </div>
            <div>
              <p className="auth-eyebrow">Welcome back</p>
              <h1>Sign in to continue</h1>
            </div>
          </div>
          <p className="auth-copy">
            Access your boards, tasks, and workspace activity with your email and
            password.
          </p>

          {registrationComplete ? (
            <p className="auth-message auth-message-success" role="status">
              Registration completed. Sign in once your email is confirmed.
            </p>
          ) : null}

          <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <div
                className={`auth-input-shell ${errors.email ? 'auth-input-shell-invalid' : ''}`}
              >
                <Mail className="auth-input-icon" size={18} aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                  {...register('email')}
                />
              </div>
              {errors.email ? (
                <p
                  id="login-email-error"
                  className="auth-message auth-message-error"
                  role="alert"
                >
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="auth-field">
              <div className="auth-field-row">
                <label htmlFor="password">Password</label>
                <Link to={ROUTES.forgotPassword}>Forgot password?</Link>
              </div>
              <div
                className={`auth-input-shell ${errors.password ? 'auth-input-shell-invalid' : ''}`}
              >
                <LockKeyhole className="auth-input-icon" size={18} aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password ? (
                <p
                  id="login-password-error"
                  className="auth-message auth-message-error"
                  role="alert"
                >
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            {submissionError ? (
              <p className="auth-message auth-message-error" role="alert">
                {submissionError}
              </p>
            ) : null}

            <button
              type="submit"
              className="auth-submit"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign in'}</span>
            </button>
          </form>

          <div className="auth-divider" aria-hidden="true">
            <span>Secure email sign in</span>
          </div>

          <p className="auth-footer">
            Need an account? <Link to={ROUTES.register}>Create one</Link>
          </p>
        </div>
      </section>
    </AuthLayout>
  )
}

export default LoginPage
