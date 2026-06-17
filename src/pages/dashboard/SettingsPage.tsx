import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useProfileSettings } from '../../hooks/useProfileSettings'
import { DashboardPageIntro } from '../../components/dashboard/DashboardViews'
import { useDashboardOutlet } from './dashboardContext'

const settingsSchema = z.object({
  username: z.string(),
  fullName: z.string(),
  avatarUrl: z.string(),
  bio: z.string(),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

function SettingsPage() {
  const { session } = useDashboardOutlet()
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const profileQuery = useProfileSettings({
    userId: session.user.id,
    fallbackEmail: session.user.email,
  })
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      username: '',
      fullName: '',
      avatarUrl: '',
      bio: '',
    },
  })

  useEffect(() => {
    reset({
      username: profileQuery.data?.profile.username ?? '',
      fullName: profileQuery.data?.profile.fullName ?? '',
      avatarUrl: profileQuery.data?.profile.avatarUrl ?? '',
      bio: profileQuery.data?.profile.bio ?? '',
    })
  }, [profileQuery.data, reset])

  async function onSubmit(values: SettingsFormValues) {
    setStatusMessage(null)
    await profileQuery.saveProfile(values)
    setStatusMessage('Profile settings saved.')
  }

  return (
    <>
      <DashboardPageIntro
        eyebrow="Settings"
        title="Profile and account settings"
        description="Review the active account, update your basic profile details when supported, and keep your dashboard identity current."
      />

      {profileQuery.isLoading ? (
        <section className="dashboard-feedback-card" aria-live="polite">
          <p className="dashboard-card-label">Loading</p>
          <h2>Loading profile settings</h2>
          <p>We are checking the available profile fields for this account.</p>
        </section>
      ) : null}

      {!profileQuery.isLoading && profileQuery.isError ? (
        <section className="dashboard-feedback-card" role="alert">
          <p className="dashboard-card-label">Unavailable</p>
          <h2>Profile settings could not be loaded</h2>
          <p>{profileQuery.error instanceof Error ? profileQuery.error.message : 'Try again in a moment.'}</p>
        </section>
      ) : null}

      {!profileQuery.isLoading && !profileQuery.isError && profileQuery.data ? (
        <section className="dashboard-detail-panels">
          <section className="dashboard-section-card">
            <header className="dashboard-section-header">
              <div>
                <p className="dashboard-card-label">Account</p>
                <h2>Session details</h2>
                <p>Your current authenticated identity and profile support status.</p>
              </div>
            </header>

            <div className="dashboard-details">
              <p><strong>Email:</strong> {profileQuery.data.profile.email ?? session.user.email ?? 'Unavailable'}</p>
              <p><strong>User ID:</strong> {session.user.id}</p>
              <p><strong>Profile support:</strong> {profileQuery.data.supported ? 'Available' : 'Fallback only'}</p>
            </div>

            {profileQuery.data.warnings.map((warning) => (
              <p key={warning} className="auth-message" role="status">
                {warning}
              </p>
            ))}
          </section>

          <section className="dashboard-section-card">
            <header className="dashboard-section-header">
              <div>
                <p className="dashboard-card-label">Profile</p>
                <h2>Basic profile</h2>
                <p>Update these fields when the project has a compatible `profiles` table and policies.</p>
              </div>
            </header>

            <form className="task-drawer-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="kanban-form-grid">
                <div className="auth-field">
                  <label htmlFor="settings-username">Username</label>
                  <input id="settings-username" className="kanban-input" {...register('username')} />
                </div>

                <div className="auth-field">
                  <label htmlFor="settings-full-name">Full name</label>
                  <input id="settings-full-name" className="kanban-input" {...register('fullName')} />
                </div>

                <div className="auth-field auth-field-span-2">
                  <label htmlFor="settings-avatar-url">Avatar URL</label>
                  <input id="settings-avatar-url" className="kanban-input" {...register('avatarUrl')} />
                </div>

                <div className="auth-field auth-field-span-2">
                  <label htmlFor="settings-bio">Bio</label>
                  <textarea id="settings-bio" className="kanban-textarea" rows={5} {...register('bio')} />
                </div>
              </div>

              {statusMessage ? (
                <p className="auth-message auth-message-success" role="status">
                  {statusMessage}
                </p>
              ) : null}

              {profileQuery.saveProfileError ? (
                <p className="auth-message auth-message-error" role="alert">
                  {profileQuery.saveProfileError instanceof Error
                    ? profileQuery.saveProfileError.message
                    : 'Unable to save the profile.'}
                </p>
              ) : null}

              <div className="kanban-modal-actions">
                <button
                  type="submit"
                  className="auth-submit"
                  disabled={!profileQuery.data.canEdit || isSubmitting || profileQuery.isSavingProfile}
                >
                  {profileQuery.isSavingProfile ? 'Saving...' : 'Save profile'}
                </button>
              </div>
            </form>
          </section>
        </section>
      ) : null}
    </>
  )
}

export default SettingsPage
