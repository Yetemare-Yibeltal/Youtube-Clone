# Database

VidTube stores its data in **MongoDB** through Mongoose. Collections and indexes are created automatically the first time the server starts, so there is nothing to migrate for a fresh database.

The SQL files in `database/migrations` and `scripts/migrate.js` are not read by the server. Keep them only if you plan a relational port, otherwise remove them to avoid confusion.

## Local setup

```bash
docker run -d --name vidtube-mongo -p 27017:27017 mongo:7
```

Then set this in `server/.env`:

```
MONGODB_URI=mongodb://127.0.0.1:27017/youtube-clone
```

## Collections

| Collection | Model | Purpose |
| --- | --- | --- |
| users | `User` | Accounts, roles, ban state, avatar and cover image |
| channels | `Channel` | One channel per user, with handle, branding and counters |
| videos | `Video` | Videos and Shorts, with Cloudinary assets and counters |
| comments | `Comment` | Comments and one level of replies |
| likes | `Like` | Likes and dislikes on videos and comments |
| subscriptions | `Subscription` | Subscriber to channel links with notification preference |
| playlists | `Playlist` | User playlists and the Watch later and Liked videos system playlists |
| watchhistories | `WatchHistory` | Per-user watch progress |
| videoviews | `VideoView` | Individual view events used by analytics |
| notifications | `Notification` | In-app notifications |
| reports | `Report` | User reports for moderation |
| auditlogs | `AuditLog` | Record of admin actions |
| refreshtokens | `RefreshToken` | Issued refresh tokens |
| usertokens | `UserToken` | Email verification and password reset tokens |

## Demo data

```bash
cd server
npm run seed
npm run seed:reset
```

The seed creates six creators, their channels, eight videos and a few subscriptions. It needs Cloudinary credentials because it uploads the sample images and video.

## Backups

Use `mongodump` for logical backups:

```bash
mongodump --uri "$MONGODB_URI" --out backup-$(date +%F)
mongorestore --uri "$MONGODB_URI" backup-2026-01-01
```

See `docs/database.md` for the data model and `docs/maintenance.md` for routine tasks.