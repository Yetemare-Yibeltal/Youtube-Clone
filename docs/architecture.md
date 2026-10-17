# Architecture

VidTube is a single-page React client talking to a REST API, with Socket.IO for notifications. Media is stored on Cloudinary and data in MongoDB.

```
Browser (React, Redux Toolkit)
   |  HTTPS, cookies            |  WebSocket
   v                            v
nginx (client container)  ->  Express API  ->  MongoDB
                               |   |
                               |   +--> Cloudinary (video and image storage)
                               +------> SMTP (verification and reset emails)
```

## Client

`client/src`

| Folder       | Role                                                                    |
| ------------ | ----------------------------------------------------------------------- |
| `api`        | Axios client with automatic refresh, plus one module per backend domain |
| `app`        | Redux store                                                             |
| `features`   | Slices for auth, theme, UI and notifications                            |
| `hooks`      | `useAuth`, `useSocket`, `useDebounce`                                   |
| `layouts`    | `MainLayout` and `AuthLayout`                                           |
| `pages`      | One component per route                                                 |
| `components` | Layout, video, comment, channel, playlist and common components         |
| `routes`     | Route table, `ProtectedRoute` and `AdminRoute`                          |
| `assets`     | Logo, icons and demo images, exposed through `assets/index.js`          |

Pages call the `api` modules directly and keep server data in component state. Redux holds only cross-cutting state: the signed-in user, theme, sidebar and notifications.

## Server

`server/src`

| Folder        | Role                                                                          |
| ------------- | ----------------------------------------------------------------------------- |
| `config`      | Environment validation, database, Cloudinary, JWT, mailer, Redis              |
| `routes`      | Express routers, one per domain, mounted in `app.js` under `/api/v1`          |
| `validators`  | Zod schemas passed to the `validate` middleware                               |
| `controllers` | Thin handlers that call services and send `ApiResponse`                       |
| `services`    | Business logic and database access                                            |
| `models`      | Mongoose schemas                                                              |
| `middleware`  | Auth, admin guard, validation, uploads, rate limits, security headers, errors |
| `jobs`        | Fire-and-forget background work                                               |
| `sockets`     | Socket.IO setup                                                               |
| `utils`       | `ApiError`, `ApiResponse`, `asyncHandler`, pagination, logging                |

A request flows through `security middleware -> rate limit -> router -> auth -> validate -> controller -> service -> model`. Errors thrown anywhere are converted to a JSON error by the error middleware.

## Authentication

1. Sign-in returns the user and sets two httpOnly cookies: a short-lived access token and a long-lived refresh token scoped to `/api/v1/auth`.
2. `requireAuth` verifies the access token and loads the user from the database on every request, so bans and role changes take effect immediately.
3. When a request returns 401, the client calls `POST /auth/refresh` once and retries. Concurrent requests wait for the same refresh.
4. Changing a password revokes all refresh tokens.

## Video upload and processing

1. The client sends a multipart request with the video, a thumbnail and the details.
2. Multer keeps both files in memory and the service uploads them to Cloudinary in parallel.
3. The video is saved with status `processing` and the channel counter is incremented.
4. `videoProcessing.job` waits briefly, marks the video `published` and fans out new-video notifications to subscribers.
5. Non-owners cannot open a video until it is published.

## Real-time notifications

The Socket.IO server reads the access token from the cookie and puts the socket in a room named `user:<id>`. `notification.service` saves each notification and emits `notification:new` to that room. The client adds it to Redux and shows a toast.

## Views and history

`POST /videos/:id/view` counts one view per signed-in user or session within 30 minutes. `POST /history/:id` stores watch progress. Both respect the user's pause-history setting.

## Search and recommendations

Search uses case-insensitive pattern matching over title, tags and description, limited to public published videos. Related videos are ranked by shared channel, category and tags. Trending favours views within the last 14 days. The subscription feed lists recent videos from subscribed channels.

## Seeded and shared assets

Demo creators, thumbnails and the sample video come from `client/src/assets/images` and `client/public/demo`, uploaded to Cloudinary by the seed script.
