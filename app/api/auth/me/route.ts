import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "auth-token";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        division: true,
      },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
    user: {
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        employee_id: user.employeeId,
        role: user.role,
        status: user.status,
        avatar_url: user.avatarUrl,
        division_id: user.divisionId,
        last_login: user.lastLogin?.toISOString() ?? null,
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString(),
        divisions: user.division
        ? {
            id: user.division.id,
            name: user.division.name,
            description: user.division.description,
            color_code: user.division.colorCode,
            created_at: user.division.createdAt.toISOString(),
            }
        : null,
    },
    });

  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}