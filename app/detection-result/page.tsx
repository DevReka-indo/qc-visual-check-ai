"use client"

import React, { useState } from "react"
import { AlertTriangle, CheckCircle, Clock, Info, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const mockDetections = [
    {
        id: "BG-2026-0001",
        date: "25 July 2026",
        status: "NOK",
        mainDefect: "Cat mengelupas",
        imageAlias: "Bogie 1 Visualization Area",
        anomalies: [
            { id: 1, type: "Cat mengelupas", confidence: 92.4, location: "Bottom Left Frame", desc: "Significant paint peeling indicating exposure." },
        ]
    },
    {
        id: "BG-2026-0002",
        date: "26 July 2026",
        status: "NOK",
        mainDefect: "Cat mengelupas",
        imageAlias: "Bogie 2 Visualization Area",
        anomalies: [
            { id: 2, type: "Cat mengelupas", confidence: 85.1, location: "Center Support", desc: "Mild peeling near the suspension base." },
            { id: 3, type: "Baret", confidence: 70.0, location: "Side Panel", desc: "Surface scratches." },
        ]
    },
    {
        id: "BG-2026-0003",
        date: "27 July 2026",
        status: "NOK",
        mainDefect: "Baret Dalam",
        imageAlias: "Bogie 3 Visualization Area",
        anomalies: [
            { id: 4, type: "Baret Dalam", confidence: 96.5, location: "Right Upper Edge", desc: "Deep structural scratch." },
        ]
    },
    {
        id: "BG-2026-0004",
        date: "28 July 2026",
        status: "NOK",
        mainDefect: "Cat Dlewer",
        imageAlias: "Bogie 4 Visualization Area",
        anomalies: [
            { id: 5, type: "Cat Dlewer", confidence: 88.9, location: "Primary Joint", desc: "Paint dripping affecting joint mobility check." },
        ]
    }
]

export default function DetectionResultPage() {
    const [selectedDetectionId, setSelectedDetectionId] = useState(mockDetections[0].id)
    const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date("2026-07-25"))
    const [dateTo, setDateTo] = useState<Date | undefined>(new Date("2026-07-29"))

    const selectedDetection = mockDetections.find(d => d.id === selectedDetectionId) || mockDetections[0]

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-serif">Detection Result</h1>
                    <p className="text-muted-foreground mt-2">
                        In-depth analysis of recently detected structural anomalies.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm py-1.5 px-3">
                        <Clock className="w-4 h-4 mr-2" />
                        Last Detection: {selectedDetection.date}
                    </Badge>
                    <Button>Export Report</Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main image area */}
                <Card className="col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle>Analyzed Image</CardTitle>
                        <CardDescription>Visual mapping of detected issues</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full aspect-video bg-primary/50 rounded-md border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden">
                            {/* Using placeholder representation since we don't have a real annotated bogie image */}
                            <div className="absolute inset-0 bg-secondary flex items-center justify-center">
                                <p className="text-muted-foreground text-sm font-medium">{selectedDetection.imageAlias}</p>
                            </div>

                            {/* Mock bounding boxes dynamically based on selection */}
                            {selectedDetection.anomalies.map((anom, idx) => (
                                <div key={anom.id}
                                    className={`absolute w-24 h-16 border-2 rounded ${idx % 2 === 0 ? "top-[20%] left-[15%] border-destructive bg-destructive/10" : "top-[50%] right-[30%] border-orange-500 bg-orange-500/10"}`}>
                                    <Badge className={`absolute -top-3 -left-2 text-[10px] px-1 py-0 ${idx % 2 === 0 ? "bg-destructive text-white" : "bg-orange-500 text-white"}`}>{anom.type}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Details area */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Anomaly Breakdown</CardTitle>
                        <CardDescription>{selectedDetection.anomalies.length} defect(s) found</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-3 rounded-md border bg-destructive/5 text-destructive border-destructive/20">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                <span className="font-semibold">Status: {selectedDetection.status === "NOK" ? "NOT OKAY" : "OKAY"}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-medium border-b pb-2">Identified Issues</h4>

                            {selectedDetection.anomalies.map((anom) => (
                                <div key={anom.id} className="group relative flex flex-col gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-destructive"></div>
                                            <span className="font-semibold text-sm">{anom.type}</span>
                                        </div>
                                        <Badge variant="secondary" className="text-xs">{anom.confidence}%</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Loc:</span> {anom.location}</p>
                                    <p className="text-xs text-muted-foreground">{anom.desc}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Gallery/List section matching the requested screenshot */}
            <div>
                {/* Date Filter & Pagination Header */}
                <div className="flex items-center justify-between mb-6 bg-card p-3 rounded-xl border shadow-sm">
                    <div className="flex items-center gap-4 text-sm font-medium">

                        {/* Start Date Picker */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "justify-start text-left font-medium bg-muted/50 border",
                                        !dateFrom && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                    {dateFrom ? format(dateFrom, "dd MMMM yyyy") : <span>Pick a date</span>}
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

                        <span className="text-muted-foreground font-semibold">To</span>

                        {/* End Date Picker */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "justify-start text-left font-medium bg-muted/50 border",
                                        !dateTo && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                    {dateTo ? format(dateTo, "dd MMMM yyyy") : <span>Pick a date</span>}
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

                    <div className="flex items-center gap-4 text-sm font-medium">
                        <Button variant="ghost" size="icon" className="h-6 w-6"><ChevronLeft className="w-4 h-4" /></Button>
                        <span className="text-muted-foreground">1</span>
                        <span className="text-primary font-bold">2</span>
                        <span className="text-muted-foreground">3</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6"><ChevronRight className="w-4 h-4" /></Button>
                    </div>
                </div>

                {/* Grid of Results */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {mockDetections.map((detection) => (
                        <Card
                            key={detection.id}
                            className={`cursor-pointer transition-all overflow-hidden ${selectedDetectionId === detection.id ? 'ring-2 ring-primary/50' : 'hover:border-primary/50'}`}
                            onClick={() => setSelectedDetectionId(detection.id)}
                        >
                            <div className="aspect-[4/3] bg-secondary w-full relative">
                                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">
                                    [ {detection.imageAlias} ]
                                </div>
                            </div>
                            <div className="p-4 flex items-center gap-3 border-t">
                                <span className={detection.status === "NOK" ? "text-primary font-bold" : "text-emerald-600 font-bold"}>
                                    {detection.status}
                                </span>
                                <div className="h-4 w-px bg-border"></div>
                                <span className="text-sm font-medium truncate">{detection.mainDefect}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
