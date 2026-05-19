"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertCircle,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  FileText,
  Check,
  X,
  ArrowRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import type { MonthlyDivisionStatRow } from "@/app/actions/database";
import { useInspectionStore } from "@/store/use-inspection-store";
import { useDivisionsStore } from "@/store/use-divisions-store";
import { useStatsStore } from "@/store/use-stats-store";

// ─── Types ────────────────────────────────────────────────────
type ChartRow = {
  month: string;
  okay: number;
  cat_mengelupas: number;
  cat_meleber: number;
  besi_lengkung: number;
  baret: number;
};

type ValidationAction = "Resolved" | "Reworked" | "Scrapped";

// ─── Constants ────────────────────────────────────────────────
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80";

const COLORS = [
  "#10b981", // Okay (Green)
  "#f97316", // Cat mengelupas (Orange)
  "#fbbf24", // Cat meleber (Amber)
  "#8b5cf6", // Besi lengkung (Purple)
  "#ec4899", // Baret (Pink)
];

const DEFECT_COLORS: Record<string, string> = {
  okay: COLORS[0],
  cat_mengelupas: COLORS[1],
  cat_meleber: COLORS[2],
  besi_lengkung: COLORS[3],
  baret: COLORS[4],
};

const DEFECT_LABELS: Record<string, string> = {
  okay: "Okay",
  cat_mengelupas: "Cat Mengelupas",
  cat_meleber: "Cat Meleber",
  besi_lengkung: "Besi Lengkung",
  baret: "Baret",
};


function buildDefectChartData(
  rows: MonthlyDivisionStatRow[],
  selectedDivisionName: string | null,
): ChartRow[] {
  const map = new Map<string, ChartRow>();

  rows.forEach((r) => {
    // If a division is selected, only include matches
    if (selectedDivisionName && r.division_name !== selectedDivisionName) return;

    const key = `${r.month_label} ${r.year_num}`;
    if (!map.has(key)) {
      map.set(key, {
        month: r.month_label,
        okay: 0,
        cat_mengelupas: 0,
        cat_meleber: 0,
        besi_lengkung: 0,
        baret: 0,
      });
    }

    const entry = map.get(key)!;
    entry.okay += Number(r.okay_count);
    entry.cat_mengelupas += Number(r.cat_mengelupas);
    entry.cat_meleber += Number(r.cat_meleber);
    entry.besi_lengkung += Number(r.besi_lengkung);
    entry.baret += Number(r.baret);
  });

  return Array.from(map.values());
}

