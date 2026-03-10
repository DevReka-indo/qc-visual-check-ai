'use server'

import { createClient } from '@/utils/supabase/server'
import { Database } from '@/types/database.types'

type InspectionRow = Database['public']['Tables']['inspections']['Row']
type AnomalyRow = Database['public']['Tables']['anomalies']['Row']
type DivisionRow = Database['public']['Tables']['divisions']['Row']

export async function getDashboardStats() {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_dashboard_stats')

    if (error) {
        console.error('Error fetching dashboard stats:', error)
        return null
    }

    return data && data.length > 0 ? data[0] : null
}

export async function getDivisions() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('divisions')
        .select('*')
        .order('name')

    if (error) {
        console.error('Error fetching divisions:', error)
        return []
    }

    return data
}

export type InspectionWithDetails = InspectionRow & {
    divisions: DivisionRow | null;
    anomalies: AnomalyRow[];
}

export async function getInspections(limit: number = 50, status?: string) {
    const supabase = await createClient()

    let query = supabase
        .from('inspections')
        .select(`
            *,
            divisions(*),
            anomalies(*)
        `)
        .order('inspection_date', { ascending: false })
        .limit(limit)

    if (status) {
        query = query.eq('validation_status', status)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching inspections:', error)
        return []
    }

    return data as InspectionWithDetails[]
}

export async function getUserProfile(userId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('users')
        .select(`
            *,
            divisions(*)
        `)
        .eq('id', userId)
        .single()

    if (error) {
        console.error('Error fetching user profile:', error)
        return null
    }

    return data
}
