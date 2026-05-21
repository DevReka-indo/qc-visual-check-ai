import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { MonthlyStatRow, MonthlyDivisionStatRow } from "@/app/actions/database";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type DashboardStats = {
  total_inspections: number;
  accuracy_percentage: number;
  active_hours: number;
  pending_tasks: number;
};

export type DefectDistributionItem = {
  name: string;
  value: number;
};

// Processed monthly data ready for the Bar Chart
export type MonthlyChartRow = {
  name: string; // e.g. "Jan"
  okay: number;
  not_okay: number;
  cat_mengelupas: number;
  cat_meleber: number;
  besi_lengkung: number;
  baret: number;
};

interface StatsState {
  stats: DashboardStats | null;
  distribution: DefectDistributionItem[];
  monthlyStats: MonthlyStatRow[];
  monthlyChartData: MonthlyChartRow[]; // pre-processed for BarChart
  monthlyDivisionStats: MonthlyDivisionStatRow[];
  isLoading: boolean;
  lastFetchedAt: number | null; // timestamp – used to avoid redundant fetches

  // Actions
  fetchAll: (opts?: { force?: boolean }) => Promise<void>;
  fetchStats: () => Promise<void>;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Convert raw MonthlyStatRow[] → MonthlyChartRow[] and fill empty months */
function toChartData(rows: MonthlyStatRow[]): MonthlyChartRow[] {
  if (rows.length === 0) {
    const now = new Date();

    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);

      return {
        name: d.toLocaleString("en-US", {
          month: "short",
          year: "numeric",
        }),
        okay: 0,
        not_okay: 0,
        cat_mengelupas: 0,
        cat_meleber: 0,
        besi_lengkung: 0,
        baret: 0,
      };
    });
  }

  return rows.map((r) => ({
    name: r.month_label,
    okay: Number(r.okay_count ?? 0),
    not_okay: Number(r.not_okay_count ?? 0),
    cat_mengelupas: Number(r.cat_mengelupas ?? 0),
    cat_meleber: Number(r.cat_meleber ?? 0),
    besi_lengkung: Number(r.besi_lengkung ?? 0),
    baret: Number(r.baret ?? 0),
  }));
}

// Cache TTL: 60 seconds — avoids re-fetching when navigating between pages
const CACHE_TTL_MS = 60_000;

// ─────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────

export const useStatsStore = create<StatsState>()(
  devtools(
    (set, get) => ({
      stats: null,
      distribution: [],
      monthlyStats: [],
      monthlyChartData: [],
      monthlyDivisionStats: [],
      isLoading: false,
      lastFetchedAt: null,

      fetchAll: async ({ force = false } = {}) => {
        const { lastFetchedAt, isLoading, stats } = get();

        // Skip if already loading
        if (isLoading) return;

        // Skip if cache is still fresh (unless forced)
        if (
          !force &&
          lastFetchedAt !== null &&
          Date.now() - lastFetchedAt < CACHE_TTL_MS
        ) {
          return;
        }

        // Only show loading state if we don't have stats yet (silent refresh if we do)
        if (!stats) {
          set({ isLoading: true }, false, "stats/fetchAllStart");
        }

        try {
          const db = await import("@/app/actions/database");

          const [statsData, distData, monthlyRaw, monthlyDivRaw] =
            await Promise.all([
              db.getDashboardStats(),
              db.getDefectDistribution(),
              db.getMonthlyStats(6),
              db.getMonthlyDivisionStats(6),
            ]);

          const monthlyRows = (monthlyRaw as MonthlyStatRow[]) ?? [];
          const monthlyDivRows =
            (monthlyDivRaw as MonthlyDivisionStatRow[]) ?? [];

          set(
            {
              stats: statsData as DashboardStats | null,
              distribution: (distData as DefectDistributionItem[]) ?? [],
              monthlyStats: monthlyRows,
              monthlyChartData: toChartData(monthlyRows),
              monthlyDivisionStats: monthlyDivRows,
              isLoading: false,
              lastFetchedAt: Date.now(),
            },
            false,
            "stats/fetchAllSuccess",
          );
        } catch (err) {
          console.error("Error fetching stats:", err);
          set({ isLoading: false }, false, "stats/fetchAllError");
        }
      },

      // ── fetchStats ────────────────────────────────────
      // Lightweight refresh — only re-fetches the summary stats card
      // (e.g. after a new inspection is saved, totals change)
      fetchStats: async () => {
        try {
          const { getDashboardStats } = await import("@/app/actions/database");
          const data = await getDashboardStats();
          set(
            { stats: data as DashboardStats | null },
            false,
            "stats/fetchStats",
          );
        } catch (err) {
          console.error("Error refreshing stats:", err);
        }
      },
    }),
    { name: "stats-store" },
  ),
);
