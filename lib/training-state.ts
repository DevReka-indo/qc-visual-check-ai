import type { ChildProcessWithoutNullStreams } from "child_process";

type TrainingStatus = "idle" | "running" | "finished" | "failed";

type TrainingState = {
  status: TrainingStatus;
  process: ChildProcessWithoutNullStreams | null;
  startedAt: string | null;
  finishedAt: string | null;
  exitCode: number | null;

  logs: string[];
  currentLogLine: string;

  progressPercent: number;
  progressText: string | null;
  currentEpoch: number | null;
  totalEpochs: number | null;

  datasetVersion: string | null;
  datasetUploadedAt: string | null;
  datasetFileName: string | null;
};

const globalForTraining = globalThis as unknown as {
  trainingState?: TrainingState;
};

export const trainingState =
  globalForTraining.trainingState ??
  (globalForTraining.trainingState = {
    status: "idle",
    process: null,
    startedAt: null,
    finishedAt: null,
    exitCode: null,

    logs: [],
    currentLogLine: "",

    progressPercent: 0,
    progressText: null,
    currentEpoch: null,
    totalEpochs: null,

    datasetVersion: null,
    datasetUploadedAt: null,
    datasetFileName: null,
  });

function stripAnsi(input: string) {
  return input
    .replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "")
    .replace(/�\[[0-?]*[ -/]*[@-~]/g, "");
}

function updateTrainingProgressFromLine(line: string) {
  // Contoh yang ditangkap:
  // "2/50"
  // "Epoch 2/50"
  // "      2/50      0G ..."
  const epochMatch = line.match(/(?:^|\s)(\d+)\/(\d+)(?:\s|$)/);

  if (!epochMatch) return;

  const currentEpoch = Number(epochMatch[1]);
  const totalEpochs = Number(epochMatch[2]);

  if (
    !Number.isFinite(currentEpoch) ||
    !Number.isFinite(totalEpochs) ||
    totalEpochs <= 0
  ) {
    return;
  }

  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((currentEpoch / totalEpochs) * 100)),
  );

  trainingState.currentEpoch = currentEpoch;
  trainingState.totalEpochs = totalEpochs;
  trainingState.progressPercent = progressPercent;
  trainingState.progressText = `Epoch ${currentEpoch}/${totalEpochs}`;
}

export function resetTrainingLogs() {
  trainingState.logs = [];
  trainingState.currentLogLine = "";

  trainingState.progressPercent = 0;
  trainingState.progressText = null;
  trainingState.currentEpoch = null;
  trainingState.totalEpochs = null;
}


export function appendTrainingLog(message: string) {
  const cleanMessage = stripAnsi(message);

  for (const char of cleanMessage) {
    if (char === "\r") {
      updateTrainingProgressFromLine(trainingState.currentLogLine);
      trainingState.currentLogLine = "";
      continue;
    }

    if (char === "\n") {
      updateTrainingProgressFromLine(trainingState.currentLogLine);
      trainingState.logs.push(trainingState.currentLogLine);
      trainingState.currentLogLine = "";
      continue;
    }

    trainingState.currentLogLine += char;
  }

  updateTrainingProgressFromLine(trainingState.currentLogLine);

  if (trainingState.logs.length > 5000) {
    trainingState.logs = trainingState.logs.slice(-5000);
  }
}

export function getTrainingLogsText() {
  const completedLogs = trainingState.logs.join("\n");

  if (!trainingState.currentLogLine) {
    return completedLogs;
  }

  if (!completedLogs) {
    return trainingState.currentLogLine;
  }

  return `${completedLogs}\n${trainingState.currentLogLine}`;
}