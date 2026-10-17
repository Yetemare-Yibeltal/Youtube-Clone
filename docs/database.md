# Data model

All models live in `server/src/models`. Timestamps (`createdAt`, `updatedAt`) are enabled on every schema.

## Relationships

```
User 1---1 Channel 1---* Video 1---* Comment (replies point to a parent Comment)
User 1---* Subscription *---1 Channel
User 1---* Like *---1 Video | Comment
User 1---* Playlist *---* Video
User 1---* WatchHistory *---1 Video
Video 1---* VideoView
User 1---* Notification
User 1---* Report
```

## Key fields

### User

| Field                   | Notes                                                |
| ----------------------- | ---------------------------------------------------- |
| `username`, `email`     | Unique, lowercase                                    |
| `fullName`              | Display name                                         |
| `password`              | Hashed with bcrypt, excluded from queries by default |
| `role`                  | `user` or `admin`                                    |
| `avatar`, `coverImage`  | `{ url, publicId }`                                  |
| `isEmailVerified`       | Set after the verification email link is used        |
| `isBanned`, `banReason` | Set by admins, blocks sign-in and requests           |
| `isWatchHistoryEnabled` | Pauses or resumes watch history                      |

### Channel

`owner` (unique), `name`, `handle` (unique, lowercase), `description`, `avatar`, `banner`, `links`, `country`, `isVerified`, and counters `subscribersCount`, `videosCount`, `totalViews`.

### Video

| Field                                                   | Notes                                                                                                                                  |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `owner`, `channel`                                      | References                                                                                                                             |
| `title`, `description`, `tags`, `category`              | Category is one of music, gaming, news, sports, education, entertainment, technology, travel, comedy, howto, automobiles, blogs, other |
| `videoFile`, `thumbnail`                                | `{ url, publicId }`                                                                                                                    |
| `duration`                                              | Seconds                                                                                                                                |
| `isShort`                                               | Shorts are excluded from the home feed                                                                                                 |
| `visibility`                                            | `public`, `unlisted` or `private`                                                                                                      |
| `status`                                                | `processing`, `published` or `failed`                                                                                                  |
| `views`, `likesCount`, `dislikesCount`, `commentsCount` | Counters                                                                                                                               |
| `isCommentsEnabled`, `ageRestricted`, `publishedAt`     | Settings                                                                                                                               |

### Comment

`video`, `owner`, `content`, `parentComment` (null for top-level), `repliesCount`, `likesCount`, `isEdited`, `isPinned`, `isHearted`. Replies to replies are attached to the top-level comment.

### Like

`user`, `targetType` (`video` or `comment`), `video` or `comment`, `type` (`like` or `dislike`). A user has at most one reaction per target.

### Subscription

`subscriber`, `channel`, `notificationsEnabled` (`all`, `personalized` or `none`). Unique per pair.

### Playlist

`owner`, `name`, `description`, `videos`, `visibility`, `isSystem`, `systemType` (`watch_later` or `liked_videos`), `thumbnail`.

### Notification

`recipient`, `sender`, `type` (`new_video`, `new_subscriber`, `comment`, `reply`, `like`, `mention`, `system`), `video`, `comment`, `channel`, `message`, `isRead`.

### Report

`reporter`, `targetType` (`video`, `comment`, `channel`, `user`), the matching reference, `reason`, `details`, `status` (`pending`, `reviewing`, `resolved`, `dismissed`), `reviewedBy`, `reviewNote`.

## Indexes

| Collection     | Index                                                     | Purpose                          |
| -------------- | --------------------------------------------------------- | -------------------------------- |
| videos         | text on title, description, tags                          | Text search                      |
| videos         | `visibility, status, publishedAt`                         | Public feeds                     |
| videos         | `channel, publishedAt`                                    | Channel pages                    |
| comments       | `video, parentComment, createdAt`                         | Comment threads                  |
| likes          | unique `user, video` and unique `user, comment` (partial) | One reaction per target          |
| subscriptions  | unique `subscriber, channel`                              | One subscription per pair        |
| playlists      | unique `owner, systemType` (partial)                      | One system playlist of each kind |
| notifications  | `recipient, isRead, createdAt`                            | Inbox and unread count           |
| watchhistories | unique `user, video`, and `user, watchedAt`               | History list                     |
| reports        | `status, createdAt`                                       | Moderation queue                 |

## Counters

Counters such as `likesCount` or `subscribersCount` are updated with `$inc` in the same service call that creates or removes the related document. If they ever drift, `server/scripts/seed.js` shows how to recompute channel counters from the source collections.
