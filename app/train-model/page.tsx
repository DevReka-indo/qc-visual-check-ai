"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Upload,
  Play,
  Loader2,
  Database,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Square,
  RotateCcw,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type TrainingStatus = "idle" | "running" | "finished" | "failed";

type TrainingStatusResponse = {
  status: TrainingStatus;
  isTraining: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  exitCode: number | null;

  progressPercent: number;
  progressText: string | null;
  currentEpoch: number | null;
  totalEpochs: number | null;

  datasetVersion: string | null;
  datasetUploadedAt: string | null;
  datasetFileName: string | null;
};

type TrainingLogsResponse = {
  logs: string;
};

export default function TrainModelPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const consoleRef = useRef<HTMLDivElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isStartingTraining, setIsStartingTraining] = useState(false);
  const [isStoppingTraining, setIsStoppingTraining] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isResettingOutput, setIsResettingOutput] = useState(false);

  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [trainingOutput, setTrainingOutput] = useState<string>("");

  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>("idle");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [finishedAt, setFinishedAt] = useState<string | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);

  const [progressPercent, setProgressPercent] = useState(0);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [currentEpoch, setCurrentEpoch] = useState<number | null>(null);
  const [totalEpochs, setTotalEpochs] = useState<number | null>(null);

  const [datasetVersion, setDatasetVersion] = useState<string | null>(null);
  const [datasetUploadedAt, setDatasetUploadedAt] = useState<string | null>(
    null,
  );
  const [datasetFileName, setDatasetFileName] = useState<string | null>(null);

  function formatDateTime(value: string | null) {
    if (!value) return "-";

    return new Date(value).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function getTrainingStatusBadgeVariant() {
    if (trainingStatus === "running") return "default";
    if (trainingStatus === "finished") return "secondary";
    if (trainingStatus === "failed") return "destructive";
    return "outline";
  }

  function getSafeProgressPercent() {
    return Math.min(100, Math.max(0, Math.round(progressPercent || 0)));
  }

  function appendConsoleError(message: string) {
    setTrainingOutput((prev) =>
      prev ? `${prev}\n[ERROR] ${message}\n` : `[ERROR] ${message}\n`,
    );
  }

  async function loadTrainingStatus() {
    try {
      setIsLoadingStatus(true);

      const response = await fetch("/api/train-model/status", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil status training.");
      }

      const result: TrainingStatusResponse = await response.json();

      setTrainingStatus(result.status);
      setIsTraining(Boolean(result.isTraining));
      setStartedAt(result.startedAt);
      setFinishedAt(result.finishedAt);
      setExitCode(result.exitCode);

      setProgressPercent(result.progressPercent ?? 0);
      setProgressText(result.progressText ?? null);
      setCurrentEpoch(result.currentEpoch ?? null);
      setTotalEpochs(result.totalEpochs ?? null);

      setDatasetVersion(result.datasetVersion);
      setDatasetUploadedAt(result.datasetUploadedAt);
      setDatasetFileName(result.datasetFileName);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal mengambil status training.";

      appendConsoleError(message);
    } finally {
      setIsLoadingStatus(false);
    }
  }

  async function loadTrainingLogs() {
    try {
      const response = await fetch("/api/train-model/logs", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil logs training.");
      }

      const result: TrainingLogsResponse = await response.json();

      setTrainingOutput(result.logs || "");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal mengambil logs training.";

      appendConsoleError(message);
    }
  }

  async function refreshTrainingData() {
    await Promise.all([loadTrainingStatus(), loadTrainingLogs()]);
  }

  useEffect(() => {
    refreshTrainingData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshTrainingData();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!consoleRef.current) return;

    consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
  }, [trainingOutput]);

  async function handleUpload() {
    if (!selectedFile) {
      setUploadStatus("Pilih file dataset .zip terlebih dahulu.");
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".zip")) {
      setUploadStatus("File harus berformat .zip.");
      return;
    }

    setIsUploading(true);
    setUploadStatus("Uploading dan extracting dataset...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/train-model/upload", {
        method: "POST",
        body: formData,
      });

      const text = await response.text();

      let result: any = null;

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(
          `Server tidak mengembalikan JSON. Status: ${response.status}. Response: ${text.slice(
            0,
            200,
          )}`,
        );
      }

      if (!response.ok) {
        throw new Error(result?.error || "Gagal upload dataset.");
      }

      setUploadStatus(result.message || "Dataset berhasil diupload.");

      setDatasetVersion(result.datasetVersion ?? null);
      setDatasetFileName(result.datasetFileName ?? null);
      setDatasetUploadedAt(result.datasetUploadedAt ?? null);

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await refreshTrainingData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Terjadi kesalahan upload.";

      setUploadStatus(message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleStartTraining() {
    if (!datasetVersion) {
      setTrainingOutput(
        "[ERROR] Dataset aktif belum tersedia. Upload dataset terlebih dahulu.\n",
      );
      return;
    }

    setIsStartingTraining(true);
    setTrainingStatus("running");
    setIsTraining(true);
    setProgressPercent(0);
    setProgressText(null);
    setCurrentEpoch(null);
    setTotalEpochs(null);
    setTrainingOutput("");

    try {
      const response = await fetch("/api/train-model/start", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || result?.message || "Gagal menjalankan training.",
        );
      }

      await refreshTrainingData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menjalankan training.";

      appendConsoleError(message);
      await loadTrainingStatus();
    } finally {
      setIsStartingTraining(false);
    }
  }

  async function handleStopTraining() {
    setIsStoppingTraining(true);

    try {
      const response = await fetch("/api/train-model/stop", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || result?.message || "Gagal menghentikan training.",
        );
      }

      await refreshTrainingData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menghentikan training.";

      appendConsoleError(message);
      await loadTrainingStatus();
    } finally {
      setIsStoppingTraining(false);
    }
  }

  async function handleResetTrainingOutput() {
  setIsResettingOutput(true);

  try {
    const response = await fetch("/api/train-model/reset", {
      method: "POST",
    });

    const text = await response.text();

    let result: any = null;

    try {
      result = JSON.parse(text);
    } catch {
      throw new Error(
        `Server tidak mengembalikan JSON. Status: ${response.status}. Response: ${text.slice(
          0,
          200,
        )}`,
      );
    }

    if (!response.ok) {
      throw new Error(
        result?.error ||
          result?.message ||
          "Gagal reset output terminal dan progress.",
      );
    }

    setTrainingOutput("");
    setTrainingStatus("idle");
    setIsTraining(false);
    setStartedAt(null);
    setFinishedAt(null);
    setExitCode(null);

    setProgressPercent(0);
    setProgressText(null);
    setCurrentEpoch(null);
    setTotalEpochs(null);

    await refreshTrainingData();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal reset output terminal dan progress.";

    appendConsoleError(message);
    await loadTrainingStatus();
  } finally {
    setIsResettingOutput(false);
  }
}

  const safeProgressPercent = getSafeProgressPercent();

  return (
    <div className="flex flex-col gap-4 md:gap-6 w-full max-w-[1600px] mx-auto pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-serif">
            Train Model
          </h1>

          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            Upload dataset baru, overwrite dataset lama, lalu jalankan proses
            training model AI.
          </p>
        </div>

        <Button
          variant="outline"
          className="gap-2 w-fit"
          onClick={refreshTrainingData}
          disabled={isLoadingStatus}
        >
          {isLoadingStatus ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh Status
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Database className="w-5 h-5" />
              Upload Dataset
            </CardTitle>

            <CardDescription>
              Upload file ZIP. Isi ZIP akan diextract ke folder{" "}
              <span className="font-mono">Dataset</span> dan overwrite dataset
              lama.
            </CardDescription>

            <div className="mt-3 rounded-md border bg-muted/30 p-3 text-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Dataset aktif</span>
                <Badge variant={datasetVersion ? "secondary" : "outline"}>
                  {datasetVersion ? "Available" : "Empty"}
                </Badge>
              </div>

              <div className="font-medium break-all">
                {datasetVersion || "Belum ada dataset aktif"}
              </div>

              {datasetFileName && (
                <div className="text-xs text-muted-foreground break-all">
                  File: {datasetFileName}
                </div>
              )}

              {datasetUploadedAt && (
                <div className="text-xs text-muted-foreground">
                  Uploaded: {formatDateTime(datasetUploadedAt)}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                disabled={isUploading || isTraining}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedFile(file);
                  setUploadStatus("");
                }}
              />

              {selectedFile && (
                <div className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
                  <span className="truncate font-medium">
                    {selectedFile.name}
                  </span>
                  <Badge variant="secondary">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                </div>
              )}
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleUpload}
              disabled={isUploading || isTraining}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload & Extract Dataset
                </>
              )}
            </Button>

            {isTraining && (
              <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                Upload dataset dinonaktifkan karena training sedang berjalan.
              </div>
            )}

            {uploadStatus && (
              <div className="rounded-md border bg-muted/30 p-3 text-sm flex gap-2">
                {uploadStatus.toLowerCase().includes("berhasil") ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <span>{uploadStatus}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Terminal className="w-5 h-5" />
                  Training Console
                </CardTitle>

                <div
                  className={[
                    "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm md:max-w-[420px]",
                    datasetVersion
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300",
                  ].join(" ")}
                >
                  <span className="relative flex h-2 w-2 shrink-0">
                    {datasetVersion && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    )}

                    <span
                      className={[
                        "relative inline-flex h-2 w-2 rounded-full",
                        datasetVersion ? "bg-emerald-500" : "bg-slate-400",
                      ].join(" ")}
                    />
                  </span>

                  <span
                    className={[
                      "shrink-0",
                      datasetVersion
                        ? "text-emerald-700/80 dark:text-emerald-300/80"
                        : "text-slate-500 dark:text-slate-400",
                    ].join(" ")}
                  >
                    Dataset Aktif
                  </span>

                  <span
                    className={[
                      "h-3 w-px shrink-0",
                      datasetVersion
                        ? "bg-emerald-200 dark:bg-emerald-800"
                        : "bg-slate-200 dark:bg-slate-700",
                    ].join(" ")}
                  />

                  <span className="truncate font-semibold">
                    {datasetVersion || "Belum ada"}
                  </span>
                </div>

                <CardDescription className="mt-1">
                  Jalankan proses training model AI. Output proses training akan
                  tampil otomatis dari log server.
                </CardDescription>
              </div>

              <Badge variant={getTrainingStatusBadgeVariant()}>
                {trainingStatus.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <div className="text-muted-foreground">Started</div>
                <div className="font-medium">{formatDateTime(startedAt)}</div>
              </div>

              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <div className="text-muted-foreground">Finished</div>
                <div className="font-medium">{formatDateTime(finishedAt)}</div>
              </div>

              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <div className="text-muted-foreground">Exit Code</div>
                <div className="font-medium">
                  {exitCode === null ? "-" : exitCode}
                </div>
              </div>
            </div>

            <div className="pt-3 space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="font-medium">
                  {progressText || "Progress training"}
                </div>

                <div className="text-muted-foreground">
                  {safeProgressPercent}%
                </div>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full border bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{
                    width: `${safeProgressPercent}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {currentEpoch && totalEpochs
                    ? `Epoch ${currentEpoch} dari ${totalEpochs}`
                    : "Menunggu data progress dari training log..."}
                </span>

                {isTraining && <span>Training sedang berjalan...</span>}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  className="gap-2 w-fit"
                  onClick={handleStartTraining}
                  disabled={
                    isTraining ||
                    isUploading ||
                    isStartingTraining ||
                    !datasetVersion
                  }
                >
                  {isStartingTraining || isTraining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Training Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start Training
                    </>
                  )}
                </Button>

                <Button
                  variant="destructive"
                  className="gap-2 w-fit"
                  onClick={handleStopTraining}
                  disabled={!isTraining || isStoppingTraining}
                >
                  {isStoppingTraining ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  Stop Training
                </Button>

                <Button
                  variant="outline"
                  className="gap-2 w-fit"
                  onClick={handleResetTrainingOutput}
                  disabled={isTraining || isResettingOutput}
                >
                  {isResettingOutput ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  Reset Output
                </Button>
              </div>

              {!datasetVersion && (
                <div className="text-sm text-muted-foreground">
                  Upload dataset terlebih dahulu sebelum training.
                </div>
              )}
            </div>

            <div
              ref={consoleRef}
              className="rounded-xl border bg-black text-green-400 font-mono text-xs md:text-sm p-4 h-[420px] overflow-auto whitespace-pre-wrap"
            >
              {trainingOutput ||
                "Output proses training akan tampil di sini..."}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}