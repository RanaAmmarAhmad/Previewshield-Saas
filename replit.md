# PreviewShield Workspace

## Overview

pnpm workspace monorepo using TypeScript. PreviewShield is a professional SaaS platform for secure file preview sharing — freelancers upload files, generate share links with optional password and expiry, and clients view watermarked, copy-protected previews. Full analytics via Tracking UID (ownerToken). Built by Rana Ammar Ahmad Khan.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (artifacts/preview-shield)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── preview-shield/     # React + Vite frontend (serves at /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/
│           ├── previews.ts # Previews table
│           └── visits.ts   # Visits table
```

## PreviewShield Features

- **Home** (`/`) — Landing page with hero, features, how it works, use cases, CTA
- **Share File** (`/share`) — Create preview links with optional password protection
- **Preview** (`/preview/:id`) — View-only file previews with watermark overlay
- **About** (`/about`) — Platform mission and story
- **Contact** (`/contact`) — Contact form
- **How It Works** (`/how-it-works`) — Step-by-step workflow

## API Endpoints

- `POST /api/previews` — Create a new preview
- `GET /api/previews/:id` — Get preview (with optional password)
- `POST /api/previews/:id/visit` — Record a client visit (IP, timestamp)
- `GET /api/previews/:id/visits` — Get all visits (owner token required)
- `POST /api/previews/:id/upload-url` — Get upload URL
- `GET /api/previews/:id/stats` — Preview analytics (owner token required)
- `GET /api/healthz` — Health check

## Database Schema

- **previews** — Preview records with freelancer/client info, file metadata, optional password hash, owner token
- **visits** — Client visit logs with IP, user agent, referrer, timestamp

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes
