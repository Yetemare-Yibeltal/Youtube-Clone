import { pool, withTransaction } from "../config/database.js";
import { ApiError } from "../utils/apiError.js";

const COLUMNS = `
  cm.id, cm.video_id, cm.user_id, cm.parent_id, cm.body, cm.like_count, cm.reply_count,
  cm.is_edited, cm.created_at, cm.updated_at,
  u.display_name AS author_name, u.avatar_url AS author_avatar,
  to_char(cm.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_ts`;

const FROM = "FROM comments cm JOIN users u ON u.id = cm.user_id";

export const toPublicComment = (row) =>
  row && {
    id: row.id,
    videoId: row.video_id,
    parentId: row.parent_id,
    body: row.body,
    likeCount: row.like_count,
    replyCount: row.reply_count,
    isEdited: row.is_edited,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    viewerReaction: row.viewer_reaction ?? null,
    author: {
      id: row.user_id,
      displayName: row.author_name,
      avatarUrl: row.author_avatar,
    },
  };

const encodeCursor = (row) =>
  Buffer.from(`${row.cursor_ts}|${row.id}`).toString("base64url");

const decodeCursor = (cursor) => {
  if (!cursor) return [null, null];
  const [ts, id] = Buffer.from(cursor, "base64url").toString().split("|");
  if (!ts || !id || Number.isNaN(Date.parse(ts)))
    throw ApiError.badRequest("Invalid cursor");
  return [ts, id];
};

export const findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} ${FROM} WHERE cm.id = $1 AND cm.deleted_at IS NULL`,
    [id],
  );
  return rows[0] ?? null;
};

// One reply level: a reply's parent must itself be a top-level comment.
const assertValidParent = async (client, videoId, parentId) => {
  if (!parentId) return;
  const { rows } = await client.query(
    "SELECT parent_id FROM comments WHERE id = $1 AND video_id = $2 AND deleted_at IS NULL",
    [parentId, videoId],
  );
  if (!rows[0]) throw ApiError.badRequest("Parent comment not found");
  if (rows[0].parent_id)
    throw ApiError.badRequest("Replies can only be one level deep", {
      code: "NESTING_LIMIT",
    });
};

export const create = ({ videoId, userId, parentId, body }) =>
  withTransaction(async (client) => {
    await assertValidParent(client, videoId, parentId);

    const { rows } = await client.query(
      `INSERT INTO comments (video_id, user_id, parent_id, body) VALUES ($1, $2, $3, $4) RETURNING id`,
      [videoId, userId, parentId ?? null, body],
    );
    await client.query(
      "UPDATE videos SET comment_count = comment_count + 1 WHERE id = $1",
      [videoId],
    );
    if (parentId)
      await client.query(
        "UPDATE comments SET reply_count = reply_count + 1 WHERE id = $1",
        [parentId],
      );

    return rows[0].id;
  });

export const update = async (id, body) => {
  const { rowCount } = await pool.query(
    "UPDATE comments SET body = $1, is_edited = true WHERE id = $2 AND deleted_at IS NULL",
    [body, id],
  );
  return rowCount === 1;
};

export const softDelete = (id, videoId) =>
  withTransaction(async (client) => {
    const { rows } = await client.query(
      "UPDATE comments SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING parent_id",
      [id],
    );
    if (!rows[0]) return false;

    await client.query(
      "UPDATE videos SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = $1",
      [videoId],
    );
    if (rows[0].parent_id) {
      await client.query(
        "UPDATE comments SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = $1",
        [rows[0].parent_id],
      );
    }
    return true;
  });

export const listTopLevel = async (
  videoId,
  { cursor, limit, sort, viewerId },
) => {
  const params = [videoId, viewerId];
  const where = [
    "cm.video_id = $1",
    "cm.parent_id IS NULL",
    "cm.deleted_at IS NULL",
  ];

  const [ts, id] = decodeCursor(cursor);
  if (ts) {
    params.push(ts, id);
    const cmp = sort === "top" ? "cm.like_count" : "cm.created_at";
    where.push(
      `(${cmp}, cm.id) < ($${params.length - 1}::${sort === "top" ? "int" : "timestamptz"}, $${params.length}::uuid)`,
    );
  }
  params.push(limit + 1);

  const order =
    sort === "top"
      ? "cm.like_count DESC, cm.id DESC"
      : "cm.created_at DESC, cm.id DESC";
  const { rows } = await pool.query(
    `SELECT ${COLUMNS}, (SELECT r.type FROM comment_reactions r WHERE r.comment_id = cm.id AND r.user_id = $2::uuid) AS viewer_reaction
     ${FROM} WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT $${params.length}`,
    params,
  );
  const items = rows.slice(0, limit);
  return {
    items,
    nextCursor: rows.length > limit ? encodeCursor(items.at(-1)) : null,
  };
};

export const listReplies = async (parentId, viewerId) => {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS}, (SELECT r.type FROM comment_reactions r WHERE r.comment_id = cm.id AND r.user_id = $2::uuid) AS viewer_reaction
     ${FROM} WHERE cm.parent_id = $1 AND cm.deleted_at IS NULL ORDER BY cm.created_at ASC`,
    [parentId, viewerId],
  );
  return rows;
};
