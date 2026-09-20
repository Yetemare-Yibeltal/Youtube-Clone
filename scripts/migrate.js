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
const command = process.argv[2] ?? "up";

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

const readSql = (file) => readFile(path.join(migrationsDir, file), "utf8");

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

  for (const name of pending) {
    console.log(`Applying ${name} ...`);
    await client.query(await readSql(`${name}.sql`));
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

  console.log(`Rolling back ${last} ...`);
  await client.query(await readSql(`${last}.down.sql`));
  await client.query("DELETE FROM schema_migrations WHERE name = $1", [last]);
  console.log(`Rolled back ${last}`);
};

const status = async () => {
  const applied = new Set(await getApplied());
  for (const name of await listMigrations()) {
    console.log(`${applied.has(name) ? "[x]" : "[ ]"} ${name}`);
  }
};

const commands = { up, down, status };

try {
  if (!commands[command])
    throw new Error(`Unknown command "${command}". Use: up | down | status`);
  await client.connect();
  await commands[command]();
} catch (error) {
  console.error(`Migration failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
