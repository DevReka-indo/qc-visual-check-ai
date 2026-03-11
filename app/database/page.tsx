"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MoreHorizontal,
  Download,
  Filter,
  Eye,
  FileSearch,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useInspectionStore } from "@/store/use-inspection-store";
import { format } from "date-fns";

// ─── Constants ────────────────────────────────────────────────
const PAGE_SIZE = 15;

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "Pending", label: "Pending" },
  { value: "Resolved", label: "Resolved" },
  { value: "Reworked", label: "Reworked" },
  { value: "Scrapped", label: "Scrapped" },
];

function getStatusBadgeClass(status: string | null) {
  switch (status) {
    case "Resolved":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:border-blue-800";
    case "Reworked":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800";
    case "Scrapped":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:border-red-800";
    default:
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:border-amber-800";
  }
}

// ─── Component ────────────────────────────────────────────────
export default function DatabasePage() {
  // ── Store ──────────────────────────────────────────────────
  const { inspections, totalCount, isLoading, fetchInspections, removeById } =
    useInspectionStore();

  // ── Local UI state (pagination + filters + dialogs) ────────
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingPartId, setDeletingPartId] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Fetch when page / statusFilter changes ─────────────────
  const load = useCallback(() => {
    fetchInspections({
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      status: statusFilter === "all" ? undefined : statusFilter,
    });
  }, [fetchInspections, page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 0 when filter changes
  useEffect(() => {
    setPage(0);
  }, [statusFilter]);

  // ── Client-side search on current page ────────────────────
  const filteredInspections = inspections.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.part_id.toLowerCase().includes(q) ||
      (item.main_defect?.toLowerCase().includes(q) ?? false) ||
      (item.divisions?.name?.toLowerCase().includes(q) ?? false)
    );
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // ── Export CSV ─────────────────────────────────────────────
  function exportCSV() {
    const headers = [
      "Image ID",
      "Detection Date",
      "Result",
      "Defect Type",
      "Confidence",
      "Validation Status",
      "Division",
      "Inspector",
    ];

    const rows = inspections.map((row) => [
      row.part_id,
      row.inspection_date
        ? format(new Date(row.inspection_date), "yyyy-MM-dd HH:mm:ss")
        : "",
      row.ai_result_status === "okay" ? "OKAY" : "NOT OKAY",
      row.main_defect ?? "None",
      row.ai_confidence_score ? `${row.ai_confidence_score}%` : "",
      row.validation_status ?? "Pending",
      row.divisions?.name ?? "",
      row.users?.full_name ?? "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reka-inspections-${format(new Date(), "yyyyMMdd-HHmmss")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ── Delete ─────────────────────────────────────────────────
  function openDeleteDialog(id: string, partId: string) {
    setDeletingId(id);
    setDeletingPartId(partId);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deletingId) return;
    setIsDeleting(true);

    const result = await removeById(deletingId);

    if (result.error) {
      alert(`Gagal menghapus: ${result.error}`);
    } else {
      // If the current page is now empty after deletion, go back one page
      const newTotal = totalCount - 1;
      const maxPage = Math.max(0, Math.ceil(newTotal / PAGE_SIZE) - 1);
      if (page > maxPage) {
        setPage(maxPage);
      } else {
        load();
      }
    }

    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setDeletingId(null);
  }

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-10">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif">
            Database
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete database of all past bogie structural analyses.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportCSV}
          disabled={isLoading || inspections.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* ── Table Card ──────────────────────────────────── */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-xl">
              Database Records
              {!isLoading && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({totalCount} total)
                </span>
              )}
            </CardTitle>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Search input */}
              <div className="relative w-full sm:w-[220px]">
                <Input
                  placeholder="Search ID, defect, division..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-8"
                />
                <FileSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Status filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <TableHead>Validation</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead className="text-right">Confidence</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredInspections.length > 0 ? (
                  filteredInspections.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium font-mono text-xs">
                        {row.part_id}
                      </TableCell>

                      <TableCell className="text-sm">
                        {row.inspection_date
                          ? format(
                              new Date(row.inspection_date),
                              "dd MMM yyyy, HH:mm",
                            )
                          : "–"}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            row.ai_result_status === "okay"
                              ? "outline"
                              : "destructive"
                          }
                          className={
                            row.ai_result_status === "okay"
                              ? "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800"
                              : ""
                          }
                        >
                          {row.ai_result_status === "okay" ? "OKAY" : "NOK"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <span
                          className={
                            !row.main_defect || row.main_defect === "None"
                              ? "text-muted-foreground text-sm"
                              : "font-medium text-sm"
                          }
                        >
                          {row.main_defect ?? "None"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusBadgeClass(row.validation_status)}
                        >
                          {row.validation_status ?? "Pending"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {row.divisions?.name ?? "–"}
                      </TableCell>

                      <TableCell className="text-right text-sm">
                        {row.ai_confidence_score
                          ? `${row.ai_confidence_score}%`
                          : "–"}
                      </TableCell>

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
                              <Link
                                href="/detection-result"
                                className="flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            {row.image_url && (
                              <DropdownMenuItem asChild>
                                <a
                                  href={row.image_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2"
                                >
                                  <Download className="h-4 w-4" />
                                  Download Image
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive flex items-center gap-2"
                              onClick={() =>
                                openDeleteDialog(row.id, row.part_id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Record
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-32 text-center text-muted-foreground"
                    >
                      {searchTerm
                        ? `No records found matching "${searchTerm}".`
                        : "No records found for the selected filter."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination ──────────────────────────────── */}
          <div className="flex items-center justify-between px-2 sm:px-0 mt-4 pb-4 sm:pb-0">
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? "Loading..."
                : `Showing ${Math.min(page * PAGE_SIZE + 1, totalCount)}–${Math.min(
                    (page + 1) * PAGE_SIZE,
                    totalCount,
                  )} of ${totalCount} records`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-xs text-muted-foreground px-1">
                {page + 1} / {Math.max(1, totalPages)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Delete Confirmation Dialog ─────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Hapus Record?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghapus record{" "}
              <span className="font-bold font-mono text-foreground">
                {deletingPartId}
              </span>
              . Tindakan ini tidak dapat dibatalkan dan akan menghapus semua
              anomali yang terkait.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menghapus...
                </span>
              ) : (
                "Ya, Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
