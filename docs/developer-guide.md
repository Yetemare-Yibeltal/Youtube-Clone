# Developer guide

## Prerequisites

Node.js 18 or newer, a MongoDB instance, and a Cloudinary account for uploads. An SMTP account is optional in development.

## First run

```bash
node scripts/setup.js --install
```

The script creates `server/.env` and `client/.env` from the examples, generates random JWT and cookie secrets, and runs `npm install` in both folders. Then fill in `MONGODB_URI`, the `CLOUDINARY_*` values and the `SMTP_*` values, and start both apps:

```bash
cd server && npm run dev
cd client && npm run dev
```

The client runs on `http://localhost:5173` and proxies `/api` and `/socket.io` to `http://localhost:8000`.

## Demo data

```bash
node scripts/seed.js
node scripts/seed.js --reset
```

Seeded accounts use the password `Passw0rd!` and emails such as `jack@vidtube.dev`.

## Conventions

- ES modules everywhere, single quotes, two-space indentation, 120-column lines (see `.prettierrc`).
- Code stays free of comments. Names carry the meaning.
- Server layering is route, validator, controller, service, model. Controllers never touch models directly except in small read-only handlers.
- Throw `ApiError` helpers (`badRequest`, `notFound`, `forbidden`, `conflict`) from services. The error middleware formats the response.
- Wrap async handlers in `asyncHandler`.
- Client pages call `api` modules, which unwrap `res.data.data`.
- Commit messages are short, present tense and start with a verb, for example `Add playlist service`.

## Adding an endpoint

1. Add a Zod schema in `server/src/validators`. A schema is an object with optional `body`, `query` and `params`.
2. Add the logic in a service in `server/src/services`.
3. Add a controller that calls the service and responds with `ApiResponse`.
4. Register the route in `server/src/routes` with `requireAuth` and `validate(schema)` as needed.
5. Mount a new router in `server/src/app.js` if it is a new domain.
6. Add a function in `client/src/api` and document the route in `docs/api.md`.

## Tests

```bash
cd server
npm test
```

Integration tests use Vitest, Supertest and an in-memory MongoDB. Cloudinary is mocked in the video tests, so no credentials are needed. The first run downloads a MongoDB binary and needs network access.

## Useful scripts

| Command                  | What it does                      |
| ------------------------ | --------------------------------- |
| `npm run dev` (server)   | API with auto-reload              |
| `npm run dev` (client)   | Vite dev server                   |
| `npm run build` (client) | Production build in `client/dist` |
| `npm run seed` (server)  | Load demo data                    |
| `node scripts/setup.js`  | First-run helper                  |
