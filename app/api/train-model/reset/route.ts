import { NextResponse } from "next/server";
import { resetTrainingLogs, trainingState } from "@/lib/training-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    if (trainingState.status === "running") {
      return NextResponse.json(
        {
          error:
            "Training sedang berjalan. Tidak bisa reset output dan progress sampai training selesai atau dihentikan.",
        },
        { status: 409 },
      );
    }

    resetTrainingLogs();

    trainingState.status = "idle";
    trainingState.startedAt = null;
    trainingState.finishedAt = null;
    trainingState.exitCode = null;
    trainingState.process = null;

    return NextResponse.json({
      message: "Output terminal dan progress training berhasil direset.",
      status: trainingState.status,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal reset output terminal dan progress training.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}