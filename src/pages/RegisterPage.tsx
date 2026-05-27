import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { AtSign, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from 'lucide-react'
import AuthLayout from '../layouts/AuthLayout'
import { useAuth } from '../hooks/useAuth'
import { register as registerUser } from '../services/authService'
import { ROUTES } from '../routes/routeConstants'

const registerSchema = z.object({
  username: z.string().trim().min(1, 'Username is required.'),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

type RegisterFormValues = z.infer<typeof registerSchema>

function RegisterPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isInitialized, isLoading, setSession } = useAuth()
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  })

  useEffect(() => {
    if (!successMessage) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      navigate(ROUTES.login, {
        replace: true,
        state: {
          registrationComplete: true,
        },
      })
    }, 1400)

    return () => window.clearTimeout(timeoutId)
  }, [navigate, successMessage])

  async function onSubmit(values: RegisterFormValues) {
    setSubmissionError(null)
    setSuccessMessage(null)

    try {
      const result = await registerUser(values)

      if (result.session) {
        setSession(result.session)
        navigate(ROUTES.dashboard, { replace: true })
        return
      }

      setSuccessMessage(
        result.requiresEmailConfirmation
          ? 'Account created. Check your email to confirm your account, then sign in.'
          : 'Account created successfully. You can sign in now.',
      )
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : 'Unable to create your account.',
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
            <p>Please wait while we prepare registration.</p>
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
              <p className="auth-eyebrow">Create your account</p>
              <h1>Start organizing your work</h1>
            </div>
          </div>
          <p className="auth-copy">
            Set up your profile to access your task dashboard and collaborate with
            confidence.
          </p>

          <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="auth-field">
              <label htmlFor="username">Username</label>
              <div
                className={`auth-input-shell ${errors.username ? 'auth-input-shell-invalid' : ''}`}
              >
                <AtSign className="auth-input-icon" size={18} aria-hidden="true" />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Choose a username"
                  aria-invalid={errors.username ? 'true' : 'false'}
                  aria-describedby={errors.username ? 'register-username-error' : undefined}
                  {...register('username')}
                />
              </div>
              {errors.username ? (
                <p
                  id="register-username-error"
                  className="auth-message auth-message-error"
                  role="alert"
                >
                  {errors.username.message}
                </p>
              ) : null}
            </div>

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
                  aria-describedby={errors.email ? 'register-email-error' : undefined}
                  {...register('email')}
                />
              </div>
              {errors.email ? (
                <p
                  id="register-email-error"
                  className="auth-message auth-message-error"
                  role="alert"
                >
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div
                className={`auth-input-shell ${errors.password ? 'auth-input-shell-invalid' : ''}`}
              >
                <LockKeyhole className="auth-input-icon" size={18} aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a secure password"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'register-password-error' : undefined}
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
                  id="register-password-error"
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

            {successMessage ? (
              <p className="auth-message auth-message-success" role="status">
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              className="auth-submit"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Creating account...' : 'Create account'}</span>
            </button>
          </form>

          <div className="auth-divider" aria-hidden="true">
            <span>Protected onboarding flow</span>
          </div>

          <p className="auth-footer">
            Already registered? <Link to={ROUTES.login}>Sign in</Link>
          </p>
        </div>
      </section>
    </AuthLayout>
  )
}

export default RegisterPage
