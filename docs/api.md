# API reference

Base URL: `/api/v1`. All bodies are JSON unless noted. Authentication uses httpOnly cookies set by sign-in.

## Conventions

Successful responses:

```json
{ "statusCode": 200, "data": {}, "message": "Videos fetched successfully", "success": true }
```

Paginated endpoints accept `page` and `limit` (maximum 50) and return:

```json
{ "results": [], "pagination": { "page": 1, "limit": 20, "total": 0 } }
```

Errors return the same envelope with `success: false`, a message and, for validation errors, an `errors` list.

Access levels: **public**, **user** (signed in), **owner** (owner of the resource), **admin**.

## Auth `/auth`

| Method | Path                   | Access                  | Body                                         |
| ------ | ---------------------- | ----------------------- | -------------------------------------------- |
| POST   | `/register`            | public                  | `username`, `email`, `fullName`, `password`  |
| POST   | `/login`               | public                  | `identifier` (email or username), `password` |
| POST   | `/logout`              | user                    |                                              |
| POST   | `/refresh`             | public (refresh cookie) |                                              |
| GET    | `/me`                  | user                    |                                              |
| POST   | `/resend-verification` | user                    |                                              |
| POST   | `/verify-email`        | public                  | `token`                                      |
| POST   | `/forgot-password`     | public                  | `email`                                      |
| POST   | `/reset-password`      | public                  | `token`, `newPassword`                       |
| POST   | `/change-password`     | user                    | `oldPassword`, `newPassword`                 |

Passwords need at least 8 characters with a lowercase letter, an uppercase letter and a number.

## Users `/users`

| Method | Path              | Access | Notes                                               |
| ------ | ----------------- | ------ | --------------------------------------------------- |
| GET    | `/`               | admin  | Query `q`, `role`                                   |
| GET    | `/me`             | user   |                                                     |
| PATCH  | `/me`             | user   | `fullName`, `username`                              |
| PATCH  | `/me/password`    | user   | `currentPassword`, `newPassword`, `confirmPassword` |
| PATCH  | `/me/avatar`      | user   | Multipart `avatar`                                  |
| PATCH  | `/me/cover-image` | user   | Multipart `coverImage`                              |
| DELETE | `/me`             | user   | `password`                                          |
| GET    | `/:username`      | public | Returns `{ user, channel, isSubscribed }`           |

## Channels `/channels`

| Method | Path                 | Access | Notes                                                                    |
| ------ | -------------------- | ------ | ------------------------------------------------------------------------ |
| POST   | `/`                  | user   | `name`, `handle`, `description`                                          |
| GET    | `/me`                | user   |                                                                          |
| GET    | `/handle/:handle`    | public | Returns `{ user, channel, isSubscribed }`                                |
| GET    | `/:channelId`        | public |                                                                          |
| GET    | `/:channelId/videos` | public | Query `sortBy`, `isShort`; owners also see private and processing videos |
| PATCH  | `/:channelId`        | owner  | `name`, `description`, `country`, `links`                                |
| PATCH  | `/:channelId/avatar` | owner  | Multipart `avatar`                                                       |
| PATCH  | `/:channelId/banner` | owner  | Multipart `banner`                                                       |
| DELETE | `/:channelId`        | owner  | Deletes the channel and its videos                                       |

## Videos `/videos`

