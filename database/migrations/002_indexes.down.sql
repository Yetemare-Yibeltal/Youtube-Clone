BEGIN;

DROP INDEX IF EXISTS users_staff_idx;
DROP INDEX IF EXISTS users_created_idx;

DROP INDEX IF EXISTS channels_name_trgm_idx;

DROP INDEX IF EXISTS videos_feed_idx;
DROP INDEX IF EXISTS videos_shorts_idx;
DROP INDEX IF EXISTS videos_trending_idx;
DROP INDEX IF EXISTS videos_channel_idx;
DROP INDEX IF EXISTS videos_category_idx;
DROP INDEX IF EXISTS videos_search_idx;
DROP INDEX IF EXISTS videos_tags_idx;
DROP INDEX IF EXISTS videos_processing_idx;

DROP INDEX IF EXISTS video_views_video_time_idx;
DROP INDEX IF EXISTS video_views_dedupe_idx;
DROP INDEX IF EXISTS video_views_user_idx;

DROP INDEX IF EXISTS video_reactions_video_idx;
DROP INDEX IF EXISTS video_reactions_user_idx;

DROP INDEX IF EXISTS comments_video_top_idx;
DROP INDEX IF EXISTS comments_video_top_liked_idx;
DROP INDEX IF EXISTS comments_replies_idx;
DROP INDEX IF EXISTS comments_user_idx;

DROP INDEX IF EXISTS comment_reactions_comment_idx;

DROP INDEX IF EXISTS subscriptions_channel_idx;
DROP INDEX IF EXISTS subscriptions_user_idx;

DROP INDEX IF EXISTS playlists_user_idx;
DROP INDEX IF EXISTS playlist_videos_video_idx;

DROP INDEX IF EXISTS watch_history_user_idx;
DROP INDEX IF EXISTS watch_history_video_idx;

DROP INDEX IF EXISTS notifications_user_idx;
DROP INDEX IF EXISTS notifications_unread_idx;
DROP INDEX IF EXISTS notifications_actor_idx;
DROP INDEX IF EXISTS notifications_video_idx;
DROP INDEX IF EXISTS notifications_comment_idx;
DROP INDEX IF EXISTS notifications_channel_idx;

DROP INDEX IF EXISTS reports_queue_idx;
DROP INDEX IF EXISTS reports_reporter_idx;
DROP INDEX IF EXISTS reports_video_idx;
DROP INDEX IF EXISTS reports_comment_idx;
DROP INDEX IF EXISTS reports_reviewer_idx;

DROP INDEX IF EXISTS audit_logs_actor_idx;
DROP INDEX IF EXISTS audit_logs_entity_idx;
DROP INDEX IF EXISTS audit_logs_action_idx;
DROP INDEX IF EXISTS audit_logs_time_idx;

DROP INDEX IF EXISTS refresh_tokens_user_idx;
DROP INDEX IF EXISTS refresh_tokens_expires_idx;
DROP INDEX IF EXISTS user_tokens_user_idx;
DROP INDEX IF EXISTS user_tokens_expires_idx;

COMMIT;
