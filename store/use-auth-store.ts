import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// ─── Types ────────────────────────────────────────────────────
export type UserProfileWithDivision = {
  id: string
  full_name: string | null
  employee_id: string | null
  role: string | null
  email: string | null
  avatar_url: string | null
  status: string | null
  last_login: string | null
  division_id: string | null
  divisions: {
    id: string
    name: string
    description: string | null
    color_code: string | null
    created_at: string | null
  } | null
}

interface AuthState {
  profile: UserProfileWithDivision | null
  authEmail: string | null
  isLoading: boolean

  // Actions
  setProfile: (profile: UserProfileWithDivision | null) => void
  setAuthEmail: (email: string | null) => void
  setLoading: (loading: boolean) => void
  updateProfile: (updates: Partial<UserProfileWithDivision>) => void
  clearAuth: () => void
}

// ─── Store ────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      profile: null,
      authEmail: null,
      isLoading: true,

      setProfile: (profile) =>
        set({ profile, isLoading: false }, false, 'auth/setProfile'),

      setAuthEmail: (authEmail) =>
        set({ authEmail }, false, 'auth/setAuthEmail'),

      setLoading: (isLoading) =>
        set({ isLoading }, false, 'auth/setLoading'),

      updateProfile: (updates) => {
        const current = get().profile
        if (!current) return
        set(
          { profile: { ...current, ...updates } },
          false,
          'auth/updateProfile',
        )
      },

      clearAuth: () =>
        set(
          { profile: null, authEmail: null, isLoading: false },
          false,
          'auth/clearAuth',
        ),
    }),
    { name: 'auth-store' },
  ),
)
