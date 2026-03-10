'use server'

import { createClient } from '@/utils/supabase/server'
import { Database } from '@/types/database.types'
import { revalidatePath } from 'next/cache'

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

export async function saveInspection(payload: {
    part_id: string;
    division_id: string | null;
    image_url: string | null;
    ai_result_status: 'okay' | 'not_okay';
    main_defect: string | null;
    ai_confidence_score: number;
    anomalies: {
        defect_type: string;
        location: string;
        description: string;
        confidence_score: number;
        bounding_box?: any;
    }[];
}) {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Insert inspection
    const { data: inspection, error: inspError } = await supabase
        .from('inspections')
        .insert({
            part_id: payload.part_id,
            division_id: payload.division_id,
            image_url: payload.image_url,
            ai_result_status: payload.ai_result_status,
            main_defect: payload.main_defect,
            ai_confidence_score: payload.ai_confidence_score,
            inspector_id: user?.id,
            validation_status: 'Pending'
        })
        .select()
        .single()

    if (inspError) {
        console.error('Error saving inspection:', inspError)
        return { error: inspError.message }
    }

    // 2. Insert anomalies if any
    if (payload.anomalies.length > 0) {
        const anomaliesToInsert = payload.anomalies.map(a => ({
            inspection_id: inspection.id,
            defect_type: a.defect_type,
            location: a.location,
            description: a.description,
            confidence_score: a.confidence_score,
            bounding_box: a.bounding_box
        }))

        const { error: anomError } = await supabase
            .from('anomalies')
            .insert(anomaliesToInsert)

        if (anomError) {
            console.error('Error saving anomalies:', anomError)
            // We don't fail the whole thing, but log it
        }
    }

    revalidatePath('/')
    revalidatePath('/detection-result')
    revalidatePath('/database')

    return { data: inspection }
}

export async function updateInspectionStatus(inspectionId: string, status: 'Resolved' | 'Reworked' | 'Scrapped', note?: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('inspections')
        .update({
            validation_status: status,
            resolution_note: note,
            updated_at: new Date().toISOString()
        })
        .eq('id', inspectionId)
        .select()

    if (error) {
        console.error('Error updating inspection status:', error)
        return { error: error.message }
    }

    revalidatePath('/detection-result')
    revalidatePath('/database')

    return { data }
}

export async function getDefectDistribution() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('inspections')
        .select('main_defect')
        .not('main_defect', 'is', null)
        .neq('main_defect', 'None')

    if (error) {
        console.error('Error fetching defect distribution:', error)
        return []
    }

    // Process counts
    const distribution: Record<string, number> = {}
    data.forEach(item => {
        const type = item.main_defect || 'Unknown'
        distribution[type] = (distribution[type] || 0) + 1
    })

    return Object.entries(distribution).map(([name, value]) => ({ name, value }))
}
