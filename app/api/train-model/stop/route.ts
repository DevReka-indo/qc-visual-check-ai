import { NextResponse } from "next/server";
import { appendTrainingLog, trainingState } from "@/lib/training-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const child = trainingState.process;

    if (!child || !child.pid) {
      return NextResponse.json(
        {
          error:
            "Tidak ada proses training yang tercatat di server. Jika proses masih berjalan, hentikan manual dari terminal.",
          status: trainingState.status,
        },
        { status: 404 },
      );
    }

    const pid = child.pid;

    appendTrainingLog(`\n[INFO] Stop training requested. PID: ${pid}\n`);

    child.kill("SIGTERM");

    trainingState.status = "failed";
    trainingState.finishedAt = new Date().toISOString();
    trainingState.exitCode = null;
    trainingState.process = null;
    trainingState.progressText = "Training dihentikan";

    appendTrainingLog("[INFO] Training process stopped by user.\n");

    return NextResponse.json({
      message: "Training berhasil dihentikan.",
      pid,
      status: trainingState.status,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal menghentikan training.";

    appendTrainingLog(`\n[ERROR] ${message}\n`);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}