| Method | Path                  | Access         | Notes                                                                                                                     |
| ------ | --------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/`                   | public         | Query `category`, `sortBy` (newest, oldest, popular, trending), `channelId`, `isShort`                                    |
| POST   | `/`                   | user           | Multipart `video`, `thumbnail`, plus `title`, `description`, `tags`, `category`, `visibility`, `isShort`, `ageRestricted` |
| GET    | `/:videoId`           | public         | Returns `{ video, isOwner, isSubscribed, viewerLikeStatus }`                                                              |
| PATCH  | `/:videoId`           | owner or admin | Any editable field                                                                                                        |
| PATCH  | `/:videoId/thumbnail` | owner or admin | Multipart `thumbnail`                                                                                                     |
| DELETE | `/:videoId`           | owner or admin | Cascades to comments, likes, views, history and playlists                                                                 |
| POST   | `/:videoId/view`      | public         | Counted once per viewer per 30 minutes                                                                                    |

## Comments `/comments`

| Method | Path                  | Access                              | Notes                                            |
| ------ | --------------------- | ----------------------------------- | ------------------------------------------------ |
| GET    | `/video/:videoId`     | public                              | Top-level comments, query `sortBy` (newest, top) |
| POST   | `/video/:videoId`     | user                                | `content`, optional `parentComment`              |
| GET    | `/:commentId/replies` | public                              |                                                  |
| PATCH  | `/:commentId`         | owner                               | `content`                                        |
| DELETE | `/:commentId`         | comment owner, video owner or admin |                                                  |

## Likes `/likes`

| Method | Path                     | Access | Notes                                                                                                                          |
| ------ | ------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| POST   | `/video/:videoId`        | user   | `type`: `like` or `dislike`. Sending the same type again removes the reaction. Returns `{ status, likesCount, dislikesCount }` |
| POST   | `/comment/:commentId`    | user   | Same body. Returns `{ status, likesCount }`                                                                                    |
| GET    | `/video/:videoId/status` | user   | Returns `{ status }`                                                                                                           |
| GET    | `/videos`                | user   | Liked videos                                                                                                                   |

## Subscriptions `/subscriptions`

| Method | Path                      | Access         | Notes                                                   |
| ------ | ------------------------- | -------------- | ------------------------------------------------------- |
| GET    | `/`                       | user           | Subscribed channels                                     |
| POST   | `/:channelId`             | user           | Toggles. Returns `{ subscribed, subscribersCount }`     |
| GET    | `/:channelId/status`      | user           |                                                         |
| GET    | `/:channelId/subscribers` | owner or admin |                                                         |
| PATCH  | `/:channelId/preference`  | user           | `notificationsEnabled`: `all`, `personalized` or `none` |

## Playlists `/playlists`

| Method | Path                           | Access | Notes                                                              |
| ------ | ------------------------------ | ------ | ------------------------------------------------------------------ |
| GET    | `/`                            | user   | Also creates the Watch later and Liked videos playlists if missing |
| POST   | `/`                            | user   | `name`, `description`, `visibility`                                |
| GET    | `/:playlistId`                 | public | Private playlists are visible to the owner only                    |
| PATCH  | `/:playlistId`                 | owner  | System playlists cannot be edited                                  |
| DELETE | `/:playlistId`                 | owner  | System playlists cannot be deleted                                 |
| POST   | `/:playlistId/videos/:videoId` | owner  |                                                                    |
| DELETE | `/:playlistId/videos/:videoId` | owner  |                                                                    |

## History `/history`

| Method | Path        | Access | Notes                |
| ------ | ----------- | ------ | -------------------- |
| GET    | `/`         | user   | Includes `isEnabled` |
| POST   | `/:videoId` | user   | `progressSeconds`    |
| DELETE | `/:videoId` | user   |                      |
| DELETE | `/`         | user   | Clears all           |
| PATCH  | `/toggle`   | user   | `isEnabled`          |

## Notifications `/notifications`

| Method | Path                    | Access | Notes               |
| ------ | ----------------------- | ------ | ------------------- |
| GET    | `/`                     | user   | Query `unread=true` |
| GET    | `/unread-count`         | user   | Returns `{ count }` |
| PATCH  | `/read-all`             | user   |                     |
| PATCH  | `/:notificationId/read` | user   |                     |
| DELETE | `/:notificationId`      | user   |                     |

## Search `/search`

| Method | Path                | Access | Notes                                |
| ------ | ------------------- | ------ | ------------------------------------ |
| GET    | `/videos`           | public | `q`, `category`, `sortBy`, `isShort` |
| GET    | `/channels`         | public | `q`                                  |
| GET    | `/suggestions`      | public | `q`                                  |
| GET    | `/trending`         | public | `limit`, `days`                      |
| GET    | `/related/:videoId` | public | `limit`                              |
| GET    | `/feed`             | user   | Videos from subscribed channels      |

## Shorts `/shorts`

| Method | Path        | Access |
| ------ | ----------- | ------ |
| GET    | `/`         | public |
| GET    | `/:videoId` | public |

## Reports `/reports`

| Method | Path         | Access | Notes                                         |
| ------ | ------------ | ------ | --------------------------------------------- |
| POST   | `/`          | user   | `targetType`, `targetId`, `reason`, `details` |
| GET    | `/`          | admin  | Query `status`, `targetType`                  |
| PATCH  | `/:reportId` | admin  | `status`, `reviewNote`                        |

## Uploads `/uploads`

| Method | Path         | Access | Notes                                      |
| ------ | ------------ | ------ | ------------------------------------------ |
| POST   | `/image`     | user   | Multipart `image`, optional `folder`       |
| POST   | `/video`     | user   | Multipart `video`, optional `folder`       |
| DELETE | `/:publicId` | user   | URL-encode the id, optional `resourceType` |

## Analytics `/analytics`

| Method | Path                              | Access         | Notes                                  |
| ------ | --------------------------------- | -------------- | -------------------------------------- |
| GET    | `/channels/:channelId`            | owner or admin | Query `range`: 7d, 28d, 90d, 365d, all |
| GET    | `/channels/:channelId/top-videos` | owner or admin | `range`, `limit`                       |
| GET    | `/videos/:videoId`                | owner or admin | `range`                                |

## Admin `/admin`

| Method | Path                          | Notes                   |
| ------ | ----------------------------- | ----------------------- |
| GET    | `/stats`                      | Platform totals         |
| GET    | `/audit-logs`                 | Query `action`, `actor` |
| GET    | `/videos`                     | Query `status`          |
| DELETE | `/videos/:videoId`            |                         |
| DELETE | `/comments/:commentId`        |                         |
| PATCH  | `/users/:userId/ban`          | `reason`                |
| PATCH  | `/users/:userId/unban`        |                         |
| PATCH  | `/channels/:channelId/verify` | `isVerified`            |

## Health

`GET /health` returns `{ success: true, message: "OK", uptime }` and is used by the Docker health check.
