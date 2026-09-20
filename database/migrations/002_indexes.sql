-- 002_indexes.sql
-- Query-driven indexes. Partial indexes keep hot paths small.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- users
CREATE INDEX users_staff_idx   ON users (role) WHERE role <> 'user';
CREATE INDEX users_created_idx ON users (created_at DESC);

-- channels
CREATE INDEX channels_name_trgm_idx ON channels USING gin (name gin_trgm_ops);

-- videos
CREATE INDEX videos_feed_idx ON videos (published_at DESC, id DESC)
  WHERE status = 'ready' AND visibility = 'public' AND deleted_at IS NULL AND is_short = false;
CREATE INDEX videos_shorts_idx ON videos (published_at DESC, id DESC)
  WHERE status = 'ready' AND visibility = 'public' AND deleted_at IS NULL AND is_short = true;
CREATE INDEX videos_trending_idx ON videos (view_count DESC, id DESC)
  WHERE status = 'ready' AND visibility = 'public' AND deleted_at IS NULL;
CREATE INDEX videos_channel_idx ON videos (channel_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX videos_category_idx ON videos (category, published_at DESC)
  WHERE status = 'ready' AND visibility = 'public' AND deleted_at IS NULL AND category IS NOT NULL;
CREATE INDEX videos_search_idx ON videos USING gin (search_vector);
CREATE INDEX videos_tags_idx   ON videos USING gin (tags);
CREATE INDEX videos_processing_idx ON videos (created_at) WHERE status = 'processing';

-- video_views
CREATE INDEX video_views_video_time_idx ON video_views (video_id, created_at DESC);
CREATE INDEX video_views_dedupe_idx ON video_views (video_id, viewer_hash, created_at DESC)
  WHERE viewer_hash IS NOT NULL;
CREATE INDEX video_views_user_idx ON video_views (user_id) WHERE user_id IS NOT NULL;

-- video_reactions
CREATE INDEX video_reactions_video_idx ON video_reactions (video_id, type);
CREATE INDEX video_reactions_user_idx  ON video_reactions (user_id, type, created_at DESC);

-- comments
CREATE INDEX comments_video_top_idx ON comments (video_id, created_at DESC)
  WHERE parent_id IS NULL AND deleted_at IS NULL;
CREATE INDEX comments_video_top_liked_idx ON comments (video_id, like_count DESC, created_at DESC)
  WHERE parent_id IS NULL AND deleted_at IS NULL;
CREATE INDEX comments_replies_idx ON comments (parent_id, created_at)
  WHERE parent_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX comments_user_idx ON comments (user_id, created_at DESC);

-- comment_reactions
CREATE INDEX comment_reactions_comment_idx ON comment_reactions (comment_id, type);

-- subscriptions
CREATE INDEX subscriptions_channel_idx ON subscriptions (channel_id, created_at DESC);
CREATE INDEX subscriptions_user_idx    ON subscriptions (user_id, created_at DESC);

-- playlists
CREATE INDEX playlists_user_idx ON playlists (user_id, updated_at DESC);
CREATE INDEX playlist_videos_video_idx ON playlist_videos (video_id);

-- watch_history
CREATE INDEX watch_history_user_idx  ON watch_history (user_id, watched_at DESC);
CREATE INDEX watch_history_video_idx ON watch_history (video_id);

-- notifications
CREATE INDEX notifications_user_idx   ON notifications (user_id, created_at DESC);
CREATE INDEX notifications_unread_idx ON notifications (user_id) WHERE is_read = false;
CREATE INDEX notifications_actor_idx   ON notifications (actor_id)   WHERE actor_id IS NOT NULL;
CREATE INDEX notifications_video_idx   ON notifications (video_id)   WHERE video_id IS NOT NULL;
CREATE INDEX notifications_comment_idx ON notifications (comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX notifications_channel_idx ON notifications (channel_id) WHERE channel_id IS NOT NULL;

-- reports
CREATE INDEX reports_queue_idx    ON reports (status, created_at DESC);
CREATE INDEX reports_reporter_idx ON reports (reporter_id) WHERE reporter_id IS NOT NULL;
CREATE INDEX reports_video_idx    ON reports (video_id)    WHERE video_id IS NOT NULL;
CREATE INDEX reports_comment_idx  ON reports (comment_id)  WHERE comment_id IS NOT NULL;
CREATE INDEX reports_reviewer_idx ON reports (reviewed_by) WHERE reviewed_by IS NOT NULL;

-- audit_logs
CREATE INDEX audit_logs_actor_idx  ON audit_logs (actor_id, created_at DESC) WHERE actor_id IS NOT NULL;
CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id);
CREATE INDEX audit_logs_action_idx ON audit_logs (action, created_at DESC);
CREATE INDEX audit_logs_time_idx   ON audit_logs (created_at DESC);

-- tokens
CREATE INDEX refresh_tokens_user_idx    ON refresh_tokens (user_id) WHERE revoked_at IS NULL;
CREATE INDEX refresh_tokens_expires_idx ON refresh_tokens (expires_at);
CREATE INDEX user_tokens_user_idx    ON user_tokens (user_id, purpose) WHERE used_at IS NULL;
CREATE INDEX user_tokens_expires_idx ON user_tokens (expires_at);

COMMIT;