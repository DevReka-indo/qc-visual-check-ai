"use server";

import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

const AUTH_COOKIE_NAME = "auth-token";

export type DivisionItem = {
  id: string;
  name: string;
  description: string | null;
  color_code: string | null;
  created_at: string;
};

export type UserProfileWithDivision = {
  id: string;
  email: string | null;
  full_name: string | null;
  employee_id: string | null;
  role: string | null;
  status: string | null;
  avatar_url: string | null;
  last_login: string | null;
  division_id: string | null;
  created_at: string;
  updated_at: string;
  divisions: DivisionItem | null;
};

export type AnomalyWithDetails = {
  id: string;
  inspection_id: string;
  defect_type: string | null;
  location: string | null;
  description: string | null;
  confidence_score: number | null;
  bounding_box: Prisma.JsonValue | null;
  created_at: string;
};

export type InspectionWithDetails = {
  id: string;
  part_id: string;
  division_id: string | null;
  inspection_date: string;
  image_url: string | null;
  ai_result_status: string;
  main_defect: string | null;
  ai_confidence_score: number | null;
  validation_status: string | null;
  inspector_id: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
  divisions: DivisionItem | null;
  anomalies: AnomalyWithDetails[];
  users: { full_name: string | null } | null;
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

type AuthPayload = NonNullable<ReturnType<typeof verifyToken>>;

type DivisionRecord = {
  id: string;
  name: string;
  description: string | null;
  colorCode: string | null;
  createdAt: Date;
};

type UserProfileRecord = {
  id: string;
  email: string;
  fullName: string | null;
  employeeId: string | null;
  role: string;
  status: string;
  avatarUrl: string | null;
  lastLogin: Date | null;
  divisionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  division: DivisionRecord | null;
};

type InspectionRecord = {
  id: string;
  partId: string;
  divisionId: string | null;
  inspectionDate: Date;
  imageUrl: string | null;
  aiResultStatus: string;
  mainDefect: string | null;
  aiConfidenceScore: number | null;
  validationStatus: string;
  inspectorId: string | null;
  resolutionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  division: DivisionRecord | null;
  anomalies: {
    id: string;
    inspectionId: string;
    defectType: string | null;
    location: string | null;
    description: string | null;
    confidenceScore: number | null;
    boundingBox: Prisma.JsonValue | null;
    createdAt: Date;
  }[];
  inspector: { fullName: string | null } | null;
};

type ProfileUpdates = {
  full_name?: string;
  avatar_url?: string;
  division_id?: string | null;
  employee_id?: string;
  fullName?: string;
  avatarUrl?: string;
  divisionId?: string | null;
  employeeId?: string;
};

async function getAuthPayload(): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return token ? verifyToken(token) : null;
}

function canAccessUser(payload: AuthPayload, userId: string) {
  return payload.userId === userId || payload.role === "admin";
}

function toIso(date: Date | null | undefined) {
  return date ? date.toISOString() : null;
}

function mapDivision(division: DivisionRecord | null): DivisionItem | null {
  if (!division) return null;

  return {
    id: division.id,
    name: division.name,
    description: division.description,
    color_code: division.colorCode,
    created_at: division.createdAt.toISOString(),
  };
}

function mapUserProfile(user: UserProfileRecord): UserProfileWithDivision {
  return {
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    employee_id: user.employeeId,
    role: user.role,
    status: user.status,
    avatar_url: user.avatarUrl,
    last_login: toIso(user.lastLogin),
    division_id: user.divisionId,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
    divisions: mapDivision(user.division),
  };
}

function mapInspection(inspection: InspectionRecord): InspectionWithDetails {
  return {
    id: inspection.id,
    part_id: inspection.partId,
    division_id: inspection.divisionId,
    inspection_date: inspection.inspectionDate.toISOString(),
    image_url: inspection.imageUrl,
    ai_result_status: inspection.aiResultStatus,
    main_defect: inspection.mainDefect,
    ai_confidence_score: inspection.aiConfidenceScore,
    validation_status: inspection.validationStatus,
    inspector_id: inspection.inspectorId,
    resolution_note: inspection.resolutionNote,
    created_at: inspection.createdAt.toISOString(),
    updated_at: inspection.updatedAt.toISOString(),
    divisions: mapDivision(inspection.division),
    anomalies: inspection.anomalies.map((anomaly) => ({
      id: anomaly.id,
      inspection_id: anomaly.inspectionId,
      defect_type: anomaly.defectType,
      location: anomaly.location,
      description: anomaly.description,
      confidence_score: anomaly.confidenceScore,
      bounding_box: anomaly.boundingBox,
      created_at: anomaly.createdAt.toISOString(),
    })),
    users: inspection.inspector
      ? { full_name: inspection.inspector.fullName }
      : null,
  };
}

