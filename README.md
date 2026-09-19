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
