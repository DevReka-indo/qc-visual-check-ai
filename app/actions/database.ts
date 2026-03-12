"use server";

import { createClient } from "@/utils/supabase/server";
import { Database, Json } from "@/types/database.types";
import { revalidatePath } from "next/cache";

type InspectionRow = Database["public"]["Tables"]["inspections"]["Row"];
type AnomalyRow = Database["public"]["Tables"]["anomalies"]["Row"];
type DivisionRow = Database["public"]["Tables"]["divisions"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type InspectionWithDetails = InspectionRow & {
  divisions: DivisionRow | null;
  anomalies: AnomalyRow[];
  users: Pick<UserRow, "full_name"> | null; // inspector
};

export type MonthlyStatRow = {
  month_label: string;
  year_num: number;
  month_num: number;
  okay_count: number;
  not_okay_count: number;
  cat_mengelupas: number;
  cat_meleber: number;
  besi_lengkung: number;
  baret: number;
};

export type MonthlyDivisionStatRow = {
  month_label: string;
  year_num: number;
  month_num: number;
  division_name: string;
  total_count: number;
  okay_count: number;
  cat_mengelupas: number;
  cat_meleber: number;
  besi_lengkung: number;
  baret: number;
};

// ─────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────

export async function getDashboardStats() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dashboard_stats");

  if (error) {
    console.error("Error fetching dashboard stats:", error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
}

// ─────────────────────────────────────────────
// MONTHLY STATS (Bar Chart – Statistic Page)
// ─────────────────────────────────────────────

export async function getMonthlyStats(
  monthsBack: number = 6,
): Promise<MonthlyStatRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_monthly_inspection_stats", {
    months_back: monthsBack,
  });

  if (error) {
    console.error("Error fetching monthly stats:", error);
    return [];
  }

  return (data as MonthlyStatRow[]) ?? [];
}

// ─────────────────────────────────────────────
// MONTHLY DIVISION STATS (Line Chart – Detection Result Page)
// ─────────────────────────────────────────────

export async function getMonthlyDivisionStats(
  monthsBack: number = 6,
): Promise<MonthlyDivisionStatRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_monthly_division_stats", {
    months_back: monthsBack,
  });

  if (error) {
    console.error("Error fetching monthly division stats:", error);
    return [];
  }

  return (data as MonthlyDivisionStatRow[]) ?? [];
}

// ─────────────────────────────────────────────
// DIVISIONS
// ─────────────────────────────────────────────

export async function getDivisions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("divisions")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching divisions:", error);
    return [];
  }

  return data;
}

// ─────────────────────────────────────────────
// INSPECTIONS  (with pagination + date range filter + inspector join)
// ─────────────────────────────────────────────

export async function getInspections(
  limit: number = 50,
  offset: number = 0,
  status?: string,
  dateFrom?: string, // ISO string e.g. "2026-01-01"
  dateTo?: string, // ISO string e.g. "2026-12-31"
) {
  const supabase = await createClient();

  let query = supabase
    .from("inspections")
    .select(
      `
            *,
            divisions(*),
            anomalies(*),
            users!inspector_id(full_name)
        `,
      { count: "exact" },
    )
    .order("inspection_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("validation_status", status);
  if (dateFrom) query = query.gte("inspection_date", dateFrom);
  if (dateTo) query = query.lte("inspection_date", dateTo + "T23:59:59Z");

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching inspections:", error);
    return { data: [], count: 0 };
  }

  return {
    data: (data as InspectionWithDetails[]) ?? [],
    count: count ?? 0,
  };
}

// ─────────────────────────────────────────────
// USER PROFILE
// ─────────────────────────────────────────────

export async function getUserProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select(`*, divisions(*)`)
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data;
}

export async function updateUserProfile(
  userId: string,
  updates: {
    full_name?: string;
    avatar_url?: string;
    division_id?: string | null;
    employee_id?: string;
  },
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating user profile:", error);
    return { error: error.message };
  }

  revalidatePath("/user");
  return { data };
}

// ─────────────────────────────────────────────
// SAVE INSPECTION  (insert inspection + anomalies)
// ─────────────────────────────────────────────

