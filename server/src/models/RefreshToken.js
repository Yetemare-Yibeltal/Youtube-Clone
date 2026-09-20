import { pool } from "../config/database.js";

const db = (client) => client ?? pool;

export const create = async (
  { userId, tokenHash, expiresAt, userAgent, ip },
  client,
) => {
  await db(client).query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, expiresAt, userAgent ?? null, ip ?? null],
  );
};

export const findByHash = async (tokenHash, client) => {
  const { rows } = await db(client).query(
    "SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1",
    [tokenHash],
  );
  return rows[0] ?? null;
};

// Returns true only for the request that actually flipped the token, so rotation is atomic.
export const revoke = async (id, client) => {
  const { rowCount } = await db(client).query(
    "UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL",
    [id],
  );
  return rowCount === 1;
};

export const revokeByHash = (tokenHash, client) =>
  db(client).query(
    "UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL",
    [tokenHash],
  );

export const revokeAllForUser = (userId, client) =>
  db(client).query(
    "UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL",
    [userId],
  );
