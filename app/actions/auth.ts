'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signUp(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const employeeId = formData.get('employeeId') as string

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                employee_id: employeeId,
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    // Note: We might need a trigger in the database to copy this metadata to the 'users' table.
    // Or we can manually insert it here if the trigger is not yet set up.
    if (data.user) {
        const { error: profileError } = await supabase
            .from('users')
            .insert([
                {
                    id: data.user.id,
                    full_name: fullName,
                    email: email,
                    employee_id: employeeId,
                    role: 'System Operator',
                    status: 'Online'
                }
            ])

        if (profileError) {
            console.error('Error creating user profile:', profileError)
        }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/auth')
}
