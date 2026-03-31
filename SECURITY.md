# PreviewShield — Security Architecture

This document describes every layer of protection built into the PreviewShield platform. It is intended for the file owner and any technical reviewers who want to understand how files, credentials, and visitor data are protected.

---

## 1. File URL Protection

**Files are never directly accessible via URL.**

All uploaded files are stored in a server-side directory that has no public route. The `/api/files/` static route has been intentionally removed.

Files can only be streamed through a single protected endpoint:

```
GET /api/previews/:id/stream?t=<HMAC_TOKEN>
```

The `t` parameter is a time-limited, HMAC-SHA256 cryptographic token generated fresh for each preview session. Tokens expire after 30 minutes (using a rolling 3-bucket window). An expired or forged token returns `403 Forbidden`.

This means:
- The actual file path is **never sent to the browser**
- Even if a visitor inspects network requests, they only see an opaque token URL that expires
- Tokens cannot be guessed, replayed indefinitely, or shared between preview sessions

---

## 2. Password Protection

When the file owner sets a password:

- The password is **never stored in plaintext**. It is hashed with SHA-256 before storage
- The database contains only the hash, never the original password
- Password verification happens server-side with constant-time comparison
- After 5 failed password attempts from the same IP, the endpoint is rate-limited for 60 seconds

---

## 3. HTTP Security Headers

Every API response includes the following security headers (enforced by Helmet):

| Header | Value | Purpose |
|---|---|---|
| `Content-Security-Policy` | Strict allowlist | Blocks inline scripts, external resources, and code injection |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS for 1 year |
| `X-Frame-Options` | `SAMEORIGIN` | Blocks clickjacking via iframes |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer info leakage |
| `Cross-Origin-Resource-Policy` | `same-site` | Blocks cross-origin file loading |
| `X-DNS-Prefetch-Control` | `off` | Prevents DNS prefetch information leakage |
| `X-Download-Options` | `noopen` | Prevents IE from auto-executing downloads |

Server fingerprinting headers (`X-Powered-By`, `Server`) are removed from all responses.

---

## 4. CORS Lockdown

Cross-Origin Resource Sharing (CORS) is restricted to a whitelist of allowed origins:

- `*.replit.dev`
- `*.repl.co`
- `*.kirk.replit.dev`
- `localhost` / `127.0.0.1`

Any request from an unlisted origin is rejected before it reaches any route handler. This prevents external websites from making authenticated requests to the API using a visitor's credentials.

---

## 5. Rate Limiting

Every endpoint has an independent rate limit to prevent brute-force and abuse:

| Endpoint | Limit | Window |
|---|---|---|
| All endpoints (global) | 120 req / IP | 60 seconds |
| `POST /api/previews` (create) | 10 req / IP | 60 seconds |
| `GET /api/previews/dashboard` | 30 req / IP | 60 seconds |
| `GET /api/previews/:id/stream` | 60 req / IP | 60 seconds |
| `POST /api/previews/:id/visit` | 5 req / IP | 5 minutes |
| `GET /api/previews/:id?password=` | 5 req / IP | 60 seconds |

When a limit is exceeded, the server responds with `429 Too Many Requests`.

---

## 6. Input Validation & Sanitisation

All incoming request bodies are validated at two levels:

1. **Zod schema validation** — type checking, required fields, enum constraints
2. **Length guard** — hard caps on every string field to prevent oversized input attacks:
   - `freelancerName`, `agencyName`, `clientName`: max 120 characters
   - `fileName`: max 255 characters
   - `password`: max 128 characters
   - `fileUrl`: max 2048 characters
   - `userAgent`: max 512 characters
   - `referrer`: max 1024 characters
   - `fileSize`: max 200 MB
   - `expiresInHours`: 1–8760 (max 1 year)

Requests exceeding any limit are rejected with `400 Bad Request` before any database operation.

---

## 7. Request Body Size Limit

The Express body parser is configured with a hard cap of **2 MB per request**. Oversized bodies are rejected at the middleware level before any application code runs.

