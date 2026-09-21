-- 001_init_schema.sql
-- Core schema for the YouTube clone (PostgreSQL 16)

BEGIN;

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE user_role          AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE visibility         AS ENUM ('public', 'unlisted', 'private');
CREATE TYPE video_status       AS ENUM ('processing', 'ready', 'failed');
CREATE TYPE reaction_type      AS ENUM ('like', 'dislike');
CREATE TYPE report_reason      AS ENUM ('spam', 'harassment', 'hate', 'violence', 'sexual', 'copyright', 'misinformation', 'other');
CREATE TYPE report_status      AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');
CREATE TYPE notification_type  AS ENUM ('new_video', 'comment', 'reply', 'like', 'subscription', 'moderation', 'system');
CREATE TYPE token_purpose      AS ENUM ('email_verification', 'password_reset');

CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE users (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email              citext NOT NULL UNIQUE,
  password_hash      text NOT NULL,
  display_name       varchar(80) NOT NULL CHECK (char_length(trim(display_name)) >= 1),
  avatar_url         text,
  role               user_role NOT NULL DEFAULT 'user',
  email_verified_at  timestamptz,
  is_active          boolean NOT NULL DEFAULT true,
  last_login_at      timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE channels (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  handle            citext NOT NULL UNIQUE CHECK (handle ~ '^[a-z0-9_.-]{3,30}$'),
  name              varchar(100) NOT NULL CHECK (char_length(trim(name)) >= 1),
  description       text NOT NULL DEFAULT '',
  avatar_url        text,
  banner_url        text,
  subscriber_count  integer NOT NULL DEFAULT 0 CHECK (subscriber_count >= 0),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE videos (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id            uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  title                 varchar(150) NOT NULL CHECK (char_length(trim(title)) >= 1),
  description           text NOT NULL DEFAULT '',
  video_url             text,
  cloudinary_public_id  text,
  thumbnail_url         text,
  duration_seconds      integer CHECK (duration_seconds >= 0),
  is_short              boolean NOT NULL DEFAULT false,
  status                video_status NOT NULL DEFAULT 'processing',
  visibility            visibility NOT NULL DEFAULT 'private',
  category              varchar(40),
  tags                  text[] NOT NULL DEFAULT '{}',
  view_count            bigint  NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  like_count            integer NOT NULL DEFAULT 0 CHECK (like_count >= 0),
  dislike_count         integer NOT NULL DEFAULT 0 CHECK (dislike_count >= 0),
  comment_count         integer NOT NULL DEFAULT 0 CHECK (comment_count >= 0),
  search_vector         tsvector GENERATED ALWAYS AS (
                          setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                          setweight(to_tsvector('english', coalesce(description, '')), 'B')
                        ) STORED,
  published_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz,
  CONSTRAINT ready_video_has_url CHECK (status <> 'ready' OR video_url IS NOT NULL)
);

CREATE TABLE video_views (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  video_id     uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  viewer_hash  text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE video_reactions (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id    uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  type        reaction_type NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);

CREATE TABLE comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id    uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id   uuid REFERENCES comments(id) ON DELETE CASCADE,
  body        text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 2000),
  like_count  integer NOT NULL DEFAULT 0 CHECK (like_count >= 0),
  reply_count integer NOT NULL DEFAULT 0 CHECK (reply_count >= 0),
  is_edited   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,
  CONSTRAINT comment_not_own_parent CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE TABLE comment_reactions (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id  uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  type        reaction_type NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, comment_id)
);

CREATE TABLE subscriptions (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id  uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  notify      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, channel_id)
);

CREATE TABLE playlists (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        varchar(100) NOT NULL CHECK (char_length(trim(title)) >= 1),
  description  text NOT NULL DEFAULT '',
  visibility   visibility NOT NULL DEFAULT 'private',
  video_count  integer NOT NULL DEFAULT 0 CHECK (video_count >= 0),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE playlist_videos (
  playlist_id  uuid NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  video_id     uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  position     integer NOT NULL CHECK (position >= 0),
  added_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (playlist_id, video_id),
  CONSTRAINT playlist_position_unique UNIQUE (playlist_id, position) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE watch_history (
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id          uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  progress_seconds  integer NOT NULL DEFAULT 0 CHECK (progress_seconds >= 0),
  completed         boolean NOT NULL DEFAULT false,
  watched_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);

CREATE TABLE notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  type        notification_type NOT NULL,
  video_id    uuid REFERENCES videos(id) ON DELETE CASCADE,
  comment_id  uuid REFERENCES comments(id) ON DELETE CASCADE,
  channel_id  uuid REFERENCES channels(id) ON DELETE CASCADE,
  message     text NOT NULL DEFAULT '',
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reports (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  video_id         uuid REFERENCES videos(id) ON DELETE CASCADE,
  comment_id       uuid REFERENCES comments(id) ON DELETE CASCADE,
  reason           report_reason NOT NULL,
  details          text NOT NULL DEFAULT '' CHECK (char_length(details) <= 1000),
  status           report_status NOT NULL DEFAULT 'open',
  reviewed_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at      timestamptz,
  resolution_note  text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT report_has_one_target CHECK (num_nonnulls(video_id, comment_id) = 1)
);

CREATE UNIQUE INDEX reports_unique_video_per_reporter
  ON reports (reporter_id, video_id) WHERE video_id IS NOT NULL;
CREATE UNIQUE INDEX reports_unique_comment_per_reporter
  ON reports (reporter_id, comment_id) WHERE comment_id IS NOT NULL;

CREATE TABLE audit_logs (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  action       varchar(80) NOT NULL,
  entity_type  varchar(50),
  entity_id    text,
  metadata     jsonb NOT NULL DEFAULT '{}',
  ip_address   inet,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  user_agent  text,
  ip_address  inet,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose     token_purpose NOT NULL,
  token_hash  text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_users_updated     BEFORE UPDATE ON users     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_channels_updated  BEFORE UPDATE ON channels  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_videos_updated    BEFORE UPDATE ON videos    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_comments_updated  BEFORE UPDATE ON comments  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_playlists_updated BEFORE UPDATE ON playlists FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;