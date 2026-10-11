/**
 * Prisma Client singleton.
 *
 * In development, Next.js hot-reload creates new module instances on each
 * reload, which would create multiple PrismaClient connections and exhaust
 * the connection pool. We store the instance on the global object to reuse
 * it across hot reloads.
 *
 * In production, module caching ensures a single instance is used.
 *
 * See: https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */
import { PrismaClient } from "@prisma/client";
import logger from "@/lib/logger";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.APP_ENVIRONMENT === "development"
        ? [
            { emit: "event", level: "query" },
            { emit: "event", level: "error" },
            { emit: "event", level: "warn" },
          ]
        : [
            { emit: "event", level: "error" },
            { emit: "event", level: "warn" },
          ],
  });

// Log slow queries in development (> 1000ms).
// This helps catch N+1 queries and missing indexes early.
if (process.env.APP_ENVIRONMENT === "development") {
  prisma.$on("query" as never, (e: { query: string; duration: number }) => {
    if (e.duration > 1000) {
      logger.warn({ query: e.query, duration: e.duration }, "Slow database query detected");
    }
  });
}

prisma.$on("error" as never, (e: { message: string }) => {
  logger.error({ message: e.message }, "Prisma client error");
});

if (process.env.APP_ENVIRONMENT !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
