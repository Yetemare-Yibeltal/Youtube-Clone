# YouTube Clone

A full-stack video sharing platform built with React, Node.js and PostgreSQL.

## Tech stack

- **Client:** React 19, Vite, React Router, Zustand, Axios
- **Server:** Node.js, Express, PostgreSQL (`pg`), JWT, Zod
- **Media:** Cloudinary (free tier)

## Getting started

```bash
# 1. Install dependencies
npm run install:all

# 2. Create environment files
cp server/.env.example server/.env
cp client/.env.example client/.env

# 3. Start PostgreSQL (requires Docker)
docker compose up -d

# 4. Run the apps (two terminals)
npm run dev:server
npm run dev:client
```

The client runs on http://localhost:5173 and the API on http://localhost:5000.

## Project structure

```
client/     React frontend
server/     Express API
database/   Migrations and seeders
docs/       Documentation
scripts/    Setup and seed scripts
```

## Status

In active development. See `docs/` for architecture and API notes.
# StreamTube

A full-stack YouTube clone built with the MERN stack. Users can register, create a channel, upload videos and shorts, watch, like, comment, subscribe, build playlists, track watch history, receive real-time notifications and view creator analytics. Admins can moderate users and videos.

## Tech stack

**Client** (`client/`)

- React 18, Vite, React Router 6
- Redux Toolkit for auth, theme, UI and notification state
- Tailwind CSS with class-based dark mode
- React Hook Form, Axios (with automatic token refresh), Socket.IO client, React Player, Lucide icons

**Server** (`server/`)

- Node.js, Express, MongoDB with Mongoose
- JWT access and refresh tokens in HTTP-only cookies
- Zod request validation, Multer uploads to Cloudinary
- Socket.IO for real-time notifications, Nodemailer for email
- Vitest, Supertest and mongodb-memory-server for tests

## Project structure

```
.
├── client
│   └── src
│       ├── api            Axios client and one module per backend domain
│       ├── app            Redux store
│       ├── components     Reusable UI (layout, video, comment, channel, playlist, common)
│       ├── features       Redux slices (auth, ui, theme, notifications)
│       ├── hooks          useAuth, useDebounce, useSocket
│       ├── layouts        MainLayout, AuthLayout
│       ├── pages          Route-level screens
│       ├── routes         AppRoutes, ProtectedRoute, AdminRoute
│       └── utils          Formatting helpers
└── server
    └── src
        ├── config         Environment, database, JWT, Cloudinary, mailer
        ├── controllers    Request handlers
        ├── middleware     Auth, validation, upload, rate limiting, security
        ├── models         Mongoose schemas
        ├── routes         Express routers
        ├── services       Business logic
        ├── jobs           Background jobs
        ├── sockets        Socket.IO setup
        ├── validators     Zod schemas
        └── tests          Integration tests
```

## Getting started

### Prerequisites

- Node.js 18 or newer
- A MongoDB instance (local or Atlas)
- A Cloudinary account for media uploads

### Server

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Fill in every variable listed in `server/.env.example` (database URI, JWT secrets, Cloudinary and SMTP credentials). The API is served under `/api/v1`.

### Client

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:5173` and proxies `/api` and `/socket.io` to the server on `http://localhost:8000`. If your server uses a different port, update the targets in `client/vite.config.js` and `VITE_SOCKET_URL` in `client/.env`.

| Variable            | Purpose                    | Default                 |
| ------------------- | -------------------------- | ----------------------- |
| `VITE_API_BASE_URL` | Base path for API requests | `/api/v1`               |
| `VITE_SOCKET_URL`   | Socket.IO server origin    | `http://localhost:8000` |

## Scripts

| Location | Command           | Description                                |
| -------- | ----------------- | ------------------------------------------ |
| client   | `npm run dev`     | Start the Vite dev server                  |
| client   | `npm run build`   | Create a production build in `client/dist` |
| client   | `npm run preview` | Preview the production build               |
| client   | `npm run lint`    | Lint the source                            |
| server   | `npm run dev`     | Start the API with auto-reload             |
| server   | `npm test`        | Run the integration test suite             |

The server tests use mongodb-memory-server, which downloads a MongoDB binary the first time they run, so that run needs network access.

## Features

- Email and password authentication with refresh-token rotation, email verification and password reset
- Channels with avatar, banner, handle and verification badge
- Video and Shorts upload with progress, background processing and visibility controls
- Watch page with view counting, progress tracking, likes and dislikes, threaded comments and related videos
- Subscriptions with notification preferences
- Playlists, including Save to playlist from the watch page
- Watch history with pause, remove and clear
- Real-time notifications over Socket.IO
- Search with pagination
- Studio dashboard with views, watch time, subscriber growth and top videos
- Admin dashboard with platform stats, user bans, video moderation and an audit log
- Account settings for profile images, username, password, theme and account deletion

## Testing

```bash
cd server
npm test
```

## License

MIT
