# Security

## Authentication and sessions

- Passwords are hashed with bcrypt and never returned by the API.
- Access and refresh tokens are JWTs stored in httpOnly cookies, so scripts in the page cannot read them.
- In production the cookies are `secure` and `SameSite=None`. In development they are `SameSite=Lax`.
- The refresh cookie is limited to `/api/v1/auth`.
- Refresh tokens are stored and revoked on password change, so changing a password signs out every device.
- The user is loaded from the database on each request. Banned users are rejected immediately and role changes apply at once.

## Authorization

- `requireAuth` protects signed-in routes, `requireAdmin` protects admin routes.
- Ownership checks live in the services. Video and comment owners and admins may delete content, only owners may edit it.
- Private videos and playlists return 403 to everyone but the owner. Videos that are not published return 404 to everyone but the owner.

## Input handling

- Every request body, query and route parameter is validated with Zod before it reaches a controller.
- `mongo-sanitize` strips operator keys from incoming data, and `hpp` blocks parameter pollution.
- Search text is escaped before it becomes a regular expression.
- Request bodies are limited to 16 KB, except multipart uploads.

## Uploads

- Multer filters by MIME type: images (JPEG, PNG, WebP, GIF) up to 5 MB, videos (MP4, WebM, QuickTime, Matroska) up to 2 GB.
- Files stay in memory and go straight to Cloudinary. Nothing is written to the server disk.
- When a video, thumbnail, avatar or banner is replaced or deleted, the old Cloudinary asset is removed.

## Abuse protection

- `express-rate-limit` throttles `/api` and applies a stricter limit to uploads.
- Views are deduplicated per viewer or session for 30 minutes.
- Users can report videos, comments, channels and users. Admins review reports through the API and every admin action is written to the audit log.

## HTTP hardening

Helmet sets security headers, CORS only allows `CLIENT_URL` with credentials, and responses are compressed. `trust proxy` is enabled so rate limits use the real client IP behind a reverse proxy.

## Secrets

Never commit `.env` files. Rotate `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` and `COOKIE_SECRET` if they leak. Rotating the JWT secrets signs everyone out.

## Known limits

- Search uses pattern matching and can be slow on very large collections.
- The report review UI is not built yet, so admins review reports through the API.
- Email verification is encouraged with a banner but does not block sign-in.

## Reporting a vulnerability

Please report security issues privately to the repository owner instead of opening a public issue, and include steps to reproduce.
