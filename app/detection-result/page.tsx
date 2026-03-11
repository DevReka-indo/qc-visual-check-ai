"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
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
  [divisionName: string]: string | number;
};

type ValidationAction = "Resolved" | "Reworked" | "Scrapped";

// ─── Constants ────────────────────────────────────────────────
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80";

const DIVISION_COLORS: Record<string, string> = {
  "Final Mechanic": "#94a3b8",
  "Final Electric": "#ef4444",
  Incoming: "#1d4ed8",
};

// ─── Helpers ──────────────────────────────────────────────────
function getDivisionColor(name: string, idx: number): string {
  if (DIVISION_COLORS[name]) return DIVISION_COLORS[name];
  const fallbacks = ["#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
  return fallbacks[idx % fallbacks.length];
}

function buildChartData(
  rows: MonthlyDivisionStatRow[],
  divisionNames: string[],
): ChartRow[] {
  const map = new Map<string, ChartRow>();

  rows.forEach((r) => {
    const key = `${r.month_label} ${r.year_num}`;
    if (!map.has(key)) {
      const entry: ChartRow = { month: r.month_label };
      divisionNames.forEach((d) => (entry[d] = 0));
      map.set(key, entry);
    }
    const entry = map.get(key)!;
    entry[r.division_name] = Number(r.total_count);
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
  const [divisionNames, setDivisionNames] = useState<string[]>([]);

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
  const divisions = rawDivisions.map((d) => ({
    id: d.id,
    name: d.name,
    desc: d.description ?? "",
    color: d.color_code ?? "#64748b",
  }));

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
    const names = Array.from(
      new Set(monthlyDivisionStats.map((r) => r.division_name)),
    );
    setDivisionNames(names);
    setChartData(buildChartData(monthlyDivisionStats, names));
  }, [monthlyDivisionStats]);

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
    date: i.inspection_date
      ? format(new Date(i.inspection_date), "dd MMMM yyyy")
      : "–",
    status: i.ai_result_status === "okay" ? "OK" : "NOK",
    mainDefect: i.main_defect ?? "None",
    imageUrl: i.image_url ?? FALLBACK_IMAGE,
    validationStatus: i.validation_status ?? "Pending",
    inspector: i.users?.full_name ?? "System Inspector",
    anomalies: i.anomalies.map((a) => ({
      id: a.id,
      type: a.defect_type ?? "Unknown",
      confidence: a.confidence_score ?? 0,
      location: a.location ?? "–",
      desc: a.description ?? "–",
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
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-10 animate-in fade-in duration-500">
      {/* ── TABS ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {["Detected", "Pending", "Completed"].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "outline"}
            className={cn(
              "rounded-full px-6 transition-all",
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
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Line Chart */}
        <Card className="lg:col-span-2 shadow-sm border-sidebar-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Monthly Detections by Division
            </CardTitle>
            <CardDescription>
              Inspections breakdown across divisions (last 6 months)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {divisionNames.map((name, idx) => (
                <div key={name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getDivisionColor(name, idx) }}
                  />
                  <span className="text-sm font-medium">{name}</span>
                </div>
              ))}
            </div>

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
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
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
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    {divisionNames.map((name, idx) => (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stroke={getDivisionColor(name, idx)}
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Division Cards */}
        <div className="flex flex-col gap-3">
          {divsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))
          ) : divisions.length === 0 ? (
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
                    "flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 border",
                    selectedDivision === div.id
                      ? "bg-[#1e1b4b] text-white border-transparent shadow-md scale-[1.02]"
                      : "bg-card text-foreground border-sidebar-border hover:border-[#1e1b4b]/50",
                  )}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow"
                    style={{ backgroundColor: div.color }}
                  >
                    {div.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className={cn(
                        "font-bold truncate",
                        selectedDivision === div.id
                          ? "text-white"
                          : "text-foreground",
                      )}
                    >
                      {div.name}
                    </h4>
                    <p
                      className={cn(
                        "text-xs leading-snug mt-0.5 truncate",
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
      <div className="flex flex-wrap items-center gap-3 mt-2">
        <div className="flex items-center gap-2 bg-card p-1.5 rounded-full border shadow-sm flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="rounded-full px-4 font-medium text-sm"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "dd MMM yyyy") : "From date"}
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

          <span className="text-muted-foreground font-bold px-1">→</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="rounded-full px-4 font-medium text-sm"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "dd MMM yyyy") : "To date"}
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

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground rounded-full gap-1"
            onClick={() => {
              setDateFrom(undefined);
              setDateTo(undefined);
            }}
          >
            <span className="text-xs">Clear filter</span>
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full ml-auto"
          onClick={handleRefresh}
          disabled={loading}
          title="Refresh data"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>

        {isFiltered && (
          <p className="text-xs text-muted-foreground">
            Showing {inspections.length} result
            {inspections.length !== 1 ? "s" : ""} for selected date range.
          </p>
        )}
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/*  TAB CONTENT                                      */}
      {/* ══════════════════════════════════════════════════ */}

      {/* 1. DETECTED – Gallery */}
      {activeTab === "Detected" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden shadow-sm border"
              >
                <div className="w-full aspect-[4/3] bg-muted animate-pulse" />
                <div className="p-4 bg-card">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))
          ) : detectedImages.length === 0 ? (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              No detections found for the selected criteria.
            </div>
          ) : (
            detectedImages
              .filter(
                (d) => !selectedDivision || d.divisionId === selectedDivision,
              )
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
                  <div className="p-4 flex items-center bg-white dark:bg-card gap-3">
                    <span
                      className={cn(
                        "font-black text-sm uppercase tracking-wide",
                        detection.status === "NOK"
                          ? "text-destructive"
                          : "text-emerald-600",
                      )}
                    >
                      {detection.status}
                    </span>
                    <div className="h-4 w-[2px] bg-slate-200" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
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
          <CardHeader className="bg-amber-500/10 border-b border-amber-500/20 pb-4">
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <Clock className="w-5 h-5" /> Menunggu Verifikasi Manual
            </CardTitle>
            <CardDescription>
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
                    <div className="flex items-start gap-4 w-full">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold shrink-0">
                        ?
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-bold text-base">{task.partId}</h4>
                          <Badge
                            variant="outline"
                            className="text-xs bg-background"
                          >
                            {task.division}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {task.time}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mb-2">
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
                          <span className="text-xs text-muted-foreground">
                            Confidence: {task.confidence}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0 shrink-0">
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() =>
                          openValidationDialog(task.id, task.partId, "Scrapped")
                        }
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
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
          <CardHeader className="bg-emerald-500/10 border-b border-emerald-500/20 pb-4">
            <CardTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" /> Riwayat Inspeksi &amp; Rework
            </CardTitle>
            <CardDescription>
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
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <h4 className="font-bold text-foreground">
                          {log.partId}
                        </h4>
                        <Badge
                          variant="secondary"
                          className="bg-muted text-muted-foreground"
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-2 pl-8 border-l-2 border-muted ml-2">
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">
                          Masalah Awal
                        </p>
                        <p className="font-medium">{log.issue}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">
                          Tindakan Penyelesaian
                        </p>
                        <p className="font-medium text-emerald-600 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" /> {log.resolution}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">
                          Inspektur Final
                        </p>
                        <p className="font-medium">{log.inspector}</p>
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
          <DialogContent className="max-w-5xl bg-background/95 backdrop-blur-md border-sidebar-border shadow-2xl">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-serif">
                In-depth Analysis: {selectedDetection.partId}
              </DialogTitle>
              <DialogDescription>
                Visual mapping of detected issues on {selectedDetection.date} —
                Inspector: {selectedDetection.inspector}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="col-span-1 md:col-span-2 border-none shadow-none bg-muted/20">
                <CardContent className="p-0">
                  <div className="w-full aspect-video bg-slate-200 rounded-xl overflow-hidden relative">
                    <img
                      src={selectedDetection.imageUrl}
                      alt="bogie"
                      className="w-full h-full object-cover opacity-80"
                    />
                    {selectedDetection.anomalies.map((anom, idx) => (
                      <div
                        key={anom.id}
                        className={`absolute border-2 rounded-md shadow-[0_0_15px_rgba(0,0,0,0.3)] animate-in zoom-in-50 duration-500 ${
                          idx % 2 === 0
                            ? "border-destructive bg-destructive/10 top-[20%] left-[15%] w-32 h-24"
                            : "border-orange-500 bg-orange-500/10 top-[50%] right-[30%] w-24 h-16"
                        }`}
                      >
                        <Badge
                          className={`absolute -top-3 -left-2 text-[10px] px-1.5 py-0 ${
                            idx % 2 === 0
                              ? "bg-destructive text-white"
                              : "bg-orange-500 text-white"
                          }`}
                        >
                          {anom.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="col-span-1 space-y-4">
                <div
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border shadow-inner",
                    selectedDetection.status === "OK"
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-300"
                      : "bg-destructive/10 text-destructive border-destructive/20",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6" />
                    <div>
                      <p className="font-bold text-sm">Status Pemeriksaan</p>
                      <p className="text-lg font-black">
                        {selectedDetection.status === "OK"
                          ? "OKAY"
                          : "NOT OKAY"}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedDetection.validationStatus === "Pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-destructive border-destructive/30"
                      onClick={() => {
                        setIsDetailOpen(false);
                        openValidationDialog(
                          selectedDetection.id,
                          selectedDetection.partId,
                          "Scrapped",
                        );
                      }}
                    >
                      <X className="w-3 h-3 mr-1" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        setIsDetailOpen(false);
                        openValidationDialog(
                          selectedDetection.id,
                          selectedDetection.partId,
                          "Resolved",
                        );
                      }}
                    >
                      <Check className="w-3 h-3 mr-1" /> Validate
                    </Button>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-sm font-bold border-b pb-2 text-foreground/80">
                    Identified Issues
                  </h4>
                  {selectedDetection.anomalies.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4 italic">
                      No anomalies detected.
                    </p>
                  ) : (
                    selectedDetection.anomalies.map((anom) => (
                      <div
                        key={anom.id}
                        className="flex flex-col gap-2 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-all shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
                            <span className="font-bold text-sm">
                              {anom.type}
                            </span>
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-xs bg-muted/80"
                          >
                            {anom.confidence}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            Loc:
                          </span>{" "}
                          {anom.location}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 bg-muted/30 p-2 rounded-md border border-muted-foreground/10">
                          {anom.desc}
                        </p>
                      </div>
                    ))
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
