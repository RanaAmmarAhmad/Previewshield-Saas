# PreviewShield

<div align="center">

![PreviewShield](https://img.shields.io/badge/PreviewShield-Secure%20File%20Sharing-6366f1?style=for-the-badge&logo=shield&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=white)

**The professional layer between your creative work and untrustworthy clients.**

Watermarked, view-only file previews with full visitor analytics — no downloads, no theft.

[Live Demo](#) · [Report Bug](https://github.com/RanaAmmarAhmad/previewshield/issues) · [Request Feature](https://github.com/RanaAmmarAhmad/previewshield/issues)

</div>

---

## What is PreviewShield?

PreviewShield is a SaaS platform for freelancers and creative professionals to securely share files with clients before payment. Clients can view a protected, watermarked preview — but they cannot download, screenshot-steal, or access the original file until you choose to release it.

Every viewer visit is tracked with their name, IP address, city, region, and country, giving you a complete audit trail.

---

## Features

| Feature | Description |
|---|---|
| **Secure Previews** | Watermarked, copy-protected view-only links for images, PDFs, and videos |
| **Password Protection** | Require a password before clients can view your file |
| **Link Expiry** | Auto-expire links after 24h, 48h, 7 days, or never |
| **Visitor Analytics** | Track name, IP, city, region, and country of every viewer |
| **Client Consent Gate** | Clients must enter their name + consent before viewing |
| **File Upload or URL** | Upload files directly or paste an existing URL |
| **Dashboard** | View all visitor logs for your preview via a private UID token |
| **Dark UI** | Modern, professional dark-navy interface |

---

## Tech Stack

### Frontend (`artifacts/preview-shield`)
- **React 18** + **Vite 5** — fast, modern SPA
- **Tailwind CSS v4** — utility-first styling
- **Framer Motion** — smooth animations
- **React Three Fiber** + **Three.js** — 3D hero canvas
- **Wouter** — lightweight client-side routing
- **shadcn/ui** components

### Backend (`artifacts/api-server`)
- **Express** + **TypeScript**
- **Drizzle ORM** + **PostgreSQL** — type-safe DB layer
- **Multer** — multipart file uploads
- **HMAC streaming tokens** — secure video streaming
- **ip-api.com** — free geolocation lookup (city/region/country)

### Infrastructure
- **pnpm workspaces** monorepo
- **PostgreSQL** (Neon / Replit DB / Supabase compatible)

---

## Project Structure

```
previewshield/
├── artifacts/
│   ├── preview-shield/          # React frontend
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── home.tsx         # Landing page
│   │   │   │   ├── share.tsx        # Upload + share form
│   │   │   │   ├── dashboard.tsx    # Analytics dashboard
│   │   │   │   ├── preview/[id].tsx # Client view page
│   │   │   │   ├── about.tsx
│   │   │   │   ├── contact.tsx
│   │   │   │   └── how-it-works.tsx
│   │   │   ├── components/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── Logo.tsx
│   │   │   └── index.css
│   │   └── package.json
│   └── api-server/              # Express backend
│       ├── src/
│       │   ├── routes/
│       │   │   └── previews.ts      # All API routes
│       │   └── index.ts
│       └── package.json
├── lib/
│   └── db/                      # Drizzle schema + client
│       └── src/
│           └── schema/
│               ├── previews.ts
│               └── visits.ts
├── netlify.toml                 # Netlify deployment config
└── README.md
```

---

## Database Schema

### `previews` table
| Column | Type | Description |
|---|---|---|
| `id` | varchar (UUID) | Unique preview identifier |
| `owner_token` | varchar | Private UID for dashboard access |
| `freelancer_name` | varchar | Name of the uploader |
| `agency_name` | varchar | Optional agency/company name |
| `file_url` | text | S3/CDN URL of the file |
| `file_type` | varchar | `image`, `video`, or `pdf` |
| `password_hash` | varchar | Bcrypt hash of the access password |
| `expires_at` | timestamp | When the link expires |
| `created_at` | timestamp | Creation timestamp |

### `visits` table
| Column | Type | Description |
|---|---|---|
| `id` | serial | Auto-increment ID |
| `preview_id` | varchar | Reference to `previews.id` |
| `client_name` | varchar | Name entered by viewer |
| `ip` | varchar | Viewer's IP address |
| `city` | varchar | Viewer's city (via ip-api.com) |
| `region` | varchar | Viewer's region/state |
| `country` | varchar | Viewer's country |
| `user_agent` | text | Browser user-agent string |
| `visited_at` | timestamp | Visit timestamp |

---

## API Reference

### `POST /api/previews/upload`
Upload a file and create a preview link.

**Body (multipart/form-data)**
```
freelancerName  string    Your name
agencyName      string?   Optional company name
password        string?   Access password
expiresIn       string    "24" | "48" | "168" | "never"
file            File      The file to upload (max 100MB)
```

**Response**
```json
{
  "id": "abc123",
  "ownerToken": "uid-xxxx",
  "shareUrl": "/preview/abc123",
  "dashboardUrl": "/dashboard?token=uid-xxxx"
}
```

### `GET /api/previews/:id`
Get preview metadata (for the client view page).

### `POST /api/previews/:id/visit`
Log a visitor's access. Called when a client submits their name.

**Body**
```json
{ "clientName": "John Doe" }
```

### `GET /api/previews/dashboard?ownerToken=`
Get full analytics for all previews by this owner token.

### `DELETE /api/previews/delete?ownerToken=`
Delete all previews and visits for this owner token.

### `GET /api/previews/stream/:id`
Stream video file with HMAC-signed token authentication.

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 9+
- PostgreSQL database

### 1. Clone the repository

```bash
git clone https://github.com/RanaAmmarAhmad/previewshield.git
cd previewshield
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@host:5432/previewshield
SESSION_SECRET=your-random-secret-here
PORT=8080
```

### 4. Push the database schema

```bash
pnpm --filter @workspace/db run db:push
```

### 5. Start development servers

```bash
# API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Frontend (port 3000)
pnpm --filter @workspace/preview-shield run dev
```

---

## Deployment

### Netlify (Frontend Only)

The project includes a `netlify.toml` for zero-config Netlify deployment of the frontend.

1. Push to GitHub
2. Import the repo in Netlify
3. Netlify auto-detects settings from `netlify.toml`
4. Set the environment variable `VITE_API_URL` to your backend API URL

> The backend (API server) must be deployed separately (Railway, Render, Fly.io, etc.).

### Full-Stack on Railway

```bash
# Build frontend
pnpm --filter @workspace/preview-shield run build

# Start backend
pnpm --filter @workspace/api-server run start
```

Set these environment variables on Railway:
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Random secret for HMAC tokens
- `PORT` — Leave blank (Railway assigns it automatically)

### Render

Use a **Web Service** with:
- **Build command**: `pnpm install && pnpm --filter @workspace/api-server run build`
- **Start command**: `pnpm --filter @workspace/api-server run start`
- Add `DATABASE_URL` and `SESSION_SECRET` in the environment tab.

---

## Security

- All preview links have optional password protection (bcrypt hashed)
- Video files are streamed via time-limited HMAC tokens (3-bucket rolling window)
- IP addresses are logged per visit for accountability
- Geolocation is fetched via ip-api.com (free tier, no key required)
- Private IPs (localhost, 10.x.x.x, etc.) skip geolocation gracefully

---

## Screenshots

| Page | Description |
|---|---|
| **Home** | Dark navy landing with animated 3D canvas |
| **Share** | File upload form with drag-and-drop |
| **Preview** | Client-facing protected view with watermark |
| **Dashboard** | Visitor analytics with location data |

---

## Roadmap

- [ ] Custom branded preview pages
- [ ] Geo-blocking by country
- [ ] Download unlock after payment (Stripe integration)
- [ ] Team collaboration
- [ ] Custom domains for share links
- [ ] PDF page-level watermarking
- [ ] Webhook notifications on view

---

## Author

**Rana Ammar Ahmad Khan**
- Email: [appcloud41@gmail.com](mailto:appcloud41@gmail.com)
- GitHub: [github.com/RanaAmmarAhmad](https://github.com/RanaAmmarAhmad)

---

## License

MIT License — see [LICENSE](LICENSE) for details.
