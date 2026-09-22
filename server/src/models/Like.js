export const setCommentReaction = ({ userId, commentId, type }) =>
  withTransaction(async (client) => {
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended($1::text, 1))",
      [`${userId}:${commentId}`],
    );

    const { rows: previousRows } = await client.query(
      "SELECT type FROM comment_reactions WHERE user_id = $1 AND comment_id = $2",
      [userId, commentId],
    );
    const before = previousRows[0]?.type ?? null;

    if (before !== type) {
      if (type) {
        await client.query(
          `INSERT INTO comment_reactions (user_id, comment_id, type) VALUES ($1, $2, $3)
           ON CONFLICT (user_id, comment_id) DO UPDATE SET type = EXCLUDED.type, created_at = now()`,
          [userId, commentId, type],
        );
      } else {
        await client.query(
          "DELETE FROM comment_reactions WHERE user_id = $1 AND comment_id = $2",
          [userId, commentId],
        );
      }
      if (type === "like" || before === "like") {
        await client.query(
          "UPDATE comments SET like_count = like_count + $2 WHERE id = $1",
          [commentId, (type === "like") - (before === "like")],
        );
      }
    }

    const { rows } = await client.query(
      "SELECT like_count FROM comments WHERE id = $1",
      [commentId],
    );
    return { likeCount: rows[0].like_count, viewerReaction: type };
  });
