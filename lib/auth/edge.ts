import { jwtVerify } from "jose";
import { getJwtSecret } from "./config";
import type { JWTPayload } from "./jwt";

function getSecretKey() {
  return new TextEncoder().encode(getJwtSecret());
}

export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());

    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (error) {
    console.error("verifyTokenEdge failed:", error);
    return null;
  }
}