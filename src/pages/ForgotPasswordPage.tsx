import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'
import { z } from 'zod'
import { Mail, Sparkles } from 'lucide-react'
import AuthLayout from '../layouts/AuthLayout'
import { ROUTES } from '../routes/routeConstants'
import { requestPasswordReset } from '../services/authService'
import { useAuth } from '../hooks/useAuth'

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

function ForgotPasswordPage() {
  const { isAuthenticated, isInitialized, isLoading } = useAuth()
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(values: ForgotPasswordFormValues) {
    setSubmissionError(null)
    setSuccessMessage(null)

    try {
      const message = await requestPasswordReset(values.email)
      setSuccessMessage(message)
      reset()
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Unable to send reset email.')
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
            <p>Please wait while we prepare password recovery.</p>
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
              <p className="auth-eyebrow">Recover access</p>
              <h1>Reset your password</h1>
            </div>
          </div>
          <p className="auth-copy">
            Enter the email linked to your account and we&apos;ll send a reset link.
          </p>

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
                  aria-describedby={errors.email ? 'forgot-email-error' : undefined}
                  {...register('email')}
                />
              </div>
              {errors.email ? (
                <p
                  id="forgot-email-error"
                  className="auth-message auth-message-error"
                  role="alert"
                >
                  {errors.email.message}
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
              <span>{isSubmitting ? 'Sending reset link...' : 'Send reset link'}</span>
            </button>
          </form>

          <div className="auth-divider" aria-hidden="true">
            <span>Password recovery</span>
          </div>

          <p className="auth-footer">
            Remembered your password? <Link to={ROUTES.login}>Back to login</Link>
          </p>
        </div>
      </section>
    </AuthLayout>
  )
}

export default ForgotPasswordPage
