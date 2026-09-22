import { pool } from "../config/database.js";
import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary.js";
import { ApiError } from "../utils/apiError.js";
import { buildUpdate } from "../utils/sql.js";

const db = (client) => client ?? pool;

const COLUMNS = `
  v.id, v.title, v.description, v.video_url, v.cloudinary_public_id, v.thumbnail_url,
  v.duration_seconds, v.is_short, v.status, v.visibility, v.category, v.tags, v.view_count,
  v.like_count, v.dislike_count, v.comment_count, v.published_at, v.created_at, v.channel_id,
  c.handle AS channel_handle, c.name AS channel_name, c.avatar_url AS channel_avatar,
  to_char(v.published_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_ts`;

const FROM = "FROM videos v JOIN channels c ON c.id = v.channel_id";
const PUBLIC =
  "v.status = 'ready' AND v.visibility = 'public' AND v.deleted_at IS NULL";

const hlsUrl = (publicId) =>
  isCloudinaryConfigured && publicId
    ? cloudinary.url(publicId, {
        resource_type: "video",
        streaming_profile: "auto",
        format: "m3u8",
        secure: true,
      })
    : null;

export const toPublicVideo = (row) =>
  row && {
    id: row.id,
    title: row.title,
    description: row.description,
    videoUrl: row.video_url,
    hlsUrl: hlsUrl(row.cloudinary_public_id),
    thumbnailUrl: row.thumbnail_url,
    durationSeconds: row.duration_seconds,
    isShort: row.is_short,
    status: row.status,
    visibility: row.visibility,
    category: row.category,
    tags: row.tags,
    viewCount: row.view_count,
    likeCount: row.like_count,
    dislikeCount: row.dislike_count,
    commentCount: row.comment_count,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    viewerReaction: row.viewer_reaction ?? null,
    channel: {
      id: row.channel_id,
      handle: row.channel_handle,
      name: row.channel_name,
      avatarUrl: row.channel_avatar,
    },
  };

const encodeCursor = (row) =>
  Buffer.from(`${row.cursor_ts}|${row.id}`).toString("base64url");

const decodeCursor = (cursor) => {
  if (!cursor) return [null, null];
  const [ts, id] = Buffer.from(cursor, "base64url").toString().split("|");
  if (
    !ts ||
    !id ||
    Number.isNaN(Date.parse(ts)) ||
    !/^[0-9a-f-]{36}$/i.test(id)
  ) {
    throw ApiError.badRequest("Invalid cursor");
  }
  return [ts, id];
};

export const create = async (data, client) => {
  const { rows } = await db(client).query(
    `INSERT INTO videos (channel_id, title, description, video_url, cloudinary_public_id, thumbnail_url,
       duration_seconds, is_short, status, visibility, category, tags, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ready', $9, $10, $11, now())
     RETURNING id`,
    [
      data.channelId,
      data.title,
      data.description,
      data.videoUrl,
      data.publicId,
      data.thumbnailUrl,
      data.durationSeconds,
      data.isShort,
      data.visibility,
      data.category ?? null,
      data.tags,
    ],
  );
  return rows[0].id;
};

export const publicIdExists = async (publicId) => {
  const { rowCount } = await pool.query(
    "SELECT 1 FROM videos WHERE cloudinary_public_id = $1",
    [publicId],
  );
  return rowCount > 0;
};

export const findById = async (id, viewerId = null) => {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS}, c.user_id AS owner_id,
       (SELECT r.type FROM video_reactions r WHERE r.video_id = v.id AND r.user_id = $2::uuid) AS viewer_reaction
     ${FROM}
     WHERE v.id = $1 AND v.deleted_at IS NULL`,
    [id, viewerId],
  );
  return rows[0] ?? null;
};

export const update = async (id, changes) => {
  const { sets, values } = buildUpdate(changes, {
    title: "title",
    description: "description",
    visibility: "visibility",
    category: "category",
    tags: "tags",
    publishedAt: "published_at",
  });
  if (sets.length === 0) return;
  values.push(id);
  await pool.query(
    `UPDATE videos SET ${sets.join(", ")} WHERE id = $${values.length}`,
    values,
  );
};

export const softDelete = (id) =>
  pool.query(
    "UPDATE videos SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL",
    [id],
  );

export const listFeed = async ({
  cursor,
  limit,
  category,
  channelHandle,
  isShort,
}) => {
  const params = [];
  const where = [PUBLIC, `v.is_short = ${isShort ? "true" : "false"}`];

  if (category) {
    params.push(category);
    where.push(`v.category = $${params.length}`);
  }
  if (channelHandle) {
    params.push(channelHandle);
    where.push(`c.handle = $${params.length}`);
  }
  const [ts, id] = decodeCursor(cursor);
  if (ts) {
    params.push(ts, id);
    where.push(
      `(v.published_at, v.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`,
    );
  }
  params.push(limit + 1);

  const { rows } = await pool.query(
    `SELECT ${COLUMNS} ${FROM} WHERE ${where.join(" AND ")}
     ORDER BY v.published_at DESC, v.id DESC LIMIT $${params.length}`,
    params,
  );
  const items = rows.slice(0, limit);
  return {
    items,
    nextCursor: rows.length > limit ? encodeCursor(items.at(-1)) : null,
  };
};

export const listTrending = async (limit) => {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} ${FROM} WHERE ${PUBLIC} AND v.is_short = false
     ORDER BY v.view_count DESC, v.id DESC LIMIT $1`,
    [limit],
  );
  return rows;
};

export const search = async ({ q, limit, offset }) => {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS}, ts_rank(v.search_vector, query) AS rank
     ${FROM}, websearch_to_tsquery('english', $1) query
     WHERE ${PUBLIC} AND v.search_vector @@ query
     ORDER BY rank DESC, v.published_at DESC, v.id DESC
     LIMIT $2 OFFSET $3`,
    [q, limit + 1, offset],
  );
  return { items: rows.slice(0, limit), hasNextPage: rows.length > limit };
};

export const listByOwner = async (userId, { limit, offset }) => {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} ${FROM}
     WHERE c.user_id = $1 AND v.deleted_at IS NULL
     ORDER BY v.created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit + 1, offset],
  );
  return { items: rows.slice(0, limit), hasNextPage: rows.length > limit };
};
