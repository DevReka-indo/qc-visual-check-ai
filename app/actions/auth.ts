"use server";

import prisma from "@/lib/prisma";
import {
  comparePassword,
  generateToken,
  hashPassword,
  validatePasswordStrength,
  verifyToken,
} from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const AUTH_COOKIE_NAME = "auth-token";
const AUTH_COOKIE_MAX_AGE = 24 * 60 * 60; // 24 hours

async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: "/",
  });
}

async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        fullName: true,
        role: true,
      },
    });

    if (!user) {
      return { error: "Invalid email or password" };
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return { error: "Invalid email or password" };
    }

    // Update last_login and status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        status: "online",
      },
    });

    // Generate JWT token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await setAuthCookie(token);
  } catch (error) {
    console.error("Sign in error:", error);
    return { error: "An error occurred during sign in" };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = formData.get("password") as string;
  const fullName = String(formData.get("fullName") ?? "").trim();
  const employeeId = String(formData.get("employeeId") ?? "").trim();

  if (!email || !password || !fullName) {
    return { error: "Email, password, and full name are required" };
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    return { error: passwordValidation.errors.join(", ") };
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return { error: "Email already in use" };
    }

    if (employeeId) {
      const existingEmployee = await prisma.user.findUnique({
        where: { employeeId },
      });

      if (existingEmployee) {
        return { error: "Employee ID already in use" };
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        employeeId: employeeId || null,
        role: "operator",
        status: "online",
        lastLogin: new Date(),
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    // Generate JWT token
    const token = await generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    await setAuthCookie(token);
  } catch (error) {
    console.error("Sign up error:", error);
    return { error: "An error occurred during sign up" };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const payload = token ? verifyToken(token) : null;

    await clearAuthCookie();

    if (payload) {
      await prisma.user.update({
        where: { id: payload.userId },
        data: { status: "offline" },
      });
    }
  } catch (error) {
    console.error("Sign out error:", error);
    return { error: "An error occurred during sign out" };
  }

  revalidatePath("/", "layout");
  redirect("/auth");
}

export async function updatePassword(currentPassword: string, newPassword: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return { error: "Not authenticated" };
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return { error: "Invalid session" };
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return { error: passwordValidation.errors.join(", ") };
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, password: true },
    });

    if (!user) {
      return { error: "User not found" };
    }

    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      return { error: "Current password is incorrect" };
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error) {
    console.error("Update password error:", error);
    return { error: "An error occurred while updating password" };
  }
}
