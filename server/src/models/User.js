import { pool } from "../config/database.js";
import { buildUpdate } from "../utils/sql.js";

const db = (client) => client ?? pool;

const PUBLIC_COLUMNS =
  "id, email, display_name, avatar_url, role, email_verified_at, is_active, created_at";

export const toPublicUser = (row) =>
  row && {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    emailVerified: Boolean(row.email_verified_at),
    createdAt: row.created_at,
  };

export const findById = async (id, client) => {
  const { rows } = await db(client).query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
};

export const findByEmailWithPassword = async (email, client) => {
  const { rows } = await db(client).query(
    `SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE email = $1`,
    [email],
  );
  return rows[0] ?? null;
};

export const getPasswordHash = async (id, client) => {
  const { rows } = await db(client).query(
    "SELECT password_hash FROM users WHERE id = $1",
    [id],
  );
  return rows[0]?.password_hash ?? null;
};

export const create = async ({ email, passwordHash, displayName }, client) => {
  const { rows } = await db(client).query(
    `INSERT INTO users (email, password_hash, display_name)
     VALUES ($1, $2, $3)
     RETURNING ${PUBLIC_COLUMNS}`,
    [email, passwordHash, displayName],
  );
  return rows[0];
};

export const updatePassword = (id, passwordHash, client) =>
  db(client).query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    passwordHash,
    id,
  ]);

export const markEmailVerified = (id, client) =>
  db(client).query(
    "UPDATE users SET email_verified_at = COALESCE(email_verified_at, now()) WHERE id = $1",
    [id],
  );

export const touchLastLogin = (id, client) =>
  db(client).query("UPDATE users SET last_login_at = now() WHERE id = $1", [
    id,
  ]);

export const updateProfile = async (id, changes, client) => {
  const { sets, values } = buildUpdate(changes, {
    displayName: "display_name",
    avatarUrl: "avatar_url",
  });
  if (sets.length === 0) return findById(id, client);

  values.push(id);
  const { rows } = await db(client).query(
    `UPDATE users SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING ${PUBLIC_COLUMNS}`,
    values,
  );
  return rows[0] ?? null;
};

export const deleteById = async (id, client) => {
  const { rowCount } = await db(client).query(
    "DELETE FROM users WHERE id = $1",
    [id],
  );
  return rowCount === 1;
};
