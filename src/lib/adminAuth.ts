import crypto from "crypto";

export const ADMIN_COOKIE = "saggy_admin";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export const ORDER_STATUSES = [
  "PENDING",
  "PAYMENT_CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
] as const;

export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;

export function adminEnabled(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function sessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function sign(value: string): string {
  return crypto.createHmac("sha256", sessionSecret()).update(value).digest("hex");
}

export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = crypto.createHash("sha256").update(input).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export function createSessionToken(): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return `v1.${expiresAt}.${sign(`admin:${expiresAt}`)}`;
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

export function isValidSessionToken(token?: string | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [version, expiresRaw, signature] = parts;
  if (version !== "v1") return false;
  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= 0) return false;
  if (expiresAt * 1000 < Date.now()) return false;
  return safeEqualHex(sign(`admin:${expiresAt}`), signature);
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