export async function saveInspection(payload: {
  part_id: string;
  division_id: string | null;
  image_url: string | null;
  ai_result_status: "okay" | "not_okay";
  main_defect: string | null;
  ai_confidence_score: number;
  anomalies: {
    defect_type: string;
    location: string;
    description: string;
    confidence_score: number;
    bounding_box?: Record<string, unknown>;
  }[];
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: inspection, error: inspError } = await supabase
    .from("inspections")
    .insert({
      part_id: payload.part_id,
      division_id: payload.division_id,
      image_url: payload.image_url,
      ai_result_status: payload.ai_result_status,
      main_defect: payload.main_defect,
      ai_confidence_score: payload.ai_confidence_score,
      inspector_id: user?.id ?? null,
      validation_status: "Pending",
    })
    .select()
    .single();

  if (inspError) {
    console.error("Error saving inspection:", inspError);
    return { error: inspError.message };
  }

  if (payload.anomalies.length > 0) {
    const anomaliesToInsert = payload.anomalies.map((a) => ({
      inspection_id: inspection.id,
      defect_type: a.defect_type,
      location: a.location,
      description: a.description,
      confidence_score: a.confidence_score,
      bounding_box: (a.bounding_box ?? null) as Json | null,
    }));

    const { error: anomError } = await supabase
      .from("anomalies")
      .insert(anomaliesToInsert);

    if (anomError) {
      console.error("Error saving anomalies:", anomError);
    }
  }

  revalidatePath("/");
  revalidatePath("/detection-result");
  return { data: inspection };
}

// ─────────────────────────────────────────────
// UPDATE INSPECTION STATUS
// ─────────────────────────────────────────────

export async function updateInspectionStatus(
  inspectionId: string,
  status: "Resolved" | "Reworked" | "Scrapped",
  note?: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inspections")
    .update({
      validation_status: status,
      resolution_note: note ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", inspectionId)
    .select();

  if (error) {
    console.error("Error updating inspection status:", error);
    return { error: error.message };
  }

  revalidatePath("/detection-result");
  revalidatePath("/database");

  return { data };
}

// ─────────────────────────────────────────────
// DELETE INSPECTION
// ─────────────────────────────────────────────

export async function deleteInspection(inspectionId: string) {
  const supabase = await createClient();

  // Anomalies will cascade-delete if FK is set, otherwise delete manually first
  const { error: anomError } = await supabase
    .from("anomalies")
    .delete()
    .eq("inspection_id", inspectionId);

  if (anomError) {
    console.error("Error deleting anomalies:", anomError);
    return { error: anomError.message };
  }

  const { error } = await supabase
    .from("inspections")
    .delete()
    .eq("id", inspectionId);

  if (error) {
    console.error("Error deleting inspection:", error);
    return { error: error.message };
  }

  revalidatePath("/detection-result");
  revalidatePath("/database");

  return { success: true };
}

// ─────────────────────────────────────────────
// DEFECT DISTRIBUTION (Pie Chart)
// ─────────────────────────────────────────────

export async function getDefectDistribution() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inspections")
    .select("main_defect")
    .not("main_defect", "is", null)
    .neq("main_defect", "None");

  if (error) {
    console.error("Error fetching defect distribution:", error);
    return [];
  }

  const distribution: Record<string, number> = {};
  data.forEach((item) => {
    const type = item.main_defect ?? "Unknown";
    distribution[type] = (distribution[type] ?? 0) + 1;
  });

  return Object.entries(distribution).map(([name, value]) => ({ name, value }));
}

// ─────────────────────────────────────────────
// EMPLOYEE ID GENERATOR
// ─────────────────────────────────────────────

export async function getNextEmployeeId() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("employee_id")
    .like("employee_id", "REKA-QC-%");

  if (error) {
    console.error("Error fetching latest employee ID:", error);
    return "REKA-QC-001";
  }

  const seqIds = data
    .map((u) => u.employee_id?.match(/REKA-QC-(\d+)/)?.[1])
    .filter(Boolean)
    .map(Number)
    .filter((n) => n < 1000) // Ignore legacy random 4-digit IDs to start sequence from 001
    .sort((a, b) => b - a);

  if (seqIds.length === 0) {
    return "REKA-QC-001";
  }

  const nextNum = seqIds[0] + 1;
  return `REKA-QC-${String(nextNum).padStart(3, "0")}`;
}
