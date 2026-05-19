"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { getUserProfile } from "@/app/actions/database";
import type { UserProfileWithDivision } from "@/store/use-auth-store";

export function useAuth() {
  const { setProfile, setAuthEmail, setLoading, clearAuth } = useAuthStore();

  useEffect(() => {
    const fetchAndSetProfile = async () => {
      const currentProfile = useAuthStore.getState().profile;
      
      if (!currentProfile) {
        setLoading(true);
      }

      try {
        // Check if we have a valid auth token by trying to fetch user data
        // The server will validate the token in the cookie
        const response = await fetch("/api/auth/me");
        
        if (response.ok) {
          const data = await response.json();

          if (data.user) {
            setAuthEmail(data.user.email);
            setProfile(data.user as UserProfileWithDivision);
          } else {
            clearAuth();
          }
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    // Check auth status on mount
    fetchAndSetProfile();

    // Optional: Set up a listener for storage changes (logout from another tab)
    const handleStorageChange = () => {
      fetchAndSetProfile();
    };

    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    profile: useAuthStore((s) => s.profile),
    authEmail: useAuthStore((s) => s.authEmail),
    isLoading: useAuthStore((s) => s.isLoading),
  };
}
