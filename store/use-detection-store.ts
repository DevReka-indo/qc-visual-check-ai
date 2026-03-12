"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── State & Actions interface ────────────────────────────────────────────────

interface DetectionState {
  // Image
  selectedImage: string | null; // blob URL for preview
  selectedFile: File | null; // actual File for storage upload

  // Detection state
  isDetecting: boolean;
  isUploading: boolean;
  isCompressing: boolean;
  result: DetectionResult | null;
  confidence: number;
  defectBox: BoundingBox | null;

  // Sidebar recent list
  recentDetections: RecentDetection[];

  // Actions
  setFile: (file: File) => Promise<void>;
  runDetection: (divisionId: string | null) => Promise<void>;
  setRecentDetections: (items: RecentDetection[]) => void;
  reset: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function compressImage(file: File): Promise<File> {
  try {
    const imageCompression = (await import("browser-image-compression")).default;
    const options = {
      maxSizeMB: 1, // Max 1MB after compression
      maxWidthOrHeight: 1280,
      useWebWorker: true,
    };
    return await imageCompression(file, options);
  } catch (error) {
    console.error("Compression error:", error);
    return file; // Fallback to original if compression fails
  }
}

async function uploadToStorage(
  file: File,
  partId: string,
): Promise<string | null> {
  try {
    const { createClient } = await import("@/utils/supabase/client");
    const supabase = createClient();

    const ext = file.name.split(".").pop() ?? "jpg";
    const fileName = `inspections/${Date.now()}-${partId}.${ext}`;

    const { data, error } = await supabase.storage
      .from("inspection_images")
      .upload(fileName, file, { contentType: file.type, upsert: false });

    if (error || !data) {
      console.error("Storage upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("inspection_images")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err) {
    console.error("Unexpected upload error:", err);
    return null;
  }
}

async function callAIModel(file: File): Promise<{
  finalResult: DetectionResult;
  defectBox: BoundingBox | null;
  anomalies: AnomalyPayload[];
  confidence: number;
}> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:8000/api/predict", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`AI Backend returned ${res.status}`);
    }

    const json = await res.json();
    
    // As in prompt: {"success": true, "data": {"label": "baret", "confidence": 0.95}}
    const label = json.data?.label || "normal";
    // Convert 0.95 to 95.0
    const confidence = parseFloat(((json.data?.confidence || 0) * 100).toFixed(1));
    
    const isOkay = label.toLowerCase() === "normal";

    if (isOkay) {
      return { finalResult: { status: "okay" }, defectBox: null, anomalies: [], confidence };
    }

    // Default box for visualization since simple API may not provide bbox
    const box: BoundingBox = { top: 30, left: 30, width: 20, height: 20 };

    return {
      finalResult: { status: "not_okay", reason: label },
      defectBox: box,
      confidence,
      anomalies: [
        {
          defect_type: label,
          location: "Visual Surface",
          description: `AI detected anomaly: ${label}`,
          confidence_score: confidence,
          bounding_box: box as Record<string, unknown>,
        },
      ],
    };
  } catch (error) {
    console.error("Failed to call AI model:", error);
    // Fallback if AI fails
    return {
      finalResult: { status: "not_okay", reason: "AI API Error" },
      defectBox: null,
      confidence: 0,
      anomalies: [],
    };
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useDetectionStore = create<DetectionState>()(
  devtools(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────
      selectedImage: null,
      selectedFile: null,
      isDetecting: false,
      isUploading: false,
      isCompressing: false,
      result: null,
      confidence: 0,
      defectBox: null,
      recentDetections: [],

      // ── setFile ────────────────────────────────────────
      // Called when user selects / drops an image file
      setFile: async (file: File) => {
        set({ isCompressing: true }, false, "setFile/start");

        // Revoke previous blob URL to avoid memory leaks
        const prev = get().selectedImage;
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);

        // Auto-compress before setting
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

      // ── runDetection ───────────────────────────────────
      // Full detection flow: upload → simulate AI → save → update recent list
      runDetection: async (divisionId: string | null) => {
        const { selectedFile } = get();
        if (!selectedFile) return;

        const partId = `BG-${Math.floor(Math.random() * 9000) + 1000}`;

        // Step 1: Start uploading
        set(
          { isDetecting: true, isUploading: true, result: null, defectBox: null },
          false,
          "runDetection/start",
        );

        // Step 2: Upload image to Supabase Storage
        const imageUrl = await uploadToStorage(selectedFile, partId);
        set({ isUploading: false }, false, "runDetection/uploadDone");

        // Step 3: Call AI API Endpoint
        const { finalResult, defectBox, anomalies, confidence } = await callAIModel(selectedFile);

        set(
          {
            result: finalResult,
            defectBox,
            confidence,
            isDetecting: false,
          },
          false,
          "runDetection/aiResult",
        );

        // Step 4: Persist result to Supabase
        if (imageUrl) {
          try {
            const { saveInspection } = await import(
              "@/app/actions/database"
            );
            await saveInspection({
              part_id: partId,
              division_id: divisionId,
              image_url: imageUrl,
              ai_result_status: finalResult.status,
              main_defect: finalResult.reason ?? "None",
              ai_confidence_score: confidence,
              anomalies,
            });
          } catch (err) {
            console.error("Error saving inspection:", err);
          }
        }

        // Step 5: Prepend to recent detections list
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
      },

      // ── setRecentDetections ────────────────────────────
      setRecentDetections: (items: RecentDetection[]) =>
        set({ recentDetections: items }, false, "setRecentDetections"),

      // ── reset ──────────────────────────────────────────
      // Clears the workspace (Clear button)
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
