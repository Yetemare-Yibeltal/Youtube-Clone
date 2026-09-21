export const declaredTables = (sql) =>
  [...sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-z_][a-z0-9_]*)/gi)].map((match) =>
    match[1].toLowerCase(),
  );

// A file that opens a transaction but never commits was cut off mid-paste.
export const assertComplete = (sql, file) => {
  if (/\bBEGIN;/i.test(sql) && !/\bCOMMIT;/i.test(sql)) {
    throw new Error(`Migration file looks truncated (BEGIN without COMMIT): database/migrations/${file}`);
  }
};

// After a migration runs, every table it declares must actually exist.
export const verifyTables = async (client, name, sql) => {
  const expected = declaredTables(sql);
  if (expected.length === 0) return;

  const { rows } = await client.query(
    "SELECT table_name::text AS table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name::text = ANY($1::text[])",
    [expected],
  );
  const found = new Set(rows.map((row) => row.table_name));
  const missing = expected.filter((table) => !found.has(table));

  if (missing.length > 0) {
    throw new Error(`${name} ran but these tables do not exist: ${missing.join(', ')}`);
  }
};