---

## 8. SQL Injection Prevention

All database queries use **Drizzle ORM with parameterised queries**. Raw SQL strings are never interpolated with user input. SQL injection is structurally impossible in this codebase.

---

## 9. Error Message Sanitisation

- Stack traces are **never** included in API responses
- Internal file paths, table names, and query structures are hidden from all error messages
- Unexpected server errors return a generic `{ error: "server_error" }` with no detail
- Sensitive query parameters (e.g. `password`) are redacted from access logs before logging

---

## 10. Preview Page Copy Protection

The client-side preview page (`/preview/:id`) enforces the following protections:

### Keyboard Shortcuts Blocked
| Shortcut | Action Blocked |
|---|---|
| `Ctrl/Cmd + S` | Save page |
| `Ctrl/Cmd + U` | View page source |
| `Ctrl/Cmd + P` | Print |
| `Ctrl/Cmd + A` | Select all |
| `Ctrl/Cmd + C` | Copy |
| `Ctrl/Cmd + Shift + I/J/C` | Open DevTools |
| `F12` | Open DevTools |
| `PrintScreen` | Screenshot key |

### Other Client-Side Protections
- **Right-click / context menu** — disabled on the preview page
- **Text selection** — disabled via CSS `user-select: none` and `selectstart` event prevention
- **Drag and drop** — disabled on all elements
- **iOS long-press callout** — disabled via `-webkit-touch-callout: none`
- **Print/screenshot via print dialog** — the entire page body is hidden with `display: none` in `@media print`
- **Developer Tools detection** — content is replaced with a security overlay when DevTools are detected open (via window dimension analysis, checked every second)
- **Tab visibility** — content is blurred/hidden when the user switches away from the tab

### Developer Console Warning
When any visitor opens the browser console, a prominent warning message is displayed:
```
🔒 PreviewShield — Protected Content
This file is confidential. Every action on this page is logged.
Your IP address and identity have been recorded.
Attempting to extract or copy this content is a violation of the terms of service.
```

---

## 11. Visitor Tracking & Identity

Every file access is logged with:

- Full IP address (extracted from `x-forwarded-for` header, with proxy support)
- Geographic location: city, region, country, latitude, longitude
- Timezone and ISP/carrier
- Browser user agent
- HTTP referrer URL
- Client-supplied name (entered before viewing)
- Exact timestamp

This creates a full audit trail that can be used to identify who viewed a file, when, and from where.

---

## 12. Expiry & Deletion

Previews can be set to expire after a configurable number of hours (1 to 8760, or never). When a preview expires:

- The database record is deleted
- The uploaded file is deleted from disk
- All further access returns `410 Gone`

The file owner can also manually delete a preview at any time using their owner token, which triggers the same cleanup process.

---

## 13. Ownership & Access Control

- Every preview has a cryptographically random **owner token** (128-bit / 32-character hex string)
- The owner token is only revealed once at creation time and stored only in the database
- Dashboard access, deletion, and visit data retrieval all require the owner token
- Without the owner token, no write or admin operation on a preview is possible
- The owner token is **never included in preview page responses** — it cannot be discovered by a preview viewer

---

## What This Platform Cannot Guarantee

No DRM system is perfect. The following limitations apply:

- **Screen recording software** at the OS level (OBS, QuickTime) cannot be blocked by a web app
- **Physical camera** pointed at the screen is undetectable
- **Virtual machine or remote desktop** sessions bypass window-dimension DevTools detection
- Determined attackers with access to the source code of the browser can bypass client-side restrictions

PreviewShield's primary value is **raising the cost and traceability of theft**, not achieving absolute technical impossibility. The full audit trail (IP, name, location, timestamp) creates legal and reputational deterrence.

---

*PreviewShield is built by Rana Ammar Ahmad Khan — [appcloud41@gmail.com](mailto:appcloud41@gmail.com) — [github.com/RanaAmmarAhmad](https://github.com/RanaAmmarAhmad)*
