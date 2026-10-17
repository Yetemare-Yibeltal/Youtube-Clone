# Troubleshooting

## The client cannot reach the API

- Make sure the API is running on port 8000 and the client on 5173.
- The Vite proxy targets `http://localhost:8000`. Change both entries in `client/vite.config.js` if you use another port.
- In Docker, the API container must be named `server` (see `client/nginx.conf`).

## Sign-in works but I am logged out on refresh

- `CLIENT_URL` in `server/.env` must exactly match the origin you open in the browser, including the port.
- In production the cookies are `secure`, so the site must use HTTPS.
- Do not mix `localhost` and `127.0.0.1`. Cookies are per host.

## Repeated 401 errors

The client refreshes once per failed request. If refresh also fails, the refresh cookie is missing or revoked. Sign in again. Changing your password revokes all refresh tokens.

## `Invalid environment variables` on server start

The server validates `.env` with Zod. The message lists the failing variables. `MONGODB_URI`, `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are required and the secrets must be at least 10 characters. Run `node scripts/setup.js` to generate them.

## Uploads fail

- Check the three `CLOUDINARY_*` values.
- Videos must be MP4, WebM, QuickTime or Matroska and under 2 GB. Images must be JPEG, PNG, WebP or GIF and under 5 MB.
- Behind a proxy, raise the body size limit (`client_max_body_size` in nginx).
- The upload endpoints answer 400 with "Create a channel before uploading videos" until the user has a channel.

## The uploaded video is not visible

New videos are `processing` for a few seconds. Only the owner can open them until they are `published`. Reload after a moment.

## A category is rejected

`automobiles` and `blogs` must exist in the `category` enum of `server/src/models/Video.js` and in `server/src/validators/video.validator.js`.

## Notifications do not arrive live

- The socket connects with the access token cookie, so you must be signed in.
- Behind nginx the `/socket.io/` location needs the `Upgrade` and `Connection` headers, which `client/nginx.conf` sets.
- The badge count loads on sign-in and updates from socket events.

## Voice search, Cast or Share buttons are missing

Voice search needs a browser with the Web Speech API (Chrome and Edge). Cast needs remote playback support. The Share button always works: it opens the system share sheet or copies the link.

## Tests fail to start

`mongodb-memory-server` downloads a MongoDB binary on first run, which needs network access. Set `MONGOMS_DOWNLOAD_MIRROR` if you are behind a proxy.

## Seed script fails

- It needs working Cloudinary credentials because it uploads the sample images and video.
- It uses the database from `server/.env`. Run it from the repository root with `node scripts/seed.js` or from `server` with `npm run seed`.

## Password reset or verification email never arrives

Check the `SMTP_*` values and `MAIL_FROM`. Gmail needs an app password. The links in the emails use `CLIENT_URL`, so a wrong value produces broken links.
