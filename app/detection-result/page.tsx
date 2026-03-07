"use client"

import React, { useState } from "react"
import { AlertTriangle, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, FileText, Check, X, ArrowRight } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// --- MOCK DATA ---
const chartData = [
    { month: "January", mechanic: 5, electric: 12, incoming: 18 },
    { month: "February", mechanic: 12, electric: 4, incoming: 30 },
    { month: "March", mechanic: 38, electric: 20, incoming: 25 },
    { month: "April", mechanic: 30, electric: 15, incoming: 40 },
    { month: "May", mechanic: 32, electric: 50, incoming: 42 },
]

const divisions = [
    { 
        id: "mechanic", 
        name: "Final Mechanic", 
        desc: "Inspeksi struktur dan komponen mekanis utama.", 
        color: "#94a3b8",
        // Menambahkan array gambar thumbnail
        images: [
            "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=100&q=80",
            "https://images.unsplash.com/photo-1533827432537-70133748f5c8?auto=format&fit=crop&w=100&q=80",
            "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=100&q=80"
        ]
    },
    { 
        id: "electric", 
        name: "Final Electric", 
        desc: "Pengecekan jalur kabel dan konektor daya.", 
        color: "#ef4444",
        images: [
            "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=100&q=80",
            "https://images.unsplash.com/photo-1580983546522-6b92a2a07409?auto=format&fit=crop&w=100&q=80",
            "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=100&q=80"
        ]
    },
    { 
        id: "incoming", 
        name: "Incoming", 
        desc: "Pengecekan part baru sebelum dirakit.", 
        color: "#1d4ed8",
        images: [
            "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=100&q=80",
            "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=100&q=80",
            "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=100&q=80"
        ]
    },
]

const detectedImages = [
    { id: "BG-2026-0001", date: "25 July 2026", status: "NOK", mainDefect: "Cat mengelupas", imageUrl: "/images/cat-ngelupas-1.jpg", anomalies: [{ id: 1, type: "Cat mengelupas", confidence: 92.4, location: "Bottom Left Frame", desc: "Significant paint peeling indicating exposure." }] },
    { id: "BG-2026-0002", date: "26 July 2026", status: "NOK", mainDefect: "Cat mengelupas", imageUrl: "/images/cat-ngelupas-2.jpg", anomalies: [{ id: 2, type: "Cat mengelupas", confidence: 85.1, location: "Center Support", desc: "Mild peeling near the suspension base." }] },
    { id: "BG-2026-0003", date: "27 July 2026", status: "NOK", mainDefect: "Baret Dalam", imageUrl: "/images/baret-dalam.jpg", anomalies: [{ id: 3, type: "Baret Dalam", confidence: 96.5, location: "Right Upper Edge", desc: "Deep structural scratch." }] },
    { id: "BG-2026-0004", date: "28 July 2026", status: "NOK", mainDefect: "Cat Dlewer", imageUrl: "/images/cat-dlewer.png", anomalies: [{ id: 4, type: "Cat Dlewer", confidence: 88.9, location: "Primary Joint", desc: "Paint dripping affecting joint mobility check." }] },
]

const pendingTasks = [
    { id: "TASK-091", partId: "BG-2026-0088", division: "Final Mechanic", issue: "Indikasi Cat Mengelupas Sedikit", confidence: 72.5, time: "2 hours ago" },
    { id: "TASK-092", partId: "PART-INC-02", division: "Incoming", issue: "Indikasi Baret Cukup Lebar", confidence: 64.0, time: "5 hours ago" },
    { id: "TASK-093", partId: "EL-2026-041", division: "Final Electric", issue: "Indikasi Cat Kurang Sempurna/Ndlewer", confidence: 81.2, time: "1 day ago" },
]

const completedLogs = [
    { id: "LOG-1042", date: "24 July 2026", partId: "BG-2026-0012", division: "Final Mechanic", issue: "Baret Halus", resolution: "Toleransi Diterima (False Alarm)", inspector: "Salung D.", status: "Resolved" },
    { id: "LOG-1041", date: "23 July 2026", partId: "EL-2026-039", division: "Final Electric", issue: "Kabel Terkelupas", resolution: "Diganti Baru & Rework Selesai", inspector: "M. Fadhil", status: "Reworked" },
    { id: "LOG-1040", date: "22 July 2026", partId: "INC-9921", division: "Incoming", issue: "Karat Ekstrem", resolution: "Dikembalikan ke Supplier (Scrap)", inspector: "Wildan S.", status: "Scrapped" },
]

