import { pool } from "../config/database.js";

const db = (client) => client ?? pool;

// Issuing a new token invalidates any earlier unused token of the same purpose.
export const issue = async (
  { userId, purpose, tokenHash, expiresAt },
  client,
) => {
  await db(client).query(
    "UPDATE user_tokens SET used_at = now() WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL",
    [userId, purpose],
  );
  await db(client).query(
    "INSERT INTO user_tokens (user_id, purpose, token_hash, expires_at) VALUES ($1, $2, $3, $4)",
    [userId, purpose, tokenHash, expiresAt],
  );
};

// Single-use: returns the user id if the token was valid, otherwise null.
export const consume = async (purpose, tokenHash, client) => {
  const { rows } = await db(client).query(
    `UPDATE user_tokens SET used_at = now()
     WHERE token_hash = $1 AND purpose = $2 AND used_at IS NULL AND expires_at > now()
     RETURNING user_id`,
    [tokenHash, purpose],
  );
  return rows[0]?.user_id ?? null;
};
