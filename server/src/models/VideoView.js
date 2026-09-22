import { pool } from "../config/database.js";

export const record = async ({ videoId, userId, viewerHash }) => {
  const { rows } = await pool.query(
    `WITH ins AS (
       INSERT INTO video_views (video_id, user_id, viewer_hash)
       SELECT $1::uuid, $2::uuid, $3::text
       WHERE NOT EXISTS (
         SELECT 1 FROM video_views
         WHERE video_id = $1::uuid AND viewer_hash = $3::text
           AND created_at > now() - interval '30 minutes')
       RETURNING 1)
     UPDATE videos SET view_count = view_count + 1
     WHERE id = $1::uuid AND EXISTS (SELECT 1 FROM ins)
     RETURNING view_count`,
    [videoId, userId, viewerHash],
  );
  return rows[0]?.view_count ?? null;
};
