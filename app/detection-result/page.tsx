"use client"

import React from "react"
import { AlertTriangle, CheckCircle, Clock, Info } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const anomalies = [
    { id: 1, type: "Baret", confidence: 92.4, location: "Bottom Left Frame", desc: "Linear scratch indicating possible collision or drag." },
    { id: 2, type: "Lengkung", confidence: 88.1, location: "Center Support", desc: "Slight bending detected beyond safety tolerance." },
    { id: 3, type: "Cat Meleber", confidence: 76.5, location: "Right Upper Edge", desc: "Excess paint or chemical spill." },
]

export default function DetectionResultPage() {
    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Detection Result Detail</h1>
                    <p className="text-muted-foreground mt-2">
                        In-depth analysis of recently detected structural anomalies.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm py-1.5 px-3">
                        <Clock className="w-4 h-4 mr-2" />
                        Last Detection: 10 mins ago
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
                        <div className="w-full aspect-video bg-muted rounded-md border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden">
                            {/* Using placeholder representation since we don't have a real annotated bogie image */}
                            <div className="absolute inset-0 bg-secondary/20 flex items-center justify-center">
                                <p className="text-muted-foreground text-sm font-medium">Bogie Image Visualization Area</p>
                            </div>

                            {/* Mock bounding boxes */}
                            <div className="absolute top-[20%] left-[15%] w-24 h-16 border-2 border-destructive bg-destructive/10 rounded">
                                <Badge className="absolute -top-3 -left-2 bg-destructive text-[10px] px-1 py-0">Baret</Badge>
                            </div>
                            <div className="absolute top-[50%] right-[30%] w-32 h-20 border-2 border-orange-500 bg-orange-500/10 rounded">
                                <Badge className="absolute -top-3 -left-2 bg-orange-500 text-[10px] px-1 py-0">Lengkung</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Details area */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Anomaly Breakdown</CardTitle>
                        <CardDescription>3 defects found in current scan</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-3 rounded-md border bg-destructive/5 text-destructive border-destructive/20">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                <span className="font-semibold">Status: NOT OKAY</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-medium border-b pb-2">Identified Issues</h4>

                            {anomalies.map((anom) => (
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
        </div>
    )
}
