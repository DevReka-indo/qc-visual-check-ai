"use client"

import { useEffect, useState } from "react"
import { MoreHorizontal, Download, Filter, Eye, FileSearch, Loader2 } from "lucide-react"
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
import { getInspections, type InspectionWithDetails } from "@/app/actions/database"
import { format } from "date-fns"

export default function DatabasePage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [history, setHistory] = useState<InspectionWithDetails[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            const data = await getInspections(100)
            setHistory(data)
            setLoading(false)
        }
        loadData()
    }, [])

    const filteredHistory = history.filter(item =>
        item.part_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.main_defect && item.main_defect.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.divisions?.name && item.divisions.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-serif">Database</h1>
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
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex w-full items-center justify-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading data...</div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredHistory.length > 0 ? (
                                    filteredHistory.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-medium">{row.part_id}</TableCell>
                                            <TableCell>{row.inspection_date ? format(new Date(row.inspection_date), "yyyy-MM-dd HH:mm:ss") : '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={row.ai_result_status === "okay" ? "outline" : "destructive"}
                                                    className={row.ai_result_status === "okay" ? "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800" : ""}>
                                                    {row.ai_result_status === "okay" ? "OKAY" : "NOT OKAY"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className={(!row.main_defect || row.main_defect === "None") ? "text-muted-foreground" : "font-medium"}>
                                                    {row.main_defect || "None"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">{row.ai_confidence_score ? `${row.ai_confidence_score}%` : '-'}</TableCell>
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
                                                            <Link href="/detection-result">View Details</Link>
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
                        <p className="text-xs text-muted-foreground">Showing {filteredHistory.length} records</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled>Previous</Button>
                            <Button variant="outline" size="sm" disabled={filteredHistory.length < 100}>Next</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
