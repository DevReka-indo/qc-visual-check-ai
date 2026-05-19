export const DEFAULT_JWT_EXPIRES_IN = "24h";

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }

  return secret;
}