import { createRequire } from "node:module";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(
  new URL("../server/package.json", import.meta.url),
);
const pg = require("pg");
const dotenv = require("dotenv");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, "server", ".env"), quiet: true });

const migrationsDir = path.join(root, "database", "migrations");
const FILE_PATTERN = /^(\d+_[a-z0-9_]+)\.sql$/i; // does not match *.down.sql
const [command = "up", ...flags] = process.argv.slice(2);

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Create server/.env first.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true",
});

const listMigrations = async () =>
  (await readdir(migrationsDir))
    .map((file) => FILE_PATTERN.exec(file)?.[1])
    .filter(Boolean)
    .sort();

// Refuses missing or empty files, so a bad paste can never be recorded as "applied".
const readSql = async (file) => {
  let sql;
  try {
    sql = await readFile(path.join(migrationsDir, file), "utf8");
  } catch (error) {
    if (error.code === "ENOENT")
      throw new Error(`Migration file not found: database/migrations/${file}`);
    throw error;
  }
  const meaningful = sql
    .replace(/--.*$/gm, "")
    .replace(/\b(BEGIN|COMMIT);/gi, "")
    .trim();
  if (!meaningful)
    throw new Error(`Migration file is empty: database/migrations/${file}`);
  return sql;
};

const getApplied = async () => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
  const { rows } = await client.query(
    "SELECT name FROM schema_migrations ORDER BY name",
  );
  return rows.map((row) => row.name);
};

const up = async () => {
  const applied = new Set(await getApplied());
  const pending = (await listMigrations()).filter((name) => !applied.has(name));
  if (pending.length === 0)
    return console.log("Nothing to migrate. Database is up to date.");

  // Validate every pending file before running any of them.
  const scripts = [];
  for (const name of pending)
    scripts.push([name, await readSql(`${name}.sql`)]);

  for (const [name, sql] of scripts) {
    console.log(`Applying ${name} ...`);
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
      name,
    ]);
    console.log(`Applied  ${name}`);
  }
};

const down = async () => {
  const applied = await getApplied();
  const last = applied.at(-1);
  if (!last) return console.log("No applied migrations to roll back.");

  const sql = await readSql(`${last}.down.sql`);
  console.log(`Rolling back ${last} ...`);
  await client.query(sql);
  await client.query("DELETE FROM schema_migrations WHERE name = $1", [last]);
  console.log(`Rolled back ${last}`);
};

const status = async () => {
  const applied = new Set(await getApplied());
  for (const name of await listMigrations()) {
    console.log(`${applied.has(name) ? "[x]" : "[ ]"} ${name}`);
  }
};

const tables = async () => {
  const { rows } = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
  );
  console.log(
    rows.length ? rows.map((row) => row.table_name).join("\n") : "(no tables)",
  );
  console.log(`\n${rows.length} table(s)`);
};

// Development only: wipes everything in the database and starts clean.
const reset = async () => {
  if (process.env.NODE_ENV === "production")
    throw new Error("Refusing to reset a production database.");
  if (!flags.includes("--yes")) {
    const host = new URL(process.env.DATABASE_URL).hostname;
    throw new Error(
      `reset deletes ALL data in ${host}. Re-run with --yes to confirm.`,
    );
  }
  await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  console.log("Schema reset. Now run: npm run db:migrate");
};

const commands = { up, down, status, tables, reset };

const describeError = (error) => {
  const nested = (error.errors ?? []).map(
    (e) => `${e.address}:${e.port} ${e.code}`,
  );
  const text = [error.message, error.code, ...nested]
    .filter(Boolean)
    .join(" | ");
  const refused =
    error.code === "ECONNREFUSED" ||
    (error.errors ?? []).some((e) => e.code === "ECONNREFUSED");
  return refused
    ? `${text}\nPostgreSQL is not reachable. Start it and check DATABASE_URL in server/.env.`
    : text;
};

try {
  if (!commands[command])
    throw new Error(
      `Unknown command "${command}". Use: up | down | status | tables | reset`,
    );
  await client.connect();
  await commands[command]();
} catch (error) {
  console.error(`Migration failed: ${describeError(error)}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