// ─────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────

export async function getDashboardStats() {
  try {
    const [totalInspections, totalAnomalies, activeOperators, pendingTasks, okayCount] =
      await Promise.all([
      prisma.inspection.count(),
      prisma.anomaly.count(),
      prisma.user.count({
        where: { status: "online" },
      }),
      prisma.inspection.count({
        where: { validationStatus: "Pending" },
      }),
      prisma.inspection.count({
        where: { aiResultStatus: "okay" },
      }),
    ]);

    const accuracyRate = totalInspections > 0 ? (okayCount / totalInspections) * 100 : 0;
    const roundedAccuracy = parseFloat(accuracyRate.toFixed(2));

    return {
      total_inspections: totalInspections,
      total_anomalies: totalAnomalies,
      accuracy_rate: roundedAccuracy,
      accuracy_percentage: roundedAccuracy,
      active_operators: activeOperators,
      active_hours: activeOperators * 8,
      pending_tasks: pendingTasks,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return null;
  }
}

// ─────────────────────────────────────────────
// MONTHLY STATS (Bar Chart – Statistic Page)
// ─────────────────────────────────────────────

export async function getMonthlyStats(
  monthsBack: number = 6,
): Promise<MonthlyStatRow[]> {
  try {
    const thresholdDate = new Date();
    thresholdDate.setMonth(thresholdDate.getMonth() - monthsBack);

    const inspections = await prisma.inspection.findMany({
      where: {
        inspectionDate: {
          gte: thresholdDate,
        },
      },
      select: {
        inspectionDate: true,
        aiResultStatus: true,
        mainDefect: true,
      },
    });

    // Group by month
    const monthlyData: Map<string, MonthlyStatRow> = new Map();

    inspections.forEach((inspection) => {
      const date = new Date(inspection.inspectionDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthLabel = date.toLocaleString("default", { month: "short", year: "numeric" });
      const key = `${year}-${month}`;

      if (!monthlyData.has(key)) {
        monthlyData.set(key, {
          month_label: monthLabel,
          year_num: year,
          month_num: month,
          okay_count: 0,
          not_okay_count: 0,
          cat_mengelupas: 0,
          cat_meleber: 0,
          besi_lengkung: 0,
          baret: 0,
        });
      }

      const row = monthlyData.get(key)!;
      if (inspection.aiResultStatus === "okay") {
        row.okay_count++;
      } else {
        row.not_okay_count++;
      }

      // Count defect types
      if (inspection.mainDefect) {
        const defectKey = inspection.mainDefect.toLowerCase();
        if (defectKey === "cat_mengelupas" || defectKey.includes("mengelupas")) row.cat_mengelupas++;
        else if (defectKey === "cat_meleber" || defectKey.includes("meleber")) row.cat_meleber++;
        else if (defectKey === "besi_lengkung" || defectKey.includes("lengkung")) row.besi_lengkung++;
        else if (defectKey === "baret" || defectKey.includes("baret")) row.baret++;
      }
    });

    return Array.from(monthlyData.values()).sort((a, b) => {
      if (a.year_num !== b.year_num) return a.year_num - b.year_num;
      return a.month_num - b.month_num;
    });
  } catch (error) {
    console.error("Error fetching monthly stats:", error);
    return [];
  }
}

// ─────────────────────────────────────────────
// MONTHLY DIVISION STATS (Line Chart – Detection Result Page)
// ─────────────────────────────────────────────

export async function getMonthlyDivisionStats(
  monthsBack: number = 6,
): Promise<MonthlyDivisionStatRow[]> {
  try {
    const thresholdDate = new Date();
    thresholdDate.setMonth(thresholdDate.getMonth() - monthsBack);

    const inspections = await prisma.inspection.findMany({
      where: {
        inspectionDate: {
          gte: thresholdDate,
        },
      },
      include: {
        division: true,
      },
    });

    // Group by month and division
    const monthlyDivisionData: Map<string, MonthlyDivisionStatRow> = new Map();

    inspections.forEach((inspection) => {
      const date = new Date(inspection.inspectionDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthLabel = date.toLocaleString("default", { month: "short", year: "numeric" });
      const divisionName = inspection.division?.name ?? "Unknown";
      const key = `${year}-${month}-${divisionName}`;

      if (!monthlyDivisionData.has(key)) {
        monthlyDivisionData.set(key, {
          month_label: monthLabel,
          year_num: year,
          month_num: month,
          division_name: divisionName,
          total_count: 0,
          okay_count: 0,
          cat_mengelupas: 0,
          cat_meleber: 0,
          besi_lengkung: 0,
          baret: 0,
        });
      }

      const row = monthlyDivisionData.get(key)!;
      row.total_count++;

      if (inspection.aiResultStatus === "okay") {
        row.okay_count++;
      }

      // Count defect types
      if (inspection.mainDefect) {
        const defectKey = inspection.mainDefect.toLowerCase();
        if (defectKey === "cat_mengelupas" || defectKey.includes("mengelupas")) row.cat_mengelupas++;
        else if (defectKey === "cat_meleber" || defectKey.includes("meleber")) row.cat_meleber++;
        else if (defectKey === "besi_lengkung" || defectKey.includes("lengkung")) row.besi_lengkung++;
        else if (defectKey === "baret" || defectKey.includes("baret")) row.baret++;
      }
    });

    return Array.from(monthlyDivisionData.values()).sort((a, b) => {
      if (a.year_num !== b.year_num) return a.year_num - b.year_num;
      if (a.month_num !== b.month_num) return a.month_num - b.month_num;
      return a.division_name.localeCompare(b.division_name);
    });
  } catch (error) {
    console.error("Error fetching monthly division stats:", error);
    return [];
  }
}

// ─────────────────────────────────────────────
// DIVISIONS
// ─────────────────────────────────────────────

export async function getDivisions() {
  try {
    const divisions = await prisma.division.findMany({
      orderBy: { name: "asc" },
    });
    return divisions.map(mapDivision).filter((division): division is DivisionItem => division !== null);
  } catch (error) {
    console.error("Error fetching divisions:", error);
    return [];
  }
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
  try {
    const whereConditions: Prisma.InspectionWhereInput = {};
    const inspectionDateFilter: Prisma.DateTimeFilter = {};

    if (status) {
      whereConditions.validationStatus = status;
    }

    if (dateFrom) {
      inspectionDateFilter.gte = new Date(dateFrom);
    }

    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      inspectionDateFilter.lte = endDate;
    }

    if (inspectionDateFilter.gte || inspectionDateFilter.lte) {
      whereConditions.inspectionDate = inspectionDateFilter;
    }

    const [data, count] = await Promise.all([
      prisma.inspection.findMany({
        where: whereConditions,
        include: {
          division: true,
          anomalies: true,
          inspector: {
            select: { fullName: true },
          },
        },
        orderBy: { inspectionDate: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.inspection.count({ where: whereConditions }),
    ]);

    return {
      data: data.map((item) => mapInspection(item)),
      count,
    };
  } catch (error) {
    console.error("Error fetching inspections:", error);
    return { data: [], count: 0 };
  }
}

// ─────────────────────────────────────────────
// USER PROFILE
// ─────────────────────────────────────────────

export async function getUserProfile(userId: string) {
  try {
    const payload = await getAuthPayload();
    if (!payload || !canAccessUser(payload, userId)) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { division: true },
    });

    return user ? mapUserProfile(user) : null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  updates: ProfileUpdates,
) {
  try {
    const payload = await getAuthPayload();
    if (!payload || !canAccessUser(payload, userId)) {
      return { error: "Not authenticated" };
    }

    const updateData: Prisma.UserUpdateInput = {};

    const fullName = updates.full_name ?? updates.fullName;
    const avatarUrl = updates.avatar_url ?? updates.avatarUrl;
    const divisionId = updates.division_id ?? updates.divisionId;
    const employeeId = updates.employee_id ?? updates.employeeId;

    if (fullName !== undefined) updateData.fullName = fullName;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (employeeId !== undefined) updateData.employeeId = employeeId;
    if (divisionId !== undefined) {
      updateData.division = divisionId
        ? { connect: { id: divisionId } }
        : { disconnect: true };
    }

    const data = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { division: true },
    });

    revalidatePath("/user");
    return { data: mapUserProfile(data) };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { error: "Failed to update profile" };
  }
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
  try {
    const authPayload = await getAuthPayload();
    if (!authPayload) {
      return { error: "Not authenticated" };
    }

    const inspection = await prisma.inspection.create({
      data: {
        partId: payload.part_id,
        divisionId: payload.division_id || null,
        imageUrl: payload.image_url,
        aiResultStatus: payload.ai_result_status,
        mainDefect: payload.main_defect,
        aiConfidenceScore: payload.ai_confidence_score,
        inspectorId: authPayload.userId,
        validationStatus: "Pending",
      },
    });

    if (payload.anomalies.length > 0) {
      const anomaliesToInsert = payload.anomalies.map((a) => {
        const base = {
          inspectionId: inspection.id,
          defectType: a.defect_type,
          location: a.location,
          description: a.description,
          confidenceScore: a.confidence_score,
        };

        return a.bounding_box === undefined
          ? base
          : {
              ...base,
              boundingBox: a.bounding_box as Prisma.InputJsonValue,
            };
      });

      await prisma.anomaly.createMany({
        data: anomaliesToInsert,
      });
    }

    revalidatePath("/");
    revalidatePath("/detection-result");
    return { data: inspection };
  } catch (error) {
    console.error("Error saving inspection:", error);
    return { error: "Failed to save inspection" };
  }
}

// ─────────────────────────────────────────────
// UPDATE INSPECTION STATUS
// ─────────────────────────────────────────────

export async function updateInspectionStatus(
  inspectionId: string,
  status: "Resolved" | "Reworked" | "Scrapped",
  note?: string,
) {
  try {
    const payload = await getAuthPayload();
    if (!payload) {
      return { error: "Not authenticated" };
    }

    const data = await prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        validationStatus: status,
        resolutionNote: note ?? null,
        inspectorId: payload.userId,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/detection-result");
    revalidatePath("/database");

    return { data };
  } catch (error) {
    console.error("Error updating inspection status:", error);
    return { error: "Failed to update inspection status" };
  }
}

// ─────────────────────────────────────────────
// DELETE INSPECTION
// ─────────────────────────────────────────────

export async function deleteInspection(inspectionId: string) {
  try {
    const payload = await getAuthPayload();
    if (!payload) {
      return { error: "Not authenticated" };
    }

    // Delete anomalies first (cascade will happen automatically)
    await prisma.anomaly.deleteMany({
      where: { inspectionId },
    });

    // Then delete inspection
    await prisma.inspection.delete({
      where: { id: inspectionId },
    });

    revalidatePath("/detection-result");
    revalidatePath("/database");

    return { success: true };
  } catch (error) {
    console.error("Error deleting inspection:", error);
    return { error: "Failed to delete inspection" };
  }
}

// ─────────────────────────────────────────────
// DEFECT DISTRIBUTION (Pie Chart)
// ─────────────────────────────────────────────

export async function getDefectDistribution() {
  try {
    const inspections = await prisma.inspection.findMany({
      where: {
        mainDefect: {
          not: null,
        },
      },
      select: { mainDefect: true },
    });

    const distribution: Record<string, number> = {};
    inspections.forEach((item) => {
      const type = item.mainDefect ?? "Unknown";
      distribution[type] = (distribution[type] ?? 0) + 1;
    });

    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  } catch (error) {
    console.error("Error fetching defect distribution:", error);
    return [];
  }
}

// ─────────────────────────────────────────────
// EMPLOYEE ID GENERATOR
// ─────────────────────────────────────────────

export async function getNextEmployeeId() {
  try {
    const users = await prisma.user.findMany({
      where: {
        employeeId: {
          startsWith: "REKA-QC-",
        },
      },
      select: { employeeId: true },
    });

    const seqIds = users
      .map((u) => u.employeeId?.match(/REKA-QC-(\d+)/)?.[1])
      .filter(Boolean)
      .map(Number)
      .filter((n) => n < 1000)
      .sort((a, b) => b - a);

    if (seqIds.length === 0) {
      return "REKA-QC-001";
    }

    const nextNum = seqIds[0] + 1;
    return `REKA-QC-${String(nextNum).padStart(3, "0")}`;
  } catch (error) {
    console.error("Error fetching latest employee ID:", error);
    return "REKA-QC-001";
  }
}
