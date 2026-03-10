import { create } from 'zustand'
import { Tables } from '@/types/database.types'

type UserProfile = Tables<'users'>

interface UserState {
    user: UserProfile | null
    loading: boolean
    setUser: (user: UserProfile | null) => void
    setLoading: (loading: boolean) => void
    clearUser: () => void
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    loading: true,
    setUser: (user) => set({ user, loading: false }),
    setLoading: (loading) => set({ loading }),
    clearUser: () => set({ user: null, loading: false }),
}))
