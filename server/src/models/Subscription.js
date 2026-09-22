import { pool, withTransaction } from "../config/database.js";

export const isSubscribed = async (userId, channelId) => {
  const { rowCount } = await pool.query(
    "SELECT 1 FROM subscriptions WHERE user_id = $1 AND channel_id = $2",
    [userId, channelId],
  );
  return rowCount > 0;
};

export const subscribe = ({ userId, channelId }) =>
  withTransaction(async (client) => {
    const { rowCount } = await client.query(
      "INSERT INTO subscriptions (user_id, channel_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [userId, channelId],
    );
    if (rowCount === 1) {
      await client.query(
        "UPDATE channels SET subscriber_count = subscriber_count + 1 WHERE id = $1",
        [channelId],
      );
    }
  });

export const unsubscribe = ({ userId, channelId }) =>
  withTransaction(async (client) => {
    const { rowCount } = await client.query(
      "DELETE FROM subscriptions WHERE user_id = $1 AND channel_id = $2",
      [userId, channelId],
    );
    if (rowCount === 1) {
      await client.query(
        "UPDATE channels SET subscriber_count = GREATEST(subscriber_count - 1, 0) WHERE id = $1",
        [channelId],
      );
    }
  });

export const listMine = async (userId, { limit, offset }) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.handle, c.name, c.avatar_url, c.subscriber_count, s.created_at AS subscribed_at
     FROM subscriptions s JOIN channels c ON c.id = s.channel_id
     WHERE s.user_id = $1 ORDER BY s.created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit + 1, offset],
  );
  return { items: rows.slice(0, limit), hasNextPage: rows.length > limit };
};

export const toPublicSubscription = (row) => ({
  channel: {
    id: row.id,
    handle: row.handle,
    name: row.name,
    avatarUrl: row.avatar_url,
    subscriberCount: row.subscriber_count,
  },
  subscribedAt: row.subscribed_at,
});
