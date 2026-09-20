-- 002_indexes.down.sql
BEGIN;

DROP INDEX IF EXISTS
  users_staff_idx, users_created_idx, channels_name_trgm_idx,
  videos_feed_idx, videos_shorts_idx, videos_trending_idx, videos_channel_idx,
  videos_category_idx, videos_search_idx, videos_tags_idx, videos_processing_idx,
  video_views_video_time_idx, video_views_dedupe_idx, video_views_user_idx,
  video_reactions_video_idx, video_reactions_user_idx,
  comments_video_top_idx, comments_video_top_liked_idx, comments_replies_idx, comments_user_idx,
  comment_reactions_comment_idx,
  subscriptions_channel_idx, subscriptions_user_idx,
  playlists_user_idx, playlist_videos_video_idx,
  watch_history_user_idx, watch_history_video_idx,
  notifications_user_idx, notifications_unread_idx, notifications_actor_idx,
  notifications_video_idx, notifications_comment_idx, notifications_channel_idx,
  reports_queue_idx, reports_reporter_idx, reports_video_idx, reports_comment_idx, reports_reviewer_idx,
  audit_logs_actor_idx, audit_logs_entity_idx, audit_logs_action_idx, audit_logs_time_idx,
  refresh_tokens_user_idx, refresh_tokens_expires_idx, user_tokens_user_idx, user_tokens_expires_idx;

DROP EXTENSION IF EXISTS pg_trgm;

COMMIT;