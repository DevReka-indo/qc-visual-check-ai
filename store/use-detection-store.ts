"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type DetectionResult = {
  status: "okay" | "not_okay";
  reason?: string;
};

export type BoundingBox = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type RecentDetection = {
  id: string;
  status: string;
  time: string;
};

type AnomalyPayload = {
  defect_type: string;
  location: string;
  description: string;
  confidence_score: number;
  bounding_box?: Record<string, unknown>;
};

type ApiDetection = {
  label?: string;
  confidence?: number;
  box?: number[];
};

type AiPredictionResponse = {
  success?: boolean;
  error?: string;
  data?: {
    label?: string;
    confidence?: number;
    image_url?: string | null;
    box?: number[];
    all_detections?: ApiDetection[];
  };
};

interface DetectionState {
  selectedImage: string | null;
  selectedFile: File | null;

  isDetecting: boolean;
  isUploading: boolean;
  isCompressing: boolean;
  result: DetectionResult | null;
  confidence: number;
  defectBox: BoundingBox | null;

  recentDetections: RecentDetection[];

  setFile: (file: File) => Promise<void>;
  runDetection: (divisionId: string | null) => Promise<void>;
  setRecentDetections: (items: RecentDetection[]) => void;
  reset: () => void;
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function compressImage(file: File): Promise<File> {
  try {
    const imageCompression = (await import("browser-image-compression")).default;
    return await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
    });
  } catch (error) {
    console.error("Compression error:", error);
    return file;
  }
}

async function callAIModel(file: File): Promise<{
  finalResult: DetectionResult;
  defectBox: BoundingBox | null;
  anomalies: AnomalyPayload[];
  confidence: number;
  imageUrl: string | null;
}> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const apiUrl =
      process.env.NEXT_PUBLIC_AI_API_URL || "http://192.168.8.10:8000";

    const res = await fetch(`${apiUrl}/api/predict`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`AI Backend returned ${res.status}`);
    }

    const json = (await res.json()) as AiPredictionResponse;

    if (!json.success) {
      throw new Error(json.error || "AI Backend error");
    }

    const rawLabel = json.data?.label || "normal";
    const normalizedLabel = rawLabel.trim().toLowerCase();

    const confidence = parseFloat(
      ((json.data?.confidence || 0) * 100).toFixed(1),
    );

    const imagePath = json.data?.image_url ?? null;
    const imageUrl = imagePath ? `${apiUrl}${imagePath}` : null;

    const isOkayLabel = (label?: string | null) => {
      const normalized = String(label ?? "")
        .trim()
        .toLowerCase();

      return (
        normalized === "ok" ||
        normalized === "okay" ||
        normalized === "normal"
      );
    };

    const isOkay = isOkayLabel(normalizedLabel);

    if (isOkay) {
      return {
        finalResult: {
          status: "okay",
          reason: "OK",
        },
        defectBox: null,
        anomalies: [],
        confidence,
        imageUrl,
      };
    }

    let box: BoundingBox | null = null;

    if (
      json.data?.box &&
      Array.isArray(json.data.box) &&
      json.data.box.length === 4
    ) {
      const [x1, y1, x2, y2] = json.data.box;

      box = {
        left: x1,
        top: y1,
        width: x2 - x1,
        height: y2 - y1,
      };
    }

    const anomalies: AnomalyPayload[] = [];

    if (
      json.data?.all_detections &&
      Array.isArray(json.data.all_detections)
    ) {
      json.data.all_detections.forEach((det, idx) => {
        if (isOkayLabel(det.label)) return;

        let detBox: BoundingBox | null = null;

        if (det.box && Array.isArray(det.box) && det.box.length === 4) {
          const [dx1, dy1, dx2, dy2] = det.box;

          detBox = {
            left: dx1,
            top: dy1,
            width: dx2 - dx1,
            height: dy2 - dy1,
          };
        }

        const detConfidence = parseFloat(
          ((det.confidence || 0) * 100).toFixed(1),
        );

        anomalies.push({
          defect_type: det.label ?? "Unknown",
          location: `Detection #${idx + 1}`,
          description: `AI detected anomaly: ${det.label ?? "Unknown"}`,
          confidence_score: detConfidence,
          bounding_box: detBox
            ? (detBox as Record<string, unknown>)
            : undefined,
        });
      });
    }

    if (anomalies.length === 0) {
      anomalies.push({
        defect_type: rawLabel,
        location: "Visual Surface",
        description: `AI detected anomaly: ${rawLabel}`,
        confidence_score: confidence,
        bounding_box: box as Record<string, unknown>,
      });
    }

    return {
      finalResult: {
        status: "not_okay",
        reason: rawLabel,
      },
      defectBox: box,
      confidence,
      anomalies,
      imageUrl,
    };
  } catch (error) {
    console.error("Failed to call AI model:", error);

    return {
      finalResult: {
        status: "not_okay",
        reason: "AI API Error",
      },
      defectBox: null,
      confidence: 0,
      anomalies: [],
      imageUrl: null,
    };
  }
}

