import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "fs";
import { verifyToken } from "@/lib/auth";

const AVATARS_DIR = join(process.cwd(), "public", "avatars");
const AUTH_COOKIE_NAME = "auth-token";
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const payload = token ? verifyToken(token) : null;

    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: "Missing file or userId" },
        { status: 400 }
      );
    }

    if (payload.userId !== userId && payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 2MB limit" },
        { status: 400 }
      );
    }

    // Ensure avatars directory exists
    if (!existsSync(AVATARS_DIR)) {
      await mkdir(AVATARS_DIR, { recursive: true });
    }

    // Create filename
    const ext = "jpg";
    const timestamp = Date.now();
    const filename = `${userId}-${timestamp}.${ext}`;
    const filepath = join(AVATARS_DIR, filename);

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write to filesystem
    await writeFile(filepath, buffer);

    // Return public URL
    const publicUrl = `/avatars/${filename}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}
