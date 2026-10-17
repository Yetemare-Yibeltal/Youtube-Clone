# Deployment

## What you need

- A MongoDB database (Atlas or self-hosted)
- A Cloudinary account for video and image storage
- An SMTP account for verification and reset emails
- A host that runs Docker, or any Node.js host plus static hosting for the client

## Environment variables

Set these on the server (see `server/.env.example`):

| Variable                                                               | Notes                                                            |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `NODE_ENV`                                                             | `production`                                                     |
| `PORT`                                                                 | Defaults to 8000                                                 |
| `CLIENT_URL`                                                           | Public URL of the client, used for CORS, cookies and email links |
| `API_URL`                                                              | Public URL of the API                                            |
| `MONGODB_URI`                                                          | Connection string                                                |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`             | Long random values. `node scripts/setup.js` can generate them    |
| `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`                              | Default `15m` and `30d`                                          |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Required for uploads                                             |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`        | Required for email                                               |
| `REDIS_URL`                                                            | Only needed if you import `config/redis.js`                      |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`                               | Rate limiting                                                    |

The client reads `VITE_API_BASE_URL` (default `/api/v1`) and `VITE_SOCKET_URL` (defaults to the page origin) at build time.

## Docker

Both apps have Dockerfiles.

```bash
docker build -t vidtube-server server
docker build -t vidtube-client client
```

The client image serves the built app with nginx and proxies `/api/` and `/socket.io/` to a host named `server` on port 8000. Run both containers on one network and name the API container `server`, or edit `client/nginx.conf`.

```bash
docker network create vidtube
docker run -d --name server --network vidtube --env-file server/.env vidtube-server
docker run -d --name client --network vidtube -p 80:80 vidtube-client
```

With the repository's `docker-compose.yml`, make sure the API service is called `server`.

## Published images

`.github/workflows/deploy.yml` builds both images and pushes them to GitHub Container Registry when you push a tag that starts with `v`, or when you run the workflow manually:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## HTTPS and cookies

In production the auth cookies are `secure` and use `SameSite=None`, so the site must be served over HTTPS. Put a TLS-terminating proxy in front of nginx, for example Caddy, Traefik or a cloud load balancer. Keep the client and API on the same origin where possible, as the bundled nginx does.

## First administrator

There is no sign-up path for admins. Register normally, then promote the account:

```js
db.users.updateOne({ email: 'you@example.com' }, { $set: { role: 'admin' } });
```

## Checklist

- [ ] Secrets are random and not committed
- [ ] `CLIENT_URL` matches the public client URL exactly
- [ ] HTTPS is enabled
- [ ] MongoDB has authentication and backups
- [ ] Cloudinary and SMTP credentials work (send a test registration)
- [ ] `GET /health` responds
- [ ] An admin account exists
