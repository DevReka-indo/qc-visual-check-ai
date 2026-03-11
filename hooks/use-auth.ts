"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/store/use-auth-store";
import type { UserProfileWithDivision } from "@/store/use-auth-store";

export function useAuth() {
  const { setProfile, setAuthEmail, setLoading, clearAuth } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    const fetchAndSetProfile = async (userId: string, email: string) => {
      setLoading(true);
      setAuthEmail(email);

      const { data, error } = await supabase
        .from("users")
        .select("*, divisions(*)")
        .eq("id", userId)
        .single();

      if (data && !error) {
        setProfile(data as UserProfileWithDivision);
      } else {
        clearAuth();
      }
    };

    // Subscribe to auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchAndSetProfile(session.user.id, session.user.email ?? "");
      } else {
        clearAuth();
      }
    });

    // Initial session check on mount
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchAndSetProfile(session.user.id, session.user.email ?? "");
      } else {
        clearAuth();
      }
    };

    init();

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    profile: useAuthStore((s) => s.profile),
    authEmail: useAuthStore((s) => s.authEmail),
    isLoading: useAuthStore((s) => s.isLoading),
  };
}
