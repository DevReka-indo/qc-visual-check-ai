"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/store/use-auth-store";
import type { UserProfileWithDivision } from "@/store/use-auth-store";

export function useAuth() {
  const { setProfile, setAuthEmail, setLoading, clearAuth } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    let isInitialFetch = true;

    const fetchAndSetProfile = async (userId: string, email: string) => {
      const currentProfile = useAuthStore.getState().profile;
      
      // Only show global loading on the very first fetch or if profile is missing
      if (!currentProfile) {
        setLoading(true);
      }

      setAuthEmail(email);

      try {
        const { data, error } = await supabase
          .from("users")
          .select("*, divisions(*)")
          .eq("id", userId)
          .single();

        if (data && !error) {
          setProfile({ ...data, email } as UserProfileWithDivision);
          
          if (data.status === "offline") {
            await supabase
              .from("users")
              .update({ status: "online" })
              .eq("id", userId);
          }
        } else if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows' which might happen on sync delay
          console.error("Profile fetch error:", error);
          // Don't clear auth immediately on transient network errors
        }
      } catch (err) {
        console.error("Unexpected fetch error:", err);
      } finally {
        setLoading(false);
        isInitialFetch = false;
      }
    };

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentProfile = useAuthStore.getState().profile;
      
      if (session?.user) {
        // Only fetch profile if it's the initial load, a explicit sign in, 
        // or if we don't have a profile yet.
        // Skip re-fetching on TOKEN_REFRESHED (focus/refocus) to prevent pulses.
        const shouldFetch = 
          event === 'INITIAL_SESSION' || 
          event === 'SIGNED_IN' || 
          !currentProfile || 
          currentProfile.id !== session.user.id;

        if (shouldFetch) {
          await fetchAndSetProfile(session.user.id, session.user.email ?? "");
        }
      } else if (event === 'SIGNED_OUT') {
        clearAuth();
      }
    });

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
