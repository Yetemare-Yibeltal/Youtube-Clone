# Setup Guide

## Prerequisites

- Node.js 20 or newer
- PostgreSQL 16 or newer (local install, hosted such as Neon, or Docker)

## 1. Install dependencies

```bash
npm run install:all
```

## 2. Environment files

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Generate two different JWT secrets (run twice) and put them in `server/.env`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 3. Database

Local PostgreSQL:

```bash
psql -U postgres -h localhost -c "CREATE DATABASE youtube_clone;"
```

Then set `DATABASE_URL` in `server/.env`. With Docker instead: `docker compose up -d`.

Apply the schema:

```bash
npm run db:migrate
npm run db:status
```

Roll back the most recent migration: `npm run db:rollback`.

## 4. Run

```bash
npm run dev:server
npm run dev:client
```

API: http://localhost:5000/api/health, client: http://localhost:5173

## 5. Tests

```bash
cd server && npx vitest run
```

## Troubleshooting

- `ECONNREFUSED`: PostgreSQL isn't running, or the port in `DATABASE_URL` is wrong.
- `password authentication failed`: the password in `DATABASE_URL` doesn't match the one you set at install.
- `Invalid environment configuration`: read the listed variables; the server validates `server/.env` at startup.
