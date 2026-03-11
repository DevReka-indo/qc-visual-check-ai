"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Update last_login timestamp in public.users
  if (data.user) {
    await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", data.user.id);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const employeeId = formData.get("employeeId") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        employee_id: employeeId,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // The handle_new_user trigger already creates the row in public.users.
  // We only need to UPDATE the fields the trigger doesn't cover
  // (employee_id, role, status, email).
  if (data.user) {
    const { error: profileError } = await supabase
      .from("users")
      .update({
        full_name: fullName,
        employee_id: employeeId,
        email: email,
        role: "operator",
        status: "online",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.user.id);

    if (profileError) {
      // Trigger may not have fired yet on email-confirmation flow;
      // do a soft upsert as fallback.
      await supabase.from("users").upsert({
        id: data.user.id,
        full_name: fullName,
        employee_id: employeeId,
        email: email,
        role: "operator",
        status: "online",
      });
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();

  // Mark user as offline before signing out
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("users")
      .update({ status: "offline" })
      .eq("id", user.id);
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth");
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string,
) {
  const supabase = await createClient();

  // Re-authenticate with current password first to confirm identity
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: "User not found." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return { error: "Password saat ini tidak sesuai." };
  }

  // Now update to the new password
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