export const useDetectionStore = create<DetectionState>()(
  devtools(
    (set, get) => ({
      selectedImage: null,
      selectedFile: null,
      isDetecting: false,
      isUploading: false,
      isCompressing: false,
      result: null,
      confidence: 0,
      defectBox: null,
      recentDetections: [],

      setFile: async (file: File) => {
        set({ isCompressing: true }, false, "setFile/start");

        const prev = get().selectedImage;
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);

        const compressed = await compressImage(file);
        const imageUrl = URL.createObjectURL(compressed);

        set(
          {
            selectedImage: imageUrl,
            selectedFile: compressed,
            isCompressing: false,
            result: null,
            defectBox: null,
            confidence: 0,
          },
          false,
          "setFile/done",
        );
      },

      runDetection: async (divisionId: string | null) => {
        const { selectedFile } = get();
        if (!selectedFile) return;

        const partId = `BG-${Math.floor(Math.random() * 9000) + 1000}`;

        try {
          set(
            {
              isDetecting: true,
              isUploading: false,
              result: null,
              defectBox: null,
            },
            false,
            "runDetection/start",
          );

          const {
            finalResult,
            defectBox,
            anomalies,
            confidence,
            imageUrl,
          } = await withTimeout(
            callAIModel(selectedFile),
            60000,
            "Merespon AI API memakan waktu terlalu lama (Timeout).",
          );

          set(
            {
              result: finalResult,
              defectBox,
              confidence,
              isDetecting: false,
              isUploading: false,
            },
            false,
            "runDetection/aiResult",
          );

          if (imageUrl) {
            try {
              const { saveInspection } = await import(
                "@/app/actions/database"
              );

              saveInspection({
                part_id: partId,
                division_id: divisionId,
                image_url: imageUrl,
                ai_result_status: finalResult.status,
                main_defect: finalResult.reason ?? "None",
                ai_confidence_score: confidence,
                anomalies,
              }).catch((err) =>
                console.error("Error background saving inspection:", err),
              );
            } catch (err) {
              console.error("Error loading database action:", err);
            }
          }

          set(
            (state) => ({
              recentDetections: [
                { id: partId, status: finalResult.status, time: "Just now" },
                ...state.recentDetections,
              ].slice(0, 3),
            }),
            false,
            "runDetection/updateRecent",
          );
        } catch (error: unknown) {
          console.error("Detection flow error:", error);
          const message =
            error instanceof Error
              ? error.message
              : "Terjadi kesalahan internal. Silakan coba lagi.";

          set(
            {
              isDetecting: false,
              isUploading: false,
              result: {
                status: "not_okay",
                reason: message,
              },
              confidence: 0,
              defectBox: null,
            },
            false,
            "runDetection/error",
          );
        }
      },

      setRecentDetections: (items: RecentDetection[]) =>
        set({ recentDetections: items }, false, "setRecentDetections"),

      reset: () => {
        const prev = get().selectedImage;
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);

        set(
          {
            selectedImage: null,
            selectedFile: null,
            result: null,
            defectBox: null,
            confidence: 0,
            isDetecting: false,
            isUploading: false,
            isCompressing: false,
          },
          false,
          "reset",
        );
      },
    }),
    { name: "detection-store" },
  ),
);
