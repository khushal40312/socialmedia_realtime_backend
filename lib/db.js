import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Ensure your Render DB URL is correct
    },
  },
  log: ["query", "info", "warn", "error"], // Logs queries for debugging
});

async function reconnectPrisma() {
  try {
    await prismaClient.$disconnect(); // Close any existing connection
    await prismaClient.$connect(); // Reconnect
    console.log("🔄 Prisma reconnected successfully");
  } catch (error) {
    console.error("⚠️ Prisma reconnection failed:", error);
  }
}

// Automatically reconnect Prisma before each query
prismaClient.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error) {
    if (error.code === "26000") {
      console.warn("⚠️ Detected stale Prisma connection. Reconnecting...");
      await reconnectPrisma();
      return next(params); // Retry the request
    }
    throw error;
  }
});

export { prismaClient, reconnectPrisma };
