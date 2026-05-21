import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { createWriteStream } from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import { Readable } from "stream";
import Busboy from "busboy";
import { trainingState } from "@/lib/training-state";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function emptyDir(dirPath: string) {
  await fs.rm(dirPath, { recursive: true, force: true });
  await fs.mkdir(dirPath, { recursive: true });
}

function getDatasetVersionFromFilename(filename: string) {
  return filename.replace(/\.zip$/i, "");
}

function parseMultipartUpload(
  request: NextRequest,
  zipPath: string,
): Promise<{ filename: string }> {
  return new Promise((resolve, reject) => {
    const contentType = request.headers.get("content-type");

    if (!contentType) {
      reject(new Error("Content-Type tidak ditemukan."));
      return;
    }

    const busboy = Busboy({
      headers: {
        "content-type": contentType,
      },
      limits: {
        files: 1,
        fileSize: 300 * 1024 * 1024,
      },
    });

    let uploadedFilename = "";
    let hasFile = false;
    let writePromise: Promise<void> | null = null;
    let alreadyRejected = false;

    function rejectOnce(error: Error) {
      if (alreadyRejected) return;
      alreadyRejected = true;
      reject(error);
    }

    busboy.on("file", (_fieldname, file, info) => {
      hasFile = true;
      uploadedFilename = info.filename;

      if (!uploadedFilename.toLowerCase().endsWith(".zip")) {
        file.resume();
        rejectOnce(new Error("File harus berformat .zip."));
        return;
      }

      const writeStream = createWriteStream(zipPath);

      writePromise = new Promise((resolveWrite, rejectWrite) => {
        file.pipe(writeStream);

        writeStream.on("finish", resolveWrite);
        writeStream.on("error", rejectWrite);
        file.on("error", rejectWrite);
      });
    });

    busboy.on("error", rejectOnce);

    busboy.on("finish", async () => {
      try {
        if (alreadyRejected) return;

        if (!hasFile) {
          rejectOnce(new Error("File dataset tidak ditemukan."));
          return;
        }

        if (writePromise) {
          await writePromise;
        }

        resolve({ filename: uploadedFilename });
      } catch (error) {
        rejectOnce(
          error instanceof Error
            ? error
            : new Error("Gagal memproses upload dataset."),
        );
      }
    });

    if (!request.body) {
      rejectOnce(new Error("Request body kosong."));
      return;
    }

    const nodeStream = Readable.fromWeb(request.body as any);
    nodeStream.pipe(busboy);
  });
}

export async function POST(request: NextRequest) {
  try {

    if (trainingState.status === "running") {
      return NextResponse.json(
        {
          error:
            "Training sedang berjalan. Tidak bisa upload dataset baru sampai training selesai.",
        },
        { status: 409 },
      );
    }
    
    const projectRoot = process.cwd();
    const aiBackendDir = path.join(projectRoot, "ai-backend");
    const datasetDir = path.join(aiBackendDir, "dataset");
    const uploadTempDir = path.join(projectRoot, ".tmp-upload");
    const zipPath = path.join(uploadTempDir, "dataset.zip");

    await ensureDir(uploadTempDir);
    await ensureDir(aiBackendDir);

    const { filename } = await parseMultipartUpload(request, zipPath);

    await emptyDir(datasetDir);

    await execFileAsync("unzip", ["-o", zipPath, "-d", datasetDir], {
      maxBuffer: 1024 * 1024 * 20,
    });

    await fs.rm(zipPath, { force: true });

    const datasetVersion = getDatasetVersionFromFilename(filename);
    const datasetUploadedAt = new Date().toISOString();

    trainingState.datasetVersion = datasetVersion;
    trainingState.datasetFileName = filename;
    trainingState.datasetUploadedAt = datasetUploadedAt;

    return NextResponse.json({
      message: `Dataset ${filename} berhasil diupload, data lama dioverwrite, dan ZIP berhasil diextract.`,
      datasetPath: datasetDir,
      datasetVersion,
      datasetFileName: filename,
      datasetUploadedAt,
    });
  } catch (error) {
    console.error("Upload dataset error:", error);

    const message =
      error instanceof Error ? error.message : "Gagal upload dataset.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}