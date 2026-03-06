"use client"

import React, { useState } from "react"
import { MoreHorizontal, Download, Filter, Eye, FileSearch } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const mockHistory = [
    { id: "BG-2026-0001", date: "2026-03-06 09:12:00", result: "okay", type: "None", confidence: 98.2 },
    { id: "BG-2026-0002", date: "2026-03-06 08:45:12", result: "not_okay", type: "Baret", confidence: 92.4 },
    { id: "BG-2026-0003", date: "2026-03-06 08:30:55", result: "okay", type: "None", confidence: 95.1 },
    { id: "BG-2026-0004", date: "2026-03-05 16:20:01", result: "okay", type: "None", confidence: 96.8 },
    { id: "BG-2026-0005", date: "2026-03-05 14:11:33", result: "not_okay", type: "Cat Meleber", confidence: 76.5 },
    { id: "BG-2026-0006", date: "2026-03-05 11:05:40", result: "okay", type: "None", confidence: 99.1 },
    { id: "BG-2026-0007", date: "2026-03-04 09:15:22", result: "okay", type: "None", confidence: 97.4 },
    { id: "BG-2026-0008", date: "2026-03-04 08:50:30", result: "not_okay", type: "Lengkung", confidence: 88.1 },
]

export default function DatabasePage() {
    const [searchTerm, setSearchTerm] = useState("")

    const filteredHistory = mockHistory.filter(item =>
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Detection History</h1>
                    <p className="text-muted-foreground mt-2">
                        Complete database of all past bogie structural analyses.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="p-4 sm:p-6 pb-2">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle className="text-xl">Database Records</CardTitle>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-[250px]">
                                <Input
                                    placeholder="Search by ID or Defect Type..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                                <FileSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                            <Button variant="secondary" size="icon" title="Filter options">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-4 sm:pt-0 mt-4">
                    <div className="rounded-md border mx-2 sm:mx-0 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-[120px]">Image ID</TableHead>
                                    <TableHead>Detection Date</TableHead>
                                    <TableHead>Result</TableHead>
                                    <TableHead>Defect Type</TableHead>
                                    <TableHead className="text-right">Confidence</TableHead>
                                    <TableHead className="w-[70px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredHistory.length > 0 ? (
                                    filteredHistory.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-medium">{row.id}</TableCell>
                                            <TableCell>{row.date}</TableCell>
                                            <TableCell>
                                                <Badge variant={row.result === "okay" ? "outline" : "destructive"}
                                                    className={row.result === "okay" ? "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800" : ""}>
                                                    {row.result === "okay" ? "OKAY" : "NOT OKAY"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className={row.type === "None" ? "text-muted-foreground" : "font-medium"}>
                                                    {row.type}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">{row.confidence}%</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild>
                                                            <Link href="/detection-result"><Eye className="mr-2 h-4 w-4" /> View Details</Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem>Download Image</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">Delete Record</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No records found matching your search.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex items-center justify-between px-2 sm:px-0 mt-4 pb-4 sm:pb-0">
                        <p className="text-xs text-muted-foreground">Showing {filteredHistory.length} of {mockHistory.length} records</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled>Previous</Button>
                            <Button variant="outline" size="sm">Next</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
