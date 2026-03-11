"use client";

import React, { useState, useEffect } from "react";
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
import {
  getDashboardStats,
  getDefectDistribution,
  getMonthlyStats,
} from "@/app/actions/database";
import type { MonthlyStatRow } from "@/app/actions/database";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#3b82f6", "#8b5cf6"];

export default function StatisticsPage() {
  const [stats, setStats] = useState<{
    total_inspections: number;
    accuracy_percentage: number;
    active_hours: number;
    pending_tasks: number;
  } | null>(null);
  const [distribution, setDistribution] = useState<
    { name: string; value: number }[]
  >([]);
  const [monthlyData, setMonthlyData] = useState<
    { name: string; okay: number; not_okay: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      const [statsData, distData, monthlyRaw] = await Promise.all([
        getDashboardStats(),
        getDefectDistribution(),
        getMonthlyStats(6),
      ]);

      if (statsData) setStats(statsData);
      setDistribution(distData || []);

      // Map RPC rows → chart-friendly format
      const mapped = (monthlyRaw as MonthlyStatRow[]).map((row) => ({
        name: row.month_label,
        okay: Number(row.okay_count),
        not_okay: Number(row.not_okay_count),
      }));

      // If no data yet, show last 6 months as empty placeholders so the
      // chart still renders a meaningful axis instead of being blank.
      if (mapped.length === 0) {
        const now = new Date();
        const placeholder = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          return {
            name: d.toLocaleString("en-US", { month: "short" }),
            okay: 0,
            not_okay: 0,
          };
        });
        setMonthlyData(placeholder);
      } else {
        setMonthlyData(mapped);
      }

      setLoading(false);
    }
    loadStats();
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-serif">
          Statistic
        </h1>
        <p className="text-muted-foreground mt-2">
          Key performance metrics and historical data analysis of train bogies.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Inspeksi
            </CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <FileCheck className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.total_inspections ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Unit Terverifikasi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Akurasi Sistem
            </CardTitle>
            <div className="p-2 bg-green-500/10 rounded-full">
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.accuracy_percentage ?? 0}%
              </div>
            )}
            <p className="text-xs text-green-500 font-medium">
              Berdasarkan data bulan ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Waktu Proses
            </CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-full">
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2s</div>
            <p className="text-xs text-muted-foreground">Per Frame (Average)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Anomali Pending
            </CardTitle>
            <div className="p-2 bg-red-500/10 rounded-full">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.pending_tasks ?? 0}
              </div>
            )}
            <p className="text-xs text-red-500 font-medium">
              Membutuhkan Validasi
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Bar Chart – Monthly Okay vs Not Okay */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Historical Detections</CardTitle>
            <CardDescription>
              Monthly comparison of Okay vs Not Okay bogies (last 6 months)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
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
                    />
                    <YAxis
                      className="text-xs text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--background)",
                      }}
                      cursor={{ fill: "var(--muted)" }}
                    />
                    <Legend iconType="circle" />
                    <Bar
                      dataKey="okay"
                      name="Okay"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="not_okay"
                      name="Not Okay"
                      fill="#ef4444"
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
          <CardHeader>
            <CardTitle>Defect Distribution</CardTitle>
            <CardDescription>Breakdown by anomaly type</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : distribution.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                Belum ada data defect.
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {distribution.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Bulanan</CardTitle>
          <CardDescription>
            Detail inspeksi per bulan selama 6 bulan terakhir
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Bulan
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      Okay
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      Not Okay
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      Total
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                      Pass Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {monthlyData.map((row, i) => {
                    const total = row.okay + row.not_okay;
                    const passRate =
                      total > 0 ? ((row.okay / total) * 100).toFixed(1) : "–";
                    return (
                      <tr
                        key={i}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">{row.name}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                          {row.okay}
                        </td>
                        <td className="px-4 py-3 text-right text-destructive font-semibold">
                          {row.not_okay}
                        </td>
                        <td className="px-4 py-3 text-right">{total}</td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`font-medium ${total > 0 && Number(passRate) >= 80 ? "text-emerald-600" : "text-destructive"}`}
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
