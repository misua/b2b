import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma v7 requires a driver adapter — the DATABASE_URL is no longer embedded in the schema.
// We use @prisma/adapter-pg which wraps the standard `pg` pool.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

/**
 * Lazily instantiate Prisma on first access via a Proxy.
 *
 * IMPORTANT: We must NOT call createPrismaClient() at module load time.
 * During `next build`, Next.js evaluates route modules to collect page data,
 * and DATABASE_URL may be unset in the build environment. Instantiating Prisma
 * eagerly would throw and crash the build. The Proxy defers creation until the
 * first actual database access (request time).
 */
function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = client[prop as keyof PrismaClient];
    // Bind methods so `this` resolves correctly
    return typeof value === "function" ? value.bind(client) : value;
  },
});
