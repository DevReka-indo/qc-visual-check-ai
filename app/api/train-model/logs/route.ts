import { NextResponse } from "next/server";
import { trainingState } from "@/lib/training-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    logs: trainingState.logs.join(""),
  });
}