import { NextResponse } from "next/server";
import { trainingState } from "@/lib/training-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: trainingState.status,
    isTraining: trainingState.status === "running",
    startedAt: trainingState.startedAt,
    finishedAt: trainingState.finishedAt,
    exitCode: trainingState.exitCode,

    progressPercent: trainingState.progressPercent,
    progressText: trainingState.progressText,
    currentEpoch: trainingState.currentEpoch,
    totalEpochs: trainingState.totalEpochs,

    datasetVersion: trainingState.datasetVersion,
    datasetUploadedAt: trainingState.datasetUploadedAt,
    datasetFileName: trainingState.datasetFileName,
  });
}