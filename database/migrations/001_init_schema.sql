-- 001_init_schema.down.sql
BEGIN;

DROP TABLE IF EXISTS user_tokens, refresh_tokens, audit_logs, reports, notifications,
  watch_history, playlist_videos, playlists, subscriptions, comment_reactions,
  comments, video_reactions, video_views, videos, channels, users CASCADE;

DROP FUNCTION IF EXISTS set_updated_at();

DROP TYPE IF EXISTS token_purpose, notification_type, report_status, report_reason,
  reaction_type, video_status, visibility, user_role;

COMMIT;