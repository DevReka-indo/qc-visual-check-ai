"use client"

import React, { useState, useEffect } from "react"
import {
    TrendingUp,
    TrendingDown,
    Calendar as CalendarIcon,
    Filter,
    Download,
    BarChart3,
    PieChart as PieChartIcon,
    Activity,
    ArrowUpRight,
    Clock,
    FileCheck,
    AlertTriangle,
    MonitorCheck,
    FileSearch
} from "lucide-react"
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
    LineChart,
    Line,
    AreaChart,
    Area
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { getDashboardStats, getDefectDistribution, getInspections } from "@/app/actions/database"

const COLORS = ["#ef4444", "#f97316", "#eab308"]

export default function StatisticsPage() {
    const [stats, setStats] = useState<{ total_inspections: number, accuracy_percentage: number, active_hours: number, pending_tasks: number } | null>(null)
    const [distribution, setDistribution] = useState<{ name: string, value: number }[]>([])
    const [recentDetections, setRecentDetections] = useState<any[]>([]) // Assuming 'any' for now, define a proper type later
    const [loading, setLoading] = useState(true)

    // Placeholder for monthlyData until actual data fetching is implemented for it
    const monthlyData = [
        { name: "Jan", okay: 120, not_okay: 14 },
        { name: "Feb", okay: 132, not_okay: 18 },
        { name: "Mar", okay: 101, not_okay: 9 },
        { name: "Apr", okay: 145, not_okay: 22 },
        { name: "May", okay: 156, not_okay: 11 },
        { name: "Jun", okay: 168, not_okay: 15 },
    ]

    useEffect(() => {
        async function loadStats() {
            setLoading(true)
            const [statsData, distData, recentData] = await Promise.all([
                getDashboardStats(),
                getDefectDistribution(),
                getInspections(5) // Fetching 5 recent inspections
            ])

            if (statsData) setStats(statsData)
            setDistribution(distData || [])
            setRecentDetections(recentData || [])
            setLoading(false)
        }
        loadStats()
    }, [])

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-serif">Statistic</h1>
                <p className="text-muted-foreground mt-2">
                    Key performance metrics and historical data analysis of train bogies.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Inspeksi</CardTitle>
                        <div className="p-2 bg-blue-500/10 rounded-full">
                            <FileCheck className="h-4 w-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-16" /> : (
                            <div className="text-2xl font-bold">{stats?.total_inspections || 0}</div>
                        )}
                        <p className="text-xs text-muted-foreground">Unit Terverifikasi</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Akurasi Sistem</CardTitle>
                        <div className="p-2 bg-green-500/10 rounded-full">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-16" /> : (
                            <div className="text-2xl font-bold">{stats?.accuracy_percentage || 0}%</div>
                        )}
                        <p className="text-xs text-green-500 font-medium">+1.2% dari target</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Waktu Proses</CardTitle>
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
                        <CardTitle className="text-sm font-medium text-muted-foreground">Anomali Pending</CardTitle>
                        <div className="p-2 bg-red-500/10 rounded-full">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-16" /> : (
                            <div className="text-2xl font-bold">{stats?.pending_tasks || 0}</div>
                        )}
                        <p className="text-xs text-red-500 font-medium">Membutuhkan Validasi</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Bar Chart */}
                <Card className="col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle>Historical Detections</CardTitle>
                        <CardDescription>Monthly comparison of Okay vs Not Okay bogies</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                                    <XAxis dataKey="name" className="text-xs text-muted-foreground" tickLine={false} axisLine={false} />
                                    <YAxis className="text-xs text-muted-foreground" tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--background)" }}
                                        cursor={{ fill: "var(--muted)" }}
                                    />
                                    <Legend iconType="circle" />
                                    <Bar dataKey="okay" name="Okay" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey="not_okay" name="Not Okay" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Pie Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Defect Distribution</CardTitle>
                        <CardDescription>Breakdown by anomaly type</CardDescription>
                    </CardHeader>
                    <CardContent>
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
                                        {distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
