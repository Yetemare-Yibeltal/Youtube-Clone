import app from "./app.js";
import { env } from "./config/environment.js";
import { pool, closePool } from "./config/database.js";
import { logger } from "./utils/logger.js";

const start = async () => {
  await pool.query("SELECT 1");
  logger.info("Connected to PostgreSQL");

  const server = app.listen(env.PORT, () => {
    logger.info(
      `API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`,
    );
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

process.on("unhandledRejection", (reason) => {
  logger.error(
    "Unhandled promise rejection",
    reason instanceof Error ? reason : new Error(String(reason)),
  );
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", error);
  process.exit(1);
});

start().catch((error) => {
  const refused =
    error.code === "ECONNREFUSED" ||
    error.errors?.some((e) => e.code === "ECONNREFUSED");
  if (refused) {
    logger.error(
      "Cannot reach PostgreSQL. Start the database and check DATABASE_URL in server/.env",
    );
  } else {
    logger.error("Failed to start server", error);
  }
  process.exit(1);
});