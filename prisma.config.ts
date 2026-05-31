import * as fs from "fs";
import * as path from "path";
import "dotenv/config";
import { defineConfig } from "prisma/config";

// Load .env.local in addition to .env (dotenv/config only loads .env by default)
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
    // Only set if not already defined (don't override .env)
    if (!process.env[key]) process.env[key] = val;
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts",
  },
  datasource: {
    // Fallback to empty string so `prisma generate` works in CI without DATABASE_URL
    url: process.env.DATABASE_URL ?? "",
  },
});
