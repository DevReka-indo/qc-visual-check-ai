import { NextResponse } from "next/server";
import path from "path";
import { spawn } from "child_process";
import { existsSync } from "fs";
import {
  resetTrainingLogs,
  appendTrainingLog,
  trainingState,
} from "@/lib/training-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 3600;

export async function POST() {
  try {
    if (trainingState.status === "running") {
      return NextResponse.json(
        {
          message: "Training sedang berjalan.",
          status: trainingState.status,
        },
        { status: 409 },
      );
    }

    const projectRoot = process.cwd();
    const aiBackendDir = path.join(projectRoot, "ai-backend");
    const pythonPath = path.resolve(
      projectRoot,
      "..",
      "ai-venv",
      "bin",
      "python3",
    );

    trainingState.status = "running";
    trainingState.process = null;
    trainingState.startedAt = new Date().toISOString();
    trainingState.finishedAt = null;
    trainingState.exitCode = null;

    resetTrainingLogs();

    appendTrainingLog("[INFO] Starting training...\n");
    appendTrainingLog(`[INFO] Working directory: ${aiBackendDir}\n`);
    appendTrainingLog(`[INFO] Python path: ${pythonPath}\n`);
    appendTrainingLog("[INFO] Command: python train_model.py\n\n");

    if (!existsSync(aiBackendDir)) {
      appendTrainingLog(`[ERROR] ai-backend tidak ditemukan: ${aiBackendDir}\n`);

      trainingState.status = "failed";
      trainingState.finishedAt = new Date().toISOString();
      trainingState.exitCode = 1;
      trainingState.process = null;

      return NextResponse.json(
        { error: "ai-backend tidak ditemukan." },
        { status: 500 },
      );
    }

    if (!existsSync(pythonPath)) {
      appendTrainingLog(`[ERROR] Python venv tidak ditemukan: ${pythonPath}\n`);

      trainingState.status = "failed";
      trainingState.finishedAt = new Date().toISOString();
      trainingState.exitCode = 1;
      trainingState.process = null;

      return NextResponse.json(
        { error: "Python venv tidak ditemukan." },
        { status: 500 },
      );
    }

    const child = spawn(pythonPath, ["train_model.py"], {
      cwd: aiBackendDir,
      shell: false,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1",
      },
      detached: false,
    });

    trainingState.process = child;

    child.stdout.on("data", (data) => {
      appendTrainingLog(data.toString());
    });

    child.stderr.on("data", (data) => {
      appendTrainingLog(data.toString());
    });

    child.on("error", (error) => {
      appendTrainingLog(`\n[ERROR] ${error.message}\n`);

      trainingState.status = "failed";
      trainingState.finishedAt = new Date().toISOString();
      trainingState.exitCode = 1;
      trainingState.process = null;
    });

    child.on("close", (code) => {
      const exitCode = code ?? 1;

      appendTrainingLog(
        `\n[INFO] Training process finished with code ${exitCode}\n`,
      );

      trainingState.status = exitCode === 0 ? "finished" : "failed";
      trainingState.finishedAt = new Date().toISOString();
      trainingState.exitCode = exitCode;
      trainingState.process = null;

      if (exitCode === 0) {
        trainingState.progressPercent = 100;
        trainingState.progressText = "Training selesai";
      }
    });

    return NextResponse.json({
      message: "Training berhasil dimulai.",
      status: trainingState.status,
      startedAt: trainingState.startedAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal memulai training.";

    appendTrainingLog(`\n[ERROR] ${message}\n`);

    trainingState.status = "failed";
    trainingState.finishedAt = new Date().toISOString();
    trainingState.exitCode = 1;
    trainingState.process = null;

    return NextResponse.json({ error: message }, { status: 500 });
  }
}