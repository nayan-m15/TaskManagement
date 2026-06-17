import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getProfileSettings,
  updateProfileSettings,
} from '../services/profileService'

interface UseProfileSettingsOptions {
  userId?: string
  fallbackEmail?: string | null
}

export function useProfileSettings({
  userId,
  fallbackEmail,
}: UseProfileSettingsOptions) {
  const queryClient = useQueryClient()
  const queryKey = ['profile-settings', userId]

  const query = useQuery({
    queryKey,
    queryFn: () => getProfileSettings(userId ?? '', fallbackEmail),
    enabled: Boolean(userId),
  })

  const updateMutation = useMutation({
    mutationFn: (values: {
      username: string
      fullName: string
      avatarUrl: string
      bio: string
    }) => {
      if (!userId) {
        throw new Error('User context is missing.')
      }

      return updateProfileSettings(userId, values)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    ...query,
    saveProfile: updateMutation.mutateAsync,
    isSavingProfile: updateMutation.isPending,
    saveProfileError: updateMutation.error,
  }
}
