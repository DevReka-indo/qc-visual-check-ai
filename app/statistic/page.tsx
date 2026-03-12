"use client";

import React, { useEffect } from "react";
import { TrendingUp, Clock, FileCheck, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useStatsStore } from "@/store/use-stats-store";

const COLORS = [
  "#10b981", // Okay (Green)
  "#f97316", // Cat mengelupas (Orange)
  "#fbbf24", // Cat meleber (Amber)
  "#8b5cf6", // Besi lengkung (Purple)
  "#ec4899", // Baret (Pink)
];

const DEFECT_COLORS: Record<string, string> = {
  "Okay": COLORS[0],
  "Cat Mengelupas": COLORS[1],
  "Cat Meleber": COLORS[2],
  "Besi Lengkung": COLORS[3],
  "Baret": COLORS[4],
  "okay": COLORS[0],
  "cat_mengelupas": COLORS[1],
  "cat_meleber": COLORS[2],
  "besi_lengkung": COLORS[3],
  "baret": COLORS[4],
};

const DEFECT_LABELS: Record<string, string> = {
  okay: "Okay",
  cat_mengelupas: "Cat Mengelupas",
  cat_meleber: "Cat Meleber",
  besi_lengkung: "Besi Lengkung",
  baret: "Baret",
};

export default function StatisticsPage() {
  // ── Store ──────────────────────────────────────────────────────
  const { stats, distribution, monthlyChartData, isLoading, fetchAll } =
    useStatsStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 md:gap-6 w-full max-w-[1600px] mx-auto pb-10 animate-in fade-in duration-500">
      {/* ── Page Header ───────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-serif">
          Statistic
        </h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
          Key performance metrics and historical data analysis of train bogies.
        </p>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────── */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
        {/* Total Inspeksi */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Total Inspeksi
            </CardTitle>
            <div className="p-1.5 md:p-2 bg-blue-500/10 rounded-full shrink-0">
              <FileCheck className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6">
            {isLoading ? (
              <Skeleton className="h-7 md:h-8 w-14 md:w-16" />
            ) : (
              <div className="text-xl md:text-2xl font-bold">
                {stats?.total_inspections ?? 0}
              </div>
            )}
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
              Unit Terverifikasi
            </p>
          </CardContent>
        </Card>

        {/* Akurasi Sistem */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Akurasi Sistem
            </CardTitle>
            <div className="p-1.5 md:p-2 bg-green-500/10 rounded-full shrink-0">
              <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6">
            {isLoading ? (
              <Skeleton className="h-7 md:h-8 w-14 md:w-16" />
            ) : (
              <div className="text-xl md:text-2xl font-bold">
                {stats?.accuracy_percentage ?? 0}%
              </div>
            )}
            <p className="text-[10px] md:text-xs text-green-500 font-medium mt-1">
              Berdasarkan data bulan ini
            </p>
          </CardContent>
        </Card>

        {/* Waktu Proses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Waktu Proses
            </CardTitle>
            <div className="p-1.5 md:p-2 bg-orange-500/10 rounded-full shrink-0">
              <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6">
            <div className="text-xl md:text-2xl font-bold">1.2s</div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
              Per Frame (Average)
            </p>
          </CardContent>
        </Card>

        {/* Anomali Pending */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Anomali Pending
            </CardTitle>
            <div className="p-1.5 md:p-2 bg-red-500/10 rounded-full shrink-0">
              <AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6">
            {isLoading ? (
              <Skeleton className="h-7 md:h-8 w-14 md:w-16" />
            ) : (
              <div className="text-xl md:text-2xl font-bold">
                {stats?.pending_tasks ?? 0}
              </div>
            )}
            <p className="text-[10px] md:text-xs text-red-500 font-medium mt-1">
              Membutuhkan Validasi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row ────────────────────────────────────────── */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
        {/* Bar Chart – Monthly Breakdown */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="px-4 pt-4 pb-2 md:px-6">
            <CardTitle className="text-base md:text-lg">
              Historical Detections
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Monthly breakdown of Okay vs Defects (last 6 months)
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4 md:px-4 md:pb-6">
            {isLoading ? (
              <Skeleton className="h-[280px] md:h-[350px] w-full" />
            ) : monthlyChartData.length === 0 ? (
              <div className="h-[280px] md:h-[350px] flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <FileCheck className="w-10 h-10 opacity-30" />
                <p className="text-sm font-medium">Belum ada data deteksi.</p>
              </div>
            ) : (
              <div className="h-[280px] md:h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyChartData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      className="text-xs text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      className="text-xs text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      tick={{ fontSize: 11 }}
                      width={28}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--background)",
                        fontSize: "12px",
                      }}
                      cursor={{ fill: "var(--muted)" }}
                      formatter={(value, name) => [value, DEFECT_LABELS[name as string] || name]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "11px" }}
                      formatter={(value) => DEFECT_LABELS[value as string] || value}
                    />
                    <Bar
                      dataKey="okay"
                      stackId="a"
                      fill={DEFECT_COLORS.okay}
                      radius={[0, 0, 0, 0]}
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

        {/* Pie Chart – Defect Distribution */}
        <Card className="col-span-1">
          <CardHeader className="px-4 pt-4 pb-2 md:px-6">
            <CardTitle className="text-base md:text-lg">
              Defect Distribution
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Breakdown by anomaly type
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4 md:px-4 md:pb-6">
            {isLoading ? (
              <Skeleton className="h-[260px] md:h-[300px] w-full" />
            ) : distribution.length === 0 ? (
              <div className="h-[260px] md:h-[300px] flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <AlertTriangle className="w-10 h-10 opacity-30" />
                <p className="text-sm font-medium text-center">
                  Belum ada data defect.
                </p>
              </div>
            ) : (
              <div className="h-[260px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribution}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {distribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={DEFECT_COLORS[entry.name] || COLORS[(index + 1) % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--background)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "11px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Monthly Summary Table ──────────────────────────────── */}
      <Card>
        <CardHeader className="px-4 pt-4 pb-2 md:px-6">
          <CardTitle className="text-base md:text-lg">
            Ringkasan Bulanan
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Detail inspeksi per bulan selama 6 bulan terakhir
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : monthlyChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground border rounded-md bg-muted/20">
              <FileCheck className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">
                Belum ada data untuk ditampilkan.
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden overflow-x-auto">
              <table className="w-full text-xs md:text-sm min-w-[400px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 md:px-4 py-2.5 md:py-3 font-medium text-muted-foreground">
                      Bulan
                    </th>
                    <th className="text-right px-3 md:px-4 py-2.5 md:py-3 font-medium text-muted-foreground">
                      Okay
                    </th>
                    <th className="text-right px-3 md:px-4 py-2.5 md:py-3 font-medium text-muted-foreground">
                      Not Okay
                    </th>
                    <th className="text-right px-3 md:px-4 py-2.5 md:py-3 font-medium text-muted-foreground">
                      Total
                    </th>
                    <th className="text-right px-3 md:px-4 py-2.5 md:py-3 font-medium text-muted-foreground">
                      Pass Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {monthlyChartData.map((row, i) => {
                    const total = row.okay + row.not_okay;
                    const passRate =
                      total > 0 ? ((row.okay / total) * 100).toFixed(1) : "–";
                    const isGood = total > 0 && Number(passRate) >= 80;
                    return (
                      <tr
                        key={i}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-3 md:px-4 py-2.5 md:py-3 font-medium">
                          {row.name}
                        </td>
                        <td className="px-3 md:px-4 py-2.5 md:py-3 text-right text-emerald-600 font-semibold">
                          {row.okay}
                        </td>
                        <td className="px-3 md:px-4 py-2.5 md:py-3 text-right text-destructive font-semibold">
                          {row.not_okay}
                        </td>
                        <td className="px-3 md:px-4 py-2.5 md:py-3 text-right">
                          {total}
                        </td>
                        <td className="px-3 md:px-4 py-2.5 md:py-3 text-right">
                          <span
                            className={`font-semibold ${
                              total === 0
                                ? "text-muted-foreground"
                                : isGood
                                  ? "text-emerald-600"
                                  : "text-destructive"
                            }`}
                          >
                            {passRate}
                            {total > 0 ? "%" : ""}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
