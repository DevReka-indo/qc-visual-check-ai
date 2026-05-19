import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { InspectionWithDetails } from "@/app/actions/database";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface FetchInspectionParams {
  limit?: number;
  offset?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

type ValidationStatus = "Resolved" | "Reworked" | "Scrapped";

interface InspectionState {
  inspections: InspectionWithDetails[];
  totalCount: number;
  isLoading: boolean;

  // ── Actions ──────────────────────────────────────
  fetchInspections: (params?: FetchInspectionParams) => Promise<void>;
  patchStatus: (
    id: string,
    status: ValidationStatus,
    note?: string,
  ) => Promise<{ error?: string }>;
  removeById: (id: string) => Promise<{ error?: string }>;
  reset: () => void;
}

// ─────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────

export const useInspectionStore = create<InspectionState>()(
  devtools(
    (set, get) => ({
      inspections: [],
      totalCount: 0,
      isLoading: false,

      // ── Fetch ─────────────────────────────────
      fetchInspections: async (params = {}) => {
        set({ isLoading: true }, false, "inspection/fetchStart");

        const { getInspections } = await import("@/app/actions/database");
        const { data, count } = await getInspections(
          params.limit ?? 50,
          params.offset ?? 0,
          params.status,
          params.dateFrom,
          params.dateTo,
        );

        set(
          { inspections: data ?? [], totalCount: count ?? 0, isLoading: false },
          false,
          "inspection/fetchSuccess",
        );
      },

      // ── Optimistic status patch ───────────────
      patchStatus: async (id, status, note) => {
        // 1. Optimistic update in store
        set(
          (state) => ({
            inspections: state.inspections.map((i) =>
              i.id === id
                ? {
                    ...i,
                    validation_status: status,
                    resolution_note: note ?? i.resolution_note,
                    updated_at: new Date().toISOString(),
                  }
                : i,
            ),
          }),
          false,
          "inspection/patchStatusOptimistic",
        );

        // 2. Persist to DB
        const { updateInspectionStatus } = await import(
          "@/app/actions/database"
        );
        const result = await updateInspectionStatus(id, status, note);

        if (result.error) {
          // Revert: re-fetch to restore correct state
          const params: FetchInspectionParams = {
            limit: get().inspections.length || 50,
          };
          await get().fetchInspections(params);
          return { error: result.error };
        }

        return {};
      },

      // ── Optimistic remove ─────────────────────
      removeById: async (id) => {
        const snapshot = get().inspections;
        const snapshotCount = get().totalCount;

        // 1. Optimistic remove from store
        set(
          (state) => ({
            inspections: state.inspections.filter((i) => i.id !== id),
            totalCount: Math.max(0, state.totalCount - 1),
          }),
          false,
          "inspection/removeOptimistic",
        );

        // 2. Persist to DB
        const { deleteInspection } = await import("@/app/actions/database");
        const result = await deleteInspection(id);

        if (result.error) {
          // Revert
          set(
            { inspections: snapshot, totalCount: snapshotCount },
            false,
            "inspection/removeRevert",
          );
          return { error: result.error };
        }

        return {};
      },

      // ── Reset ─────────────────────────────────
      reset: () =>
        set(
          { inspections: [], totalCount: 0, isLoading: false },
          false,
          "inspection/reset",
        ),
    }),
    { name: "inspection-store" },
  ),
);
