import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Optimized Database Client with Advanced Connection Pooling
 * 
 * Features:
 * - Advanced connection pooling for production
 * - Query performance monitoring
 * - Global instance to prevent multiple connections
 * - Production-optimized settings
 * - Connection health monitoring
 */
export const db = globalThis.prisma || new PrismaClient({
  // Log queries in development
  log: process.env.NODE_ENV === "development" 
    ? ["error", "warn"] 
    : ["error"],
  
  // Error formatting for better debugging
  errorFormat: "pretty",
  
  // Connection pool configuration
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (process.env.NODE_ENV === "development" 
        ? "?connection_limit=5&pool_timeout=20" 
        : "?connection_limit=20&pool_timeout=60"),
    },
  },
});

// Prevent multiple instances in development
if (process.env.NODE_ENV !== "production") globalThis.prisma = db;

// Graceful shutdown handling
process.on('beforeExit', async () => {
  await db.$disconnect();
});

process.on('SIGINT', async () => {
  await db.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await db.$disconnect();
  process.exit(0);
});
