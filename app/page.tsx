"use client";

import React, { useEffect } from "react";
import {
  Upload,
  FileImage,
  AlertCircle,
  CheckCircle2,
  ScanLine,
  Clock,
  ShieldAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useDetectionStore } from "@/store/use-detection-store";
import { useAuthStore } from "@/store/use-auth-store";
import { useInspectionStore } from "@/store/use-inspection-store";

export default function HomePage() {
  // ── Stores ────────────────────────────────────────────────────
  const {
    selectedImage,
    selectedFile,
    isDetecting,
    isUploading,
    isCompressing,
    result,
    confidence,
    defectBox,
    recentDetections,
    setFile,
    runDetection,
    setRecentDetections,
    reset,
  } = useDetectionStore();

  const profile = useAuthStore((s) => s.profile);
  const { inspections, fetchInspections } = useInspectionStore();

  // ── Local UI-only state (drag & drop) ─────────────────────────
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ── On mount: load 3 recent detections ───────────────────────
  useEffect(() => {
    fetchInspections({ limit: 3 });
  }, [fetchInspections]);

  // ── Sync store's recentDetections from inspection store ───────
  useEffect(() => {
    if (inspections.length === 0) return;
    setRecentDetections(
      inspections.slice(0, 3).map((i) => ({
        id: i.part_id,
        status: i.ai_result_status === "okay" ? "okay" : "not_okay",
        time: new Date(i.inspection_date ?? new Date()).toLocaleDateString(
          "id-ID",
        ),
      })),
    );
  }, [inspections, setRecentDetections]);

  // ── File handlers ─────────────────────────────────────────────
  const processFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      return;
    }

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      setError("Ukuran gambar maksimal adalah 2MB. Silakan pilih gambar yang lebih kecil.");
      return;
    }

    setFile(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // ── Detection ─────────────────────────────────────────────────
  const handleDetection = () => {
    runDetection(profile?.division_id ?? null);
  };

  // ── Dynamic card class ────────────────────────────────────────
  const resultCardClass = result
    ? result.status === "okay"
      ? "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
      : "border-destructive/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
    : "border-sidebar-border";

  return (
    <div className="flex flex-col gap-4 md:gap-6 w-full max-w-[1600px] mx-auto pb-10 animate-in fade-in duration-500">
      {/* CSS Animasi Scanner */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes scan {
              0%   { top: 0%;   opacity: 0; }
              10%  { opacity: 1; }
              90%  { opacity: 1; }
              100% { top: 100%; opacity: 0; }
            }
            .animate-scan {
              animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }
          `,
        }}
      />

      {/* ── Page Header ──────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-serif">
          Workspace Deteksi
        </h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
          Upload struktur bawah bogie kereta (Train Bogie Base) untuk dianalisis
          oleh AI.
        </p>
      </div>

      {/* ── Main Grid ────────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive" className="animate-in slide-in-from-top-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        {/* ── INPUT CARD ───────────────────────────────────── */}
        <Card className="flex flex-col border-sidebar-border shadow-sm overflow-hidden relative">
          <CardHeader className="bg-muted/30 border-b px-4 py-3 md:px-6 md:py-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <ScanLine className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              Vision Scanner
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Drag &amp; drop gambar atau klik untuk memilih file.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 p-3 md:p-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative w-full min-h-[260px] md:min-h-[350px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all duration-200 overflow-hidden ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : selectedImage
                    ? "border-transparent bg-slate-900/5 dark:bg-slate-900/50"
                    : "border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/50 cursor-pointer"
              }`}
            >
              {selectedImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-2 group">
                  <img
                    src={selectedImage}
                    alt="Uploaded bogie"
                    className="max-h-[240px] md:max-h-[300px] object-contain rounded-md shadow-sm z-10"
                  />

                  {/* Scanning/Processing effect */}
                  {(isDetecting || isCompressing) && (
                    <div className="absolute inset-0 z-20 overflow-hidden rounded-md pointer-events-none">
                      <div className="absolute inset-0 bg-primary/10 animate-pulse" />
                      {isUploading || isCompressing ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-primary font-medium bg-background/80 px-2 py-1 rounded">
                            {isCompressing ? "Compressing image..." : "Uploading image..."}
                          </span>
                        </div>
                      ) : (
                        <div className="absolute w-full h-1 bg-primary shadow-[0_0_8px_2px_rgba(13,110,253,0.8)] animate-scan left-0" />
                      )}
                    </div>
                  )}

                  {/* Bounding box overlay */}
                  {defectBox && result?.status === "not_okay" && (
                    <div
                      className="absolute z-20 border-2 border-destructive bg-destructive/20 shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-500 ease-out animate-in zoom-in-50"
                      style={{
                        top: `${defectBox.top}%`,
                        left: `${defectBox.left}%`,
                        width: `${defectBox.width}%`,
                        height: `${defectBox.height}%`,
                      }}
                    >
                      <Badge
                        variant="destructive"
                        className="absolute -top-3 -left-1 text-[10px] px-1 py-0 shadow-md"
                      >
                        {result.reason}
                      </Badge>
                    </div>
                  )}

                  {/* Hover overlay to re-select image */}
                  {!isDetecting && (
                    <label className="absolute inset-0 cursor-pointer w-full h-full z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity rounded-md">
                      <span className="bg-background text-foreground px-4 py-2 rounded-lg font-medium shadow-lg flex items-center gap-2 text-sm">
                        <Upload className="w-4 h-4" /> Ganti Gambar
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
              ) : (
                <>
                  <label className="absolute inset-0 cursor-pointer z-10 w-full h-full">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                  <div className="p-3 md:p-4 bg-primary/10 rounded-full text-primary mb-3 md:mb-4 pointer-events-none">
                    <Upload className="w-8 h-8 md:w-10 md:h-10" />
                  </div>
                  <div className="text-center pointer-events-none space-y-1 px-4">
                    <p className="text-sm md:text-base font-semibold">
                      Tarik gambar ke sini
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      atau klik untuk menelusuri folder
                    </p>
                    <Badge variant="secondary" className="mt-3 md:mt-4 text-xs">
                      PNG, JPG, JPEG (Max 2MB)
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t p-3 md:p-4 bg-muted/10 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                reset();
                setError(null);
              }}
              disabled={!selectedImage || isDetecting || isCompressing}
              className="w-20 md:w-24 text-sm"
            >
              Clear
            </Button>
            <Button
              onClick={handleDetection}
              disabled={!selectedImage || !selectedFile || isDetecting || isCompressing}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:scale-[1.01] text-sm"
            >
              {isDetecting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">
                    {isUploading ? "Mengupload..." : "Menganalisis..."}
                  </span>
                  <span className="sm:hidden">
                    {isUploading ? "Upload..." : "Analisis..."}
                  </span>
                </span>
              ) : (
                <>
                  <span className="hidden sm:inline">Jalankan Deteksi AI</span>
                  <span className="sm:hidden">Deteksi AI</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* ── KANAN: HASIL & AKTIVITAS ──────────────────────── */}
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Analysis Result Card */}
          <Card
            className={`flex flex-col transition-all duration-500 ${resultCardClass}`}
          >
            <CardHeader className="px-4 py-3 md:px-6 md:py-4">
              <CardTitle className="text-base md:text-lg">
                Hasil Inspeksi
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Output deteksi dari model Deep Learning.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 px-4 pb-4 md:px-6 md:pb-6">
              {isDetecting ? (
                <div className="flex flex-col items-center justify-center h-[160px] md:h-[200px] space-y-4">
                  <div className="relative">
                    <div className="w-14 h-14 md:w-16 md:h-16 border-4 border-muted rounded-full" />
                    <div className="w-14 h-14 md:w-16 md:h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
                  </div>
                  <p className="text-xs md:text-sm font-medium animate-pulse text-primary text-center">
                    {isUploading
                      ? "Mengupload gambar ke storage..."
                      : "Memproses bobot model AI..."}
                  </p>
                </div>
              ) : result ? (
                <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  {/* Status row */}
                  <div
                    className={`flex items-center justify-between p-3 md:p-5 border rounded-xl ${
                      result.status === "okay"
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-destructive/10 border-destructive/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      {result.status === "okay" ? (
                        <div className="p-1.5 md:p-2 bg-emerald-500/20 rounded-full">
                          <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" />
                        </div>
                      ) : (
                        <div className="p-1.5 md:p-2 bg-destructive/20 rounded-full">
                          <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-destructive" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-sm md:text-base">
                          Status Akhir
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Integritas Struktur Bogie
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        result.status === "okay" ? "outline" : "destructive"
                      }
                      className={`text-xs md:text-base px-2 md:px-4 py-1 md:py-2 shadow-sm shrink-0 ${
                        result.status === "okay"
                          ? "bg-emerald-500 text-white border-transparent"
                          : "animate-pulse"
                      }`}
                    >
                      {result.status === "okay" ? "PASSED" : "REJECT"}
                    </Badge>
                  </div>

                  {/* Anomaly alert */}
                  {result.status === "not_okay" && (
                    <Alert
                      variant="destructive"
                      className="bg-destructive/5 border-destructive/20 text-destructive"
                    >
                      <ShieldAlert className="h-4 w-4 md:h-5 md:w-5" />
                      <AlertTitle className="font-bold text-sm md:text-base ml-2">
                        Anomali Terdeteksi!
                      </AlertTitle>
                      <AlertDescription className="mt-1 text-xs md:text-sm leading-relaxed ml-2">
                        Sistem mendeteksi{" "}
                        <span className="font-bold underline">
                          {result.reason}
                        </span>{" "}
                        pada area yang ditandai merah. Harap segera lakukan
                        peninjauan fisik.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Confidence bar */}
                  <div className="space-y-2 md:space-y-3 p-3 md:p-5 bg-muted/20 rounded-xl border border-muted-foreground/10">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs md:text-sm font-medium text-muted-foreground">
                        Confidence Level (Akurasi)
                      </h4>
                      <p
                        className={`text-base md:text-lg font-bold ${
                          result.status === "okay"
                            ? "text-emerald-500"
                            : "text-destructive"
                        }`}
                      >
                        {confidence}%
                      </p>
                    </div>
                    <div className="w-full h-2 md:h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full transition-all duration-1000 ease-out ${
                          result.status === "okay"
                            ? "bg-emerald-500"
                            : "bg-destructive"
                        }`}
                        style={{ width: `${confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[160px] md:min-h-[200px] text-muted-foreground/50 space-y-3 md:space-y-4">
                  <FileImage className="w-12 h-12 md:w-16 md:h-16 opacity-30" />
                  <p className="text-xs md:text-sm font-medium">
                    Menunggu input gambar...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Card */}
          <Card className="border-sidebar-border shadow-sm">
            <CardHeader className="py-3 pb-2 px-4 md:px-6">
              <CardTitle className="text-xs md:text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Aktivitas Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 pb-3 md:pb-4 px-4 md:px-6">
              <div className="space-y-2 md:space-y-3">
                {recentDetections.length === 0 ? (
                  <p className="text-xs md:text-sm text-muted-foreground text-center py-3 md:py-4">
                    Belum ada aktivitas.
                  </p>
                ) : (
                  recentDetections.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            item.status === "okay"
                              ? "bg-emerald-500"
                              : "bg-destructive"
                          }`}
                        />
                        <span className="text-xs md:text-sm font-medium truncate">
                          {item.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={
                            item.status === "okay" ? "outline" : "destructive"
                          }
                          className={`text-[10px] px-1.5 py-0 hidden sm:inline-flex ${
                            item.status === "okay"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-300"
                              : ""
                          }`}
                        >
                          {item.status === "okay" ? "OK" : "NOK"}
                        </Badge>
                        <span className="text-[10px] md:text-xs text-muted-foreground">
                          {item.time}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
