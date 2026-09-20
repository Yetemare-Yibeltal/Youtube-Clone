import { pool } from "../config/database.js";
import { buildUpdate } from "../utils/sql.js";

const db = (client) => client ?? pool;

const COLUMNS =
  "id, handle, name, description, avatar_url, banner_url, subscriber_count, created_at";

export const toPublicChannel = (row) =>
  row && {
    id: row.id,
    handle: row.handle,
    name: row.name,
    description: row.description,
    avatarUrl: row.avatar_url,
    bannerUrl: row.banner_url,
    subscriberCount: row.subscriber_count,
    createdAt: row.created_at,
  };

export const create = async ({ userId, handle, name }, client) => {
  const { rows } = await db(client).query(
    `INSERT INTO channels (user_id, handle, name) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
    [userId, handle, name],
  );
  return rows[0];
};

export const findByUserId = async (userId, client) => {
  const { rows } = await db(client).query(
    `SELECT ${COLUMNS} FROM channels WHERE user_id = $1`,
    [userId],
  );
  return rows[0] ?? null;
};

export const findByHandle = async (handle, client) => {
  const { rows } = await db(client).query(
    `SELECT ${COLUMNS} FROM channels WHERE handle = $1`,
    [handle],
  );
  return rows[0] ?? null;
};

export const handleTaken = async (handle, client) => {
  const { rowCount } = await db(client).query(
    "SELECT 1 FROM channels WHERE handle = $1",
    [handle],
  );
  return rowCount > 0;
};

export const updateByUserId = async (userId, changes, client) => {
  const { sets, values } = buildUpdate(changes, {
    handle: "handle",
    name: "name",
    description: "description",
    avatarUrl: "avatar_url",
    bannerUrl: "banner_url",
  });
  if (sets.length === 0) return findByUserId(userId, client);

  values.push(userId);
  const { rows } = await db(client).query(
    `UPDATE channels SET ${sets.join(", ")} WHERE user_id = $${values.length} RETURNING ${COLUMNS}`,
    values,
  );
  return rows[0] ?? null;
};
