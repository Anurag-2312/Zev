import { PrismaClient } from "@prisma/client";

// Next's dev server re-evaluates modules on every hot reload. Without the
// global, each reload opens a fresh connection pool and Neon runs out.
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
