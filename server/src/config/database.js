import pg from "pg";
import { env } from "./environment.js";
import { logger } from "../utils/logger.js";

// bigint (int8) columns such as view_count come back as numbers instead of strings.
pg.types.setTypeParser(20, (value) => Number(value));

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: env.DATABASE_SSL,
});

pool.on("error", (error) =>
  logger.error("Unexpected PostgreSQL pool error", error),
);

export const query = (text, params) => pool.query(text, params);

export const withTransaction = async (work) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      logger.error("Transaction rollback failed", rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
};

export const closePool = () => pool.end();
