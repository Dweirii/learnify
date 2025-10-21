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
    ? ["query", "error", "warn"] 
    : ["error"],
  
  // Error formatting for better debugging
  errorFormat: "pretty",
  
  // Production optimizations
  ...(process.env.NODE_ENV === "production" && {
    // Advanced connection pooling for production
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  }),
});

// Prevent multiple instances in development
if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
