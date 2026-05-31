import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SessionPayload } from "@/lib/definitions";

const SESSION_COOKIE = "b2b_session";

/**
 * Lazily resolve and encode the session secret.
 *
 * IMPORTANT: This must NOT run at module load time. During `next build`,
 * Next.js evaluates every route's modules to collect page data, and build
 * environments may not have SESSION_SECRET set. Throwing at import time
 * crashes the entire build. By deferring the check to actual function calls
 * (request time), the build succeeds and we only fail if the secret is
 * genuinely missing when a session operation is attempted.
 */
function getEncodedKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set.");
  }
  return new TextEncoder().encode(secret);
}

// ─── Encrypt / Decrypt ────────────────────────────────────────────────────────

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getEncodedKey());
}

export async function decrypt(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

export async function createSession(payload: SessionPayload): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = await encrypt({ ...payload, expiresAt });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function deleteSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return decrypt(token);
}

// ─── Auth guard ───────────────────────────────────────────────────────────────

/**
 * Verifies the current session and returns the payload.
 * Redirects to /login if the session is missing or invalid.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Verifies the current session AND asserts the user has the ADMIN role.
 * Redirects to /unauthorized if the role check fails.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role !== "ADMIN") redirect("/unauthorized");
  return session;
}

/**
 * Verifies the current session AND asserts the user has the CLIENT role.
 * Redirects to /unauthorized if the role check fails.
 */
export async function requireClient(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role !== "CLIENT") redirect("/unauthorized");
  return session;
}
