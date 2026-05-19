import { create } from "zustand";
import { devtools } from "zustand/middleware";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type DivisionItem = {
  id: string;
  name: string;
  description: string | null;
  color_code: string | null;
  created_at: string | null;
};

interface DivisionsState {
  divisions: DivisionItem[];
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  fetchDivisions: (opts?: { force?: boolean }) => Promise<void>;
  reset: () => void;
}

// ─────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────

export const useDivisionsStore = create<DivisionsState>()(
  devtools(
    (set, get) => ({
      divisions: [],
      isLoading: false,
      isInitialized: false,

      // ── fetchDivisions ────────────────────────
      // Fetches once and caches. Pass { force: true } to bypass cache.
      fetchDivisions: async (opts = {}) => {
        const { isInitialized, isLoading } = get();

        // Skip if already loaded and not forced
        if ((isInitialized || isLoading) && !opts.force) return;

        set({ isLoading: true }, false, "divisions/fetchStart");

        try {
          const { getDivisions } = await import("@/app/actions/database");
          const data = await getDivisions();

          set(
            {
              divisions: (data ?? []) as DivisionItem[],
              isLoading: false,
              isInitialized: true,
            },
            false,
            "divisions/fetchSuccess",
          );
        } catch (err) {
          console.error("Error fetching divisions:", err);
          set({ isLoading: false }, false, "divisions/fetchError");
        }
      },

      // ── reset ─────────────────────────────────
      reset: () =>
        set(
          { divisions: [], isLoading: false, isInitialized: false },
          false,
          "divisions/reset",
        ),
    }),
    { name: "divisions-store" },
  ),
);