export default function DetectionResultPage() {
    const [activeTab, setActiveTab] = useState("Detected")
    const [selectedDivision, setSelectedDivision] = useState("electric")
    const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date("2026-07-25"))
    const [dateTo, setDateTo] = useState<Date | undefined>(new Date("2026-07-29"))
    
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [selectedDetectionId, setSelectedDetectionId] = useState<string | null>(null)

    const selectedDetection = detectedImages.find(d => d.id === selectedDetectionId) || detectedImages[0]

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-10 animate-in fade-in duration-500">
            
            {/* TABS NAVIGATION */}
            <div className="flex items-center gap-2 mb-2">
                {["Detected", "Pending", "Completed"].map((tab) => (
                    <Button 
                        key={tab}
                        variant={activeTab === tab ? "default" : "outline"}
                        className={cn(
                            "rounded-full px-6 transition-all", 
                            activeTab === tab ? "bg-[#1e1b4b] hover:bg-[#2e2a70] text-white" : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </Button>
                ))}
            </div>

            {/* TOP SECTION: CHART & DIVISIONS */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 shadow-sm border-sidebar-border/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#94a3b8]"></div><span className="text-sm font-medium">Final Mechanic</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#ef4444]"></div><span className="text-sm font-medium">Final Electric</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#1d4ed8]"></div><span className="text-sm font-medium">Incoming</span></div>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Line type="monotone" dataKey="mechanic" stroke="#94a3b8" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="electric" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="incoming" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-3">
                    {divisions.map((div) => (
                        <div 
                            key={div.id} 
                            onClick={() => setSelectedDivision(div.id)} 
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 border", 
                                selectedDivision === div.id ? "bg-[#1e1b4b] text-white border-transparent shadow-md scale-[1.02]" : "bg-card text-foreground border-sidebar-border hover:border-[#1e1b4b]/50"
                            )}
                        >
                            {/* --- INI BAGIAN GAMBAR LINGKARAN YANG SUDAH KITA UBAH --- */}
                            <div className="flex -space-x-3">
                                {div.images?.map((imgUrl, idx) => (
                                    <div key={idx} className="w-10 h-10 rounded-full border-2 border-background overflow-hidden shadow-sm bg-slate-200 group-hover:border-primary/20 transition-colors">
                                        <img src={imgUrl} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            {/* -------------------------------------------------------- */}

                            <div className="flex-1">
                                <h4 className={cn("font-bold", selectedDivision === div.id ? "text-white" : "text-foreground")}>{div.name}</h4>
                                <p className={cn("text-xs leading-snug mt-1", selectedDivision === div.id ? "text-slate-300" : "text-muted-foreground")}>{div.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MIDDLE TOOLBAR */}
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 bg-card p-1.5 rounded-full border shadow-sm">
                    <Popover>
                        <PopoverTrigger asChild><Button variant="ghost" className="rounded-full px-4 font-medium text-sm"><CalendarIcon className="mr-2 h-4 w-4" />{dateFrom ? format(dateFrom, "dd MMMM yyyy") : <span>Pick a date</span>}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus /></PopoverContent>
                    </Popover>
                    <span className="text-muted-foreground font-bold px-2">To</span>
                    <Popover>
                        <PopoverTrigger asChild><Button variant="ghost" className="rounded-full px-4 font-medium text-sm"><CalendarIcon className="mr-2 h-4 w-4" />{dateTo ? format(dateTo, "dd MMMM yyyy") : <span>Pick a date</span>}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus /></PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* ========================================= */}
            {/* DYNAMIC CONTENT BERDASARKAN TAB YANG AKTIF */}
            {/* ========================================= */}
            
            {/* 1. VIEW UNTUK TAB DETECTED (GALERI) */}
            {activeTab === "Detected" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    {detectedImages.map((detection) => (
                        <Card key={detection.id} className="cursor-pointer overflow-hidden group hover:shadow-md transition-all border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-2xl" onClick={() => { setSelectedDetectionId(detection.id); setIsDetailOpen(true); }}>
                            <div className="w-full aspect-[4/3] relative overflow-hidden bg-slate-100">
                                <img src={detection.imageUrl} alt={detection.mainDefect} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="p-4 flex items-center bg-white dark:bg-card gap-3">
                                <span className="text-destructive font-black text-sm uppercase tracking-wide">{detection.status}</span>
                                <div className="h-4 w-[2px] bg-slate-200"></div>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{detection.mainDefect}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* 2. VIEW UNTUK TAB PENDING (ANTREAN VERIFIKASI MANUSIA) */}
            {activeTab === "Pending" && (
                <Card className="border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <CardHeader className="bg-amber-500/10 border-b border-amber-500/20 pb-4">
                        <CardTitle className="flex items-center gap-2 text-amber-600"><Clock className="w-5 h-5" /> Menunggu Verifikasi Manual</CardTitle>
                        <CardDescription>AI tidak memiliki tingkat kepercayaan yang tinggi. Dibutuhkan konfirmasi manusia.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {pendingTasks.map((task) => (
                                <div key={task.id} className="flex flex-col sm:flex-row items-center justify-between p-6 hover:bg-muted/30 transition-colors gap-4">
                                    <div className="flex items-start gap-4 w-full">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold shrink-0">?</div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-base">{task.partId}</h4>
                                                <Badge variant="outline" className="text-xs bg-background">{task.division}</Badge>
                                                <span className="text-xs text-muted-foreground ml-2">{task.time}</span>
                                            </div>
                                            <p className="text-sm text-foreground mb-2"><span className="font-semibold text-muted-foreground">Indikasi AI:</span> {task.issue}</p>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden"><div className="h-full bg-amber-400" style={{ width: `${task.confidence}%` }}></div></div>
                                                <span className="text-xs text-muted-foreground">Confidence: {task.confidence}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                                        <Button variant="outline" className="w-full sm:w-auto text-destructive border-destructive/30 hover:bg-destructive/10"><X className="w-4 h-4 mr-2"/> Reject</Button>
                                        <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"><Check className="w-4 h-4 mr-2"/> Validate</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 3. VIEW UNTUK TAB COMPLETED (LOG RIWAYAT) */}
            {activeTab === "Completed" && (
                <Card className="border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <CardHeader className="bg-emerald-500/10 border-b border-emerald-500/20 pb-4">
                        <CardTitle className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="w-5 h-5" /> Riwayat Inspeksi & Rework</CardTitle>
                        <CardDescription>Daftar komponen yang telah selesai ditindaklanjuti.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {completedLogs.map((log) => (
                                <div key={log.id} className="p-6 hover:bg-muted/30 transition-colors">
                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-muted-foreground" />
                                            <h4 className="font-bold text-foreground">{log.partId}</h4>
                                            <Badge variant="secondary" className="bg-muted text-muted-foreground">{log.date}</Badge>
                                        </div>
                                        <Badge className={cn("px-3 py-1", log.status === "Resolved" ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : log.status === "Scrapped" ? "bg-destructive/20 text-destructive hover:bg-destructive/30" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200")}>
                                            {log.status}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-2 pl-8 border-l-2 border-muted ml-2">
                                        <div><p className="text-muted-foreground text-xs mb-1">Masalah Awal</p><p className="font-medium">{log.issue}</p></div>
                                        <div><p className="text-muted-foreground text-xs mb-1">Tindakan Penyelesaian</p><p className="font-medium text-emerald-600 flex items-center gap-1"><ArrowRight className="w-3 h-3"/> {log.resolution}</p></div>
                                        <div><p className="text-muted-foreground text-xs mb-1">Inspektur Final</p><p className="font-medium">{log.inspector}</p></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* POPUP MODAL (TETAP ADA UNTUK TAB DETECTED) */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-5xl bg-background/95 backdrop-blur-md border-sidebar-border shadow-2xl">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-2xl font-serif">In-depth Analysis: {selectedDetection.id}</DialogTitle>
                        <DialogDescription>Visual mapping of detected issues on {selectedDetection.date}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="col-span-1 md:col-span-2 border-none shadow-none bg-muted/20">
                            <CardContent className="p-0">
                                <div className="w-full aspect-video bg-slate-200 rounded-xl overflow-hidden relative group">
                                    <img src={selectedDetection.imageUrl} alt="bogie" className="w-full h-full object-cover opacity-80" />
                                    {selectedDetection.anomalies.map((anom, idx) => (
                                        <div key={anom.id} className={`absolute border-2 rounded-md shadow-[0_0_15px_rgba(0,0,0,0.3)] animate-in zoom-in-50 duration-500 ${idx % 2 === 0 ? "border-destructive bg-destructive/10 top-[20%] left-[15%] w-32 h-24" : "border-orange-500 bg-orange-500/10 top-[50%] right-[30%] w-24 h-16"}`}>
                                            <Badge className={`absolute -top-3 -left-2 text-[10px] px-1.5 py-0 ${idx % 2 === 0 ? "bg-destructive text-white" : "bg-orange-500 text-white"}`}>{anom.type}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <div className="col-span-1 space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-xl border shadow-inner bg-destructive/10 text-destructive border-destructive/20">
                                <div className="flex items-center gap-3"><AlertTriangle className="w-6 h-6" /><div><p className="font-bold text-sm">Status Pemeriksaan</p><p className="text-lg font-black">NOT OKAY</p></div></div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold border-b pb-2 text-foreground/80">Identified Issues</h4>
                                {selectedDetection.anomalies.map((anom) => (
                                    <div key={anom.id} className="group relative flex flex-col gap-2 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-all shadow-sm">
                                        <div className="flex items-start justify-between"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse"></div><span className="font-bold text-sm">{anom.type}</span></div><Badge variant="secondary" className="text-xs bg-muted/80">{anom.confidence}%</Badge></div>
                                        <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Loc:</span> {anom.location}</p>
                                        <p className="text-xs text-muted-foreground mt-1 bg-muted/30 p-2 rounded-md border border-muted-foreground/10">{anom.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}