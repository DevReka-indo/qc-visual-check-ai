'use client'

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useUserStore } from '@/store/use-user-store'

export function useAuth() {
    const { setUser, clearUser, setLoading } = useUserStore()
    const supabase = createClient()

    useEffect(() => {
        const getUserProfile = async (userId: string) => {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()

            if (data && !error) {
                setUser(data)
            } else {
                clearUser()
            }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setLoading(true)
                if (session?.user) {
                    await getUserProfile(session.user.id)
                } else {
                    clearUser()
                }
            }
        )

        // Initial check
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                await getUserProfile(session.user.id)
            } else {
                clearUser()
            }
        }

        checkUser()

        return () => {
            subscription.unsubscribe()
        }
    }, [setUser, clearUser, setLoading, supabase])

    return { user: useUserStore((state) => state.user), loading: useUserStore((state) => state.loading) }
}
