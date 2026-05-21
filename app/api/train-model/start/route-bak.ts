import { NextResponse } from "next/server";
import path from "path";
import { spawn } from "child_process";
import { existsSync } from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 3600;

export async function POST() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const projectRoot = process.cwd();
      const aiBackendDir = path.join(projectRoot, "ai-backend");
      const pythonPath = path.resolve(
        projectRoot,
        "..",
        "ai-venv",
        "bin",
        "python3",
      );

      controller.enqueue(encoder.encode("[INFO] Starting training...\n"));
      controller.enqueue(
        encoder.encode(`[INFO] Working directory: ${aiBackendDir}\n`),
      );
      controller.enqueue(
        encoder.encode(`[INFO] Python path: ${pythonPath}\n`),
      );
      controller.enqueue(
        encoder.encode("[INFO] Command: python train_model.py\n\n"),
      );

      if (!existsSync(aiBackendDir)) {
        controller.enqueue(
          encoder.encode(`[ERROR] ai-backend tidak ditemukan: ${aiBackendDir}\n`),
        );
        controller.close();
        return;
      }

      if (!existsSync(pythonPath)) {
        controller.enqueue(
          encoder.encode(`[ERROR] Python venv tidak ditemukan: ${pythonPath}\n`),
        );
        controller.close();
        return;
      }

      const child = spawn(pythonPath, ["train_model.py"], {
        cwd: aiBackendDir,
        shell: false,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: "1",
        },
      });

      child.stdout.on("data", (data) => {
        controller.enqueue(encoder.encode(data.toString()));
      });

      child.stderr.on("data", (data) => {
        controller.enqueue(encoder.encode(data.toString()));
      });

      child.on("error", (error) => {
        controller.enqueue(encoder.encode(`\n[ERROR] ${error.message}\n`));
        controller.close();
      });

      child.on("close", (code) => {
        controller.enqueue(
          encoder.encode(`\n[INFO] Training process finished with code ${code}\n`),
        );
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}