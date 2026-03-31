import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pinoHttp from "pino-http";
import path from "path";
import { mkdirSync } from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ── Trust proxy headers (Replit sits behind a reverse proxy) ──────────────
app.set("trust proxy", 1);

// ── Request logging ───────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ── Security headers (helmet) ─────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        mediaSrc: ["'self'", "blob:"],
        frameSrc: ["'self'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "same-site" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xContentTypeOptions: true,
    xFrameOptions: { action: "sameorigin" },
    xXssProtection: false,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    hidePoweredBy: true,
    dnsPrefetchControl: { allow: false },
  }),
);

// ── CORS — only allow the known frontend origins ──────────────────────────
const allowedOrigins = [
  /\.replit\.dev$/,
  /\.repl\.co$/,
  /\.kirk\.replit\.dev$/,
  /localhost/,
  /127\.0\.0\.1/,
];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const ok = allowedOrigins.some((r) => r.test(origin));
      cb(ok ? null : new Error("Not allowed by CORS"), ok);
    },
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
    maxAge: 86400,
  }),
);

// ── Body parsing with strict size limits ─────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── Global rate limiter — 120 requests / 60 s per IP ─────────────────────
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate_limited", message: "Too many requests. Please slow down." },
});
app.use(globalLimiter);

// ── Stricter limiter for preview creation ─────────────────────────────────
const createLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate_limited", message: "Too many previews created. Please wait." },
});
app.use("/api/previews", (req, res, next) => {
  if (req.method === "POST" && req.path === "/") return createLimiter(req, res, next);
  next();
});

// ── Block all direct file access — only stream endpoint is valid ──────────
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
mkdirSync(UPLOADS_DIR, { recursive: true });

// NOTE: The /api/files static route is intentionally REMOVED.
// Files are served exclusively via /api/previews/:id/stream with a time-limited HMAC token.

// ── Remove server fingerprinting headers ──────────────────────────────────
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.removeHeader("X-Powered-By");
  res.removeHeader("Server");
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────
app.use("/api", router);

// ── 404 handler — never reveal route structure ────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "not_found" });
});

// ── Error handler — never leak stack traces ───────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "server_error", message: "An unexpected error occurred." });
});

export default app;
