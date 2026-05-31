import "server-only";
import nodemailer from "nodemailer";

// ─── Transport ────────────────────────────────────────────────────────────────
// Reads SMTP config from env vars. Falls back to a safe no-op in dev when
// no SMTP credentials are configured (prevents crashes during local dev).
//
// For Railway deployment, set these env vars on the service:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
//
// For local dev without an SMTP server, leave them unset — emails are
// logged to the console instead of sent.

function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    // Return null — callers will fall back to console.log
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    secure: process.env.SMTP_PORT === "465",
    auth: { user, pass },
  });
}

// ─── Send ─────────────────────────────────────────────────────────────────────

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const from =
    process.env.SMTP_FROM ?? "B2B Sourcing Portal <no-reply@b2bsourcing.com>";

  const transport = createTransport();

  if (!transport) {
    // Dev fallback — log to console so you can inspect email content
    console.log("\n─── [EMAIL] ─────────────────────────────────────────────");
    console.log(`To:      ${opts.to}`);
    console.log(`From:    ${from}`);
    console.log(`Subject: ${opts.subject}`);
    console.log(`Body:    (HTML — ${opts.html.length} chars)`);
    console.log("─────────────────────────────────────────────────────────\n");
    return;
  }

  try {
    await transport.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
  } catch (err) {
    // Never crash the request because of email failure
    console.error("[email] Failed to send:", err);
  }
}

// ─── Admin email helper ───────────────────────────────────────────────────────
// Reads Simon's email from env. Falls back to a placeholder so the
// system works in dev without configuration.

export function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL ?? "simon@b2bsourcing.com";
}

export function getAdminName(): string {
  return process.env.ADMIN_NAME ?? "Simon";
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
