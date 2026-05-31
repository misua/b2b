import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

// Load .env.local for local development
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^"|"$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 12;

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Admin user ────────────────────────────────────────────────────────────
  // In production (Railway): set these env vars in your Railway service variables
  //   ADMIN_SEED_EMAIL    e.g. bisdak.dev@gmail.com
  //   ADMIN_SEED_NAME     e.g. Charles
  //   ADMIN_SEED_PASSWORD e.g. YourSecurePassword
  //
  // In local dev: falls back to the hardcoded values below (safe — not in production)

  const adminEmail = process.env.ADMIN_SEED_EMAIL ?? "simon@b2bsourcing.com";
  const adminName = process.env.ADMIN_SEED_NAME ?? "Simon Tan";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? "Admin@1234";

  const hashedAdmin = await bcrypt.hash(adminPassword, SALT_ROUNDS);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: adminName },
    create: {
      email: adminEmail,
      password: hashedAdmin,
      name: adminName,
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // ─── Test client user (local dev only) ────────────────────────────────────
  // Skipped in production if SKIP_TEST_USERS=true
  if (process.env.SKIP_TEST_USERS !== "true") {
    const clientPassword = await bcrypt.hash("Client@1234", SALT_ROUNDS);
    const client = await prisma.user.upsert({
      where: { email: "client@example.com" },
      update: {},
      create: {
        email: "client@example.com",
        password: clientPassword,
        name: "Alex Wong",
        role: "CLIENT",
      },
    });
    console.log(`✅ Test client: ${client.email}`);
  }

  console.log("\n📋 Credentials:");
  console.log(`  Admin  → ${adminEmail} / [ADMIN_SEED_PASSWORD]`);
  if (process.env.SKIP_TEST_USERS !== "true") {
    console.log("  Client → client@example.com / Client@1234");
  }
  console.log("\n✨ Seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