// ─── Component ────────────────────────────────────────────────
export default function DetectionResultPage() {
  // ── Stores ────────────────────────────────────────────────
  const {
    inspections,
    isLoading: inspLoading,
    fetchInspections,
    patchStatus,
  } = useInspectionStore();

  const {
    divisions: rawDivisions,
    isLoading: divsLoading,
    fetchDivisions,
  } = useDivisionsStore();

  const {
    monthlyDivisionStats,
    isLoading: statsLoading,
    fetchAll: fetchStats,
  } = useStatsStore();

  // ── Local UI state ────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("Detected");
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDetectionId, setSelectedDetectionId] = useState<string | null>(
    null,
  );

  // Chart derived state
  const [chartData, setChartData] = useState<ChartRow[]>([]);
  // Validation dialog
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [validatingPartId, setValidatingPartId] = useState("");
  const [validationAction, setValidationAction] =
    useState<ValidationAction>("Resolved");
  const [resolutionNote, setResolutionNote] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  // Track first render to avoid double fetch
  const [isFirstRender, setIsFirstRender] = useState(true);

  // Derived values
  const divisions = React.useMemo(() => rawDivisions.map((d) => ({
    id: d.id,
    name: d.name,
    desc: d.description ?? "",
    color: d.color_code ?? "#64748b",
  })), [rawDivisions]);

  const loading = inspLoading || divsLoading;
  const chartLoading = statsLoading;
  const isFiltered = !!dateFrom || !!dateTo;

  // ── On mount: load all data ───────────────────────────────
  useEffect(() => {
    fetchDivisions();
    fetchStats();
    fetchInspections({ limit: 100, offset: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Build chart when monthlyDivisionStats changes ─────────
  useEffect(() => {
    if (monthlyDivisionStats.length === 0) return;
    
    const selectedDivName = selectedDivision 
      ? divisions.find(d => d.id === selectedDivision)?.name || null
      : null;

    setChartData(buildDefectChartData(monthlyDivisionStats, selectedDivName));
  }, [monthlyDivisionStats, selectedDivision, divisions]);

  // ── Re-fetch when date filter changes (skip first render) ──
  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }
    const fromStr = dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined;
    const toStr = dateTo ? format(dateTo, "yyyy-MM-dd") : undefined;
    fetchInspections({
      limit: 100,
      offset: 0,
      dateFrom: fromStr,
      dateTo: toStr,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  // ── Refresh handler ───────────────────────────────────────
  const handleRefresh = useCallback(() => {
    const fromStr = dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined;
    const toStr = dateTo ? format(dateTo, "yyyy-MM-dd") : undefined;
    fetchInspections({
      limit: 100,
      offset: 0,
      dateFrom: fromStr,
      dateTo: toStr,
    });
  }, [fetchInspections, dateFrom, dateTo]);

  // ── Validation helpers ────────────────────────────────────
  function openValidationDialog(
    id: string,
    partId: string,
    action: ValidationAction,
  ) {
    setValidatingId(id);
    setValidatingPartId(partId);
    setValidationAction(action);
    setResolutionNote("");
    setValidationDialogOpen(true);
  }

  async function confirmValidation() {
    if (!validatingId) return;
    setIsValidating(true);
    const result = await patchStatus(
      validatingId,
      validationAction,
      resolutionNote || undefined,
    );
    if (result.error) {
      alert(`Gagal update: ${result.error}`);
    }
    setIsValidating(false);
    setValidationDialogOpen(false);
    setValidatingId(null);
  }

  // ── Derived display data ──────────────────────────────────
  const detectedImages = inspections.map((i) => ({
    id: i.id,
    partId: i.part_id,
    divisionId: i.division_id,
    divisionName: i.divisions?.name ?? "–",
    date: i.inspection_date
      ? format(new Date(i.inspection_date), "dd MMMM yyyy")
      : "–",
    status: i.ai_result_status === "okay" ? "OK" : "NOK",
    mainDefect: i.main_defect ?? "None",
    aiConfidence: i.ai_confidence_score ?? 0,
    imageUrl: i.image_url ?? FALLBACK_IMAGE,
    validationStatus: i.validation_status ?? "Pending",
    inspector: i.users?.full_name ?? "System Inspector",
    anomalies: i.anomalies.map((a) => ({
      id: a.id,
      type: a.defect_type ?? "Unknown",
      confidence: a.confidence_score ?? 0,
      location: a.location ?? "–",
      desc: a.description ?? "–",
      boundingBox: a.bounding_box as {
        top: number;
        left: number;
        width: number;
        height: number;
      } | null,
    })),
  }));

  const pendingTasks = inspections
    .filter((i) => i.validation_status === "Pending")
    .map((i) => ({
      id: i.id,
      partId: i.part_id,
      division: i.divisions?.name ?? "Unknown",
      issue: i.main_defect ?? "No Issue",
      confidence: i.ai_confidence_score ?? 0,
      time: i.inspection_date
        ? format(new Date(i.inspection_date), "dd MMM yyyy, HH:mm")
        : "–",
    }));

  const completedLogs = inspections
    .filter((i) => i.validation_status !== "Pending")
    .map((i) => ({
      id: i.id,
      date: i.inspection_date
        ? format(new Date(i.inspection_date), "dd MMMM yyyy")
        : "–",
      partId: i.part_id,
      division: i.divisions?.name ?? "–",
      issue: i.main_defect ?? "–",
      resolution: i.resolution_note ?? "–",
      inspector: i.users?.full_name ?? "System Inspector",
      status: i.validation_status ?? "Completed",
    }));

  const selectedDetection =
    detectedImages.find((d) => d.id === selectedDetectionId) ??
    detectedImages[0];

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 md:gap-6 w-full max-w-[1600px] mx-auto pb-10 animate-in fade-in duration-500">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-serif">
          Detection Result
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Monitor inspeksi, validasi anomali, dan riwayat resolusi.
        </p>
      </div>

      {/* ── TABS ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {["Detected", "Pending", "Completed"].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "outline"}
            className={cn(
              "rounded-full px-4 md:px-6 transition-all shrink-0 text-sm",
              activeTab === tab
                ? "bg-[#1e1b4b] hover:bg-[#2e2a70] text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === "Pending" && pendingTasks.length > 0 && (
              <Badge
                variant="destructive"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
              >
                {pendingTasks.length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* ── TOP: LINE CHART + DIVISION CARDS ─────────────── */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        {/* Line Chart */}
        <Card className="md:col-span-2 shadow-sm border-sidebar-border/50">
          <CardHeader className="pb-2 px-4 pt-4 md:px-6">
            <CardTitle className="text-sm md:text-base">
              Monthly Detections by Division
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Inspections breakdown across divisions (last 6 months)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 md:p-4 pt-0">

            {chartLoading ? (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading chart...
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                Belum ada data inspeksi untuk ditampilkan.
              </div>
            ) : (
              <div className="h-[240px] md:h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      allowDecimals={false}
                      width={28}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        fontSize: "12px",
                      }}
                      formatter={(value, name) => [value, DEFECT_LABELS[name as string] || name]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                      formatter={(value) => DEFECT_LABELS[value as string] || value}
                    />
                    <Bar
                      dataKey="okay"
                      stackId="a"
                      fill={DEFECT_COLORS.okay}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="cat_mengelupas"
                      stackId="a"
                      fill={DEFECT_COLORS.cat_mengelupas}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="cat_meleber"
                      stackId="a"
                      fill={DEFECT_COLORS.cat_meleber}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="besi_lengkung"
                      stackId="a"
                      fill={DEFECT_COLORS.besi_lengkung}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="baret"
                      stackId="a"
                      fill={DEFECT_COLORS.baret}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Division Cards */}
        <div className="flex flex-col gap-2 md:gap-3">
          {divsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 md:h-20 rounded-xl bg-muted animate-pulse"
              />
            ))
          ) : divisions.length === 0 && inspections.filter((i) => !i.division_id).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No divisions found.
            </p>
          ) : (
            divisions.map((div) => {
              const count = inspections.filter(
                (i) => i.division_id === div.id,
              ).length;
              return (
                <div
                  key={div.id}
                  onClick={() =>
                    setSelectedDivision(
                      selectedDivision === div.id ? null : div.id,
                    )
                  }
                  className={cn(
                    "flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl cursor-pointer transition-all duration-300 border",
                    selectedDivision === div.id
                      ? "bg-[#1e1b4b] text-white border-transparent shadow-md scale-[1.02]"
                      : "bg-card text-foreground border-sidebar-border hover:border-[#1e1b4b]/50",
                  )}
                >
                  <div
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow"
                    style={{ backgroundColor: div.color }}
                  >
                    {div.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className={cn(
                        "font-bold truncate text-sm md:text-base",
                        selectedDivision === div.id
                          ? "text-white"
                          : "text-foreground",
                      )}
                    >
                      {div.name}
                    </h4>
                    <p
                      className={cn(
                        "text-[11px] md:text-xs leading-snug mt-0.5 truncate",
                        selectedDivision === div.id
                          ? "text-slate-300"
                          : "text-muted-foreground",
                      )}
                    >
                      {div.desc}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "shrink-0",
                      selectedDivision === div.id
                        ? "bg-white/20 text-white"
                        : "",
                    )}
                  >
                    {count}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── DATE FILTER TOOLBAR ───────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        {/* Date pickers */}
        <div className="flex items-center gap-1 bg-card p-1 md:p-1.5 rounded-full border shadow-sm overflow-x-auto no-scrollbar">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="rounded-full px-2.5 md:px-4 font-medium text-xs md:text-sm h-8 md:h-9"
              >
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                <span className="truncate max-w-[90px] md:max-w-none">
                  {dateFrom ? format(dateFrom, "dd MMM yy") : "From date"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground font-bold px-0.5 text-xs shrink-0">
            →
          </span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="rounded-full px-2.5 md:px-4 font-medium text-xs md:text-sm h-8 md:h-9"
              >
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                <span className="truncate max-w-[90px] md:max-w-none">
                  {dateTo ? format(dateTo, "dd MMM yy") : "To date"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Clear filter */}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground rounded-full gap-1 h-8 text-xs px-3"
            onClick={() => {
              setDateFrom(undefined);
              setDateTo(undefined);
            }}
          >
            ✕ Clear
          </Button>
        )}

        {/* Refresh */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full ml-auto h-8 w-8 md:h-9 md:w-9"
          onClick={handleRefresh}
          disabled={loading}
          title="Refresh data"
        >
          <RefreshCw
            className={cn(
              "h-3.5 w-3.5 md:h-4 md:w-4",
              loading && "animate-spin",
            )}
          />
        </Button>

        {/* Result count */}
        {isFiltered && (
          <p className="w-full text-xs text-muted-foreground">
            {inspections.length} hasil untuk rentang tanggal yang dipilih.
          </p>
        )}
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/*  TAB CONTENT                                      */}
      {/* ══════════════════════════════════════════════════ */}

      {/* 1. DETECTED – Gallery */}
      {activeTab === "Detected" && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 animate-in slide-in-from-bottom-4 duration-500">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden shadow-sm border"
              >
                <div className="w-full aspect-[4/3] bg-muted animate-pulse" />
                <div className="p-3 md:p-4 bg-card">
                  <div className="h-3 md:h-4 w-20 md:w-24 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))
          ) : detectedImages.length === 0 ? (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              No detections found for the selected criteria.
            </div>
          ) : (
            detectedImages
              .filter((d) => {
                if (!selectedDivision) return true;
                if (selectedDivision === "unknown") return !d.divisionId;
                return d.divisionId === selectedDivision;
              })
              .map((detection) => (
                <Card
                  key={detection.id}
                  className="cursor-pointer overflow-hidden group hover:shadow-md transition-all border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-2xl"
                  onClick={() => {
                    setSelectedDetectionId(detection.id);
                    setIsDetailOpen(true);
                  }}
                >
                  <div className="w-full aspect-[4/3] relative overflow-hidden bg-slate-100">
                    <img
                      src={detection.imageUrl}
                      alt={detection.mainDefect}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 backdrop-blur-sm",
                          detection.validationStatus === "Pending"
                            ? "bg-amber-100/90 text-amber-700 border-amber-300"
                            : "bg-green-100/90 text-green-700 border-green-300",
                        )}
                      >
                        {detection.validationStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-2.5 md:p-4 flex items-center bg-white dark:bg-card gap-2 md:gap-3">
                    <span
                      className={cn(
                        "font-black text-xs md:text-sm uppercase tracking-wide shrink-0",
                        detection.status === "NOK"
                          ? "text-destructive"
                          : "text-emerald-600",
                      )}
                    >
                      {detection.status}
                    </span>
                    <div className="h-3 md:h-4 w-[2px] bg-slate-200 shrink-0" />
                    <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {detection.mainDefect}
                    </span>
                  </div>
                </Card>
              ))
          )}
        </div>
      )}

      {/* 2. PENDING – Verification queue */}
      {activeTab === "Pending" && (
        <Card className="border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-amber-500/10 border-b border-amber-500/20 pb-3 md:pb-4 px-4 pt-4 md:px-6">
            <CardTitle className="flex items-center gap-2 text-amber-600 text-base md:text-lg">
              <Clock className="w-4 h-4 md:w-5 md:h-5" /> Menunggu Verifikasi
              Manual
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              AI tidak memiliki tingkat kepercayaan yang tinggi. Dibutuhkan
              konfirmasi manusia.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                <p className="font-medium">
                  Tidak ada inspeksi yang menunggu validasi.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col sm:flex-row items-center justify-between p-6 hover:bg-muted/30 transition-colors gap-4"
                  >
                    <div className="flex items-start gap-3 md:gap-4 w-full">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold shrink-0 text-sm">
                        ?
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-1">
                          <h4 className="font-bold text-sm md:text-base">
                            {task.partId}
                          </h4>
                          <Badge
                            variant="outline"
                            className="text-xs bg-background"
                          >
                            {task.division}
                          </Badge>
                          <span className="text-[10px] md:text-xs text-muted-foreground">
                            {task.time}
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-foreground mb-2">
                          <span className="font-semibold text-muted-foreground">
                            Indikasi AI:
                          </span>{" "}
                          {task.issue}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400"
                              style={{ width: `${task.confidence}%` }}
                            />
                          </div>
                          <span className="text-[10px] md:text-xs text-muted-foreground">
                            Confidence: {task.confidence}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto mt-3 sm:mt-0 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none text-destructive border-destructive/30 hover:bg-destructive/10 text-xs md:text-sm"
                        onClick={() =>
                          openValidationDialog(task.id, task.partId, "Scrapped")
                        }
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm"
                        onClick={() =>
                          openValidationDialog(task.id, task.partId, "Resolved")
                        }
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Validate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 3. COMPLETED – History log */}
      {activeTab === "Completed" && (
        <Card className="border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-emerald-500/10 border-b border-emerald-500/20 pb-3 md:pb-4 px-4 pt-4 md:px-6">
            <CardTitle className="flex items-center gap-2 text-emerald-600 text-base md:text-lg">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> Riwayat
              Inspeksi &amp; Rework
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Daftar komponen yang telah selesai ditindaklanjuti.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : completedLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <FileText className="w-10 h-10 opacity-40" />
                <p className="font-medium">Belum ada riwayat inspeksi.</p>
              </div>
            ) : (
              <div className="divide-y">
                {completedLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-6 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 md:gap-4 mb-3">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <FileText className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground shrink-0" />
                        <h4 className="font-bold text-foreground text-sm md:text-base truncate">
                          {log.partId}
                        </h4>
                        <Badge
                          variant="secondary"
                          className="bg-muted text-muted-foreground text-[10px] md:text-xs shrink-0"
                        >
                          {log.date}
                        </Badge>
                      </div>
                      <Badge
                        className={cn(
                          "px-3 py-1",
                          log.status === "Resolved"
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            : log.status === "Scrapped"
                              ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
                              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
                        )}
                      >
                        {log.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 text-sm mt-2 pl-6 md:pl-8 border-l-2 border-muted ml-1 md:ml-2">
                      <div>
                        <p className="text-muted-foreground text-[10px] md:text-xs mb-0.5 md:mb-1">
                          Masalah Awal
                        </p>
                        <p className="font-medium text-xs md:text-sm">
                          {log.issue}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-[10px] md:text-xs mb-0.5 md:mb-1">
                          Tindakan Penyelesaian
                        </p>
                        <p className="font-medium text-emerald-600 flex items-center gap-1 text-xs md:text-sm">
                          <ArrowRight className="w-3 h-3 shrink-0" />{" "}
                          {log.resolution}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-[10px] md:text-xs mb-0.5 md:mb-1">
                          Inspektur Final
                        </p>
                        <p className="font-medium text-xs md:text-sm">
                          {log.inspector}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── DETAIL MODAL ──────────────────────────────────── */}
      <Dialog
        open={isDetailOpen && !!selectedDetection}
        onOpenChange={setIsDetailOpen}
      >
        {selectedDetection && (
          <DialogContent className="sm:max-w-[1400px] p-0 gap-0 max-h-[92vh] md:h-[88vh] flex flex-col overflow-hidden">
            {/* ── Header ─────────────────────────────────── */}
            <DialogHeader className="shrink-0 px-5 pt-5 pb-4 border-b pr-12">
              <DialogTitle className="text-base md:text-xl font-serif leading-snug">
                Inspeksi:{" "}
                <span className="font-mono">{selectedDetection.partId}</span>
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <Badge
                  className={cn(
                    "text-xs md:text-sm px-2.5 py-0.5 font-bold border-transparent",
                    selectedDetection.status === "OK"
                      ? "bg-emerald-500 text-white hover:bg-emerald-500"
                      : "bg-destructive text-white hover:bg-destructive",
                  )}
                >
                  {selectedDetection.status === "OK" ? "✓ PASSED" : "✗ REJECT"}
                </Badge>
                <DialogDescription className="text-xs m-0">
                  {selectedDetection.date} • Inspector:{" "}
                  {selectedDetection.inspector}
                  {selectedDetection.divisionName !== "–" && (
                    <> • {selectedDetection.divisionName}</>
                  )}
                </DialogDescription>
              </div>
            </DialogHeader>

            {/* ── NOT OKAY Warning Banner ─────────────────── */}
            {selectedDetection.status === "NOK" && (
              <div className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-destructive/10 border-b border-destructive/20 text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-xs md:text-sm font-medium">
                  Anomali terdeteksi — harap lakukan inspeksi fisik segera.
                </p>
              </div>
            )}

            {/* ── Body (scrollable on mobile, split on desktop) ── */}
            <div className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden">
              <div className="flex flex-col md:flex-row md:divide-x divide-border md:h-full">
                {/* ── LEFT: Image + Metadata ─────────────── */}
                <div className="md:w-[60%] shrink-0 p-4 md:p-7 space-y-5 md:overflow-y-auto">
                  {/* Image */}
                  <div
                    className={cn(
                      "relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 shadow-inner",
                      selectedDetection.status === "NOK"
                        ? "ring-2 ring-destructive/40"
                        : "ring-2 ring-emerald-500/30",
                    )}
                  >
                    <img
                      src={selectedDetection.imageUrl}
                      alt={selectedDetection.partId}
                      className="w-full h-full object-cover"
                    />

                    {/* Real bounding box overlays — only for NOK with actual data */}
                    {selectedDetection.status === "NOK" &&
                      selectedDetection.anomalies.map((anom, idx) => {
                        const box = anom.boundingBox;
                        if (!box) return null;
                        const palette = [
                          {
                            border: "border-destructive",
                            bg: "bg-destructive/20",
                            badge: "bg-destructive",
                          },
                          {
                            border: "border-orange-500",
                            bg: "bg-orange-500/20",
                            badge: "bg-orange-500",
                          },
                          {
                            border: "border-yellow-400",
                            bg: "bg-yellow-400/20",
                            badge: "bg-yellow-500",
                          },
                        ];
                        const c = palette[idx % palette.length];
                        return (
                          <div
                            key={anom.id}
                            className={cn(
                              "absolute border-2 rounded-sm animate-in zoom-in-75 duration-300",
                              c.border,
                              c.bg,
                            )}
                            style={{
                              top: `${box.top}%`,
                              left: `${box.left}%`,
                              width: `${box.width}%`,
                              height: `${box.height}%`,
                            }}
                          >
                            <span
                              className={cn(
                                "absolute -top-5 left-0 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-sm whitespace-nowrap",
                                c.badge,
                              )}
                            >
                              {idx + 1}. {anom.type}
                            </span>
                          </div>
                        );
                      })}

                    {/* OK overlay watermark */}
                    {selectedDetection.status === "OK" && (
                      <div className="absolute inset-0 flex items-end justify-end p-3 pointer-events-none">
                        <div className="bg-emerald-500/90 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-md">
                          <CheckCircle2 className="w-3 h-3" /> No anomaly
                          detected
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Metadata grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        Part ID
                      </p>
                      <p className="font-mono font-bold text-sm">
                        {selectedDetection.partId}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        Tanggal Inspeksi
                      </p>
                      <p className="font-medium text-sm">
                        {selectedDetection.date}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        Inspektur
                      </p>
                      <p className="font-medium text-sm truncate">
                        {selectedDetection.inspector}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        Status Validasi
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] md:text-xs w-fit",
                          selectedDetection.validationStatus === "Pending"
                            ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400"
                            : "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400",
                        )}
                      >
                        {selectedDetection.validationStatus}
                      </Badge>
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div className="p-3 md:p-5 bg-muted/30 rounded-xl border space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        AI Confidence Level
                      </span>
                      <span
                        className={cn(
                          "text-sm font-bold",
                          selectedDetection.status === "OK"
                            ? "text-emerald-600"
                            : "text-destructive",
                        )}
                      >
                        {selectedDetection.aiConfidence}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          selectedDetection.status === "OK"
                            ? "bg-emerald-500"
                            : "bg-destructive",
                        )}
                        style={{ width: `${selectedDetection.aiConfidence}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedDetection.status === "OK"
                        ? "Model confident komponen dalam kondisi baik."
                        : "Model confident ditemukan defect pada komponen."}
                    </p>
                  </div>
                </div>

                {/* ── RIGHT: Anomaly List + Actions ──────── */}
                <div className="md:flex-1 flex flex-col md:overflow-hidden border-t md:border-t-0">
                  {/* Anomaly list — scrollable */}
                  <div className="flex-1 p-4 md:p-6 md:overflow-y-auto space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Identified Issues
                      </h4>
                      <Badge variant="secondary" className="text-xs font-bold">
                        {selectedDetection.anomalies.length}
                      </Badge>
                    </div>

                    {selectedDetection.anomalies.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 md:py-12 gap-3 text-muted-foreground">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 opacity-70" />
                        <div className="text-center space-y-1">
                          <p className="text-sm font-semibold">
                            Tidak ada anomali terdeteksi
                          </p>
                          <p className="text-xs">
                            Komponen ini lolos pemeriksaan AI.
                          </p>
                        </div>
                      </div>
                    ) : (
                      selectedDetection.anomalies.map((anom, idx) => (
                        <div
                          key={anom.id}
                          className="p-3 rounded-xl border bg-card hover:bg-muted/40 transition-colors space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-sm truncate">
                                {anom.type}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-[10px] shrink-0 bg-destructive/5 text-destructive border-destructive/30"
                            >
                              {anom.confidence}%
                            </Badge>
                          </div>
                          <div className="pl-7 space-y-1.5">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-semibold text-foreground/80">
                                Lokasi:
                              </span>{" "}
                              {anom.location}
                            </p>
                            <p className="text-xs text-muted-foreground bg-muted/40 px-2.5 py-2 rounded-lg leading-relaxed border border-border/50">
                              {anom.desc}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Action buttons — pinned at bottom */}
                  {selectedDetection.validationStatus === "Pending" && (
                    <div className="shrink-0 border-t p-4 md:p-6 flex gap-3 bg-card">
                      <Button
                        variant="outline"
                        className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10 text-sm h-10"
                        onClick={() => {
                          setIsDetailOpen(false);
                          openValidationDialog(
                            selectedDetection.id,
                            selectedDetection.partId,
                            "Scrapped",
                          );
                        }}
                      >
                        <X className="w-4 h-4 mr-1.5" /> Reject
                      </Button>
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm h-10"
                        onClick={() => {
                          setIsDetailOpen(false);
                          openValidationDialog(
                            selectedDetection.id,
                            selectedDetection.partId,
                            "Resolved",
                          );
                        }}
                      >
                        <Check className="w-4 h-4 mr-1.5" /> Validate
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* ── VALIDATION DIALOG ─────────────────────────────── */}
      <AlertDialog
        open={validationDialogOpen}
        onOpenChange={setValidationDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {validationAction === "Resolved"
                ? "✅ Konfirmasi Validasi"
                : "❌ Konfirmasi Reject (Scrap)"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menandai{" "}
              <span className="font-bold font-mono text-foreground">
                {validatingPartId}
              </span>{" "}
              sebagai{" "}
              <span className="font-bold text-foreground">
                {validationAction}
              </span>
              . Tindakan ini akan mengubah status validasi secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-2 space-y-2">
            <label className="text-sm font-medium">
              Catatan Resolusi{" "}
              <span className="text-muted-foreground font-normal">
                (opsional)
              </span>
            </label>
            <Input
              placeholder="Contoh: Ditemukan goresan pada permukaan roda..."
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isValidating}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmValidation}
              disabled={isValidating}
              className={
                validationAction === "Resolved"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-destructive hover:bg-destructive/90 text-white"
              }
            >
              {isValidating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                `Ya, ${validationAction}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
