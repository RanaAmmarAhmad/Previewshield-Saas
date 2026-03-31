import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, previewsTable, visitsTable } from "@workspace/db";
import {
  CreatePreviewBody,
  GetPreviewParams,
  GetPreviewQueryParams,
  RecordVisitParams,
  RecordVisitBody,
  GetPreviewVisitsParams,
  GetPreviewVisitsQueryParams,
  GetPreviewStatsParams,
  GetPreviewStatsQueryParams,
} from "@workspace/api-zod";
import { createHash, createHmac, randomBytes } from "crypto";
import fs from "fs";
import path from "path";

const router: IRouter = Router();

const SESSION_SECRET = process.env.SESSION_SECRET || "previewshield-secret-key-change-in-prod";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

function generateId(): string {
  return randomBytes(8).toString("hex");
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function generateStreamToken(previewId: string): string {
  const bucket = Math.floor(Date.now() / (10 * 60 * 1000));
  return createHmac("sha256", SESSION_SECRET)
    .update(`stream:${previewId}:${bucket}`)
    .digest("hex");
}

function validateStreamToken(previewId: string, token: string): boolean {
  const now = Math.floor(Date.now() / (10 * 60 * 1000));
  for (const bucket of [now, now - 1, now - 2]) {
    const expected = createHmac("sha256", SESSION_SECRET)
      .update(`stream:${previewId}:${bucket}`)
      .digest("hex");
    if (token === expected) return true;
  }
  return false;
}

function deleteUploadedFile(fileUrl: string | null | undefined): void {
  if (!fileUrl) return;
  try {
    const filename = fileUrl.split("/").pop();
    if (filename) {
      const filePath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch {
    // ignore cleanup errors
  }
}

function isExpired(preview: { expiresAt: Date | null }): boolean {
  if (!preview.expiresAt) return false;
  return new Date() > new Date(preview.expiresAt);
}

router.post("/previews", async (req, res): Promise<void> => {
  const parsed = CreatePreviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const id = generateId();
  const ownerToken = randomBytes(16).toString("hex");
  const passwordHash = data.password ? hashPassword(data.password) : null;

  // expiresInHours: null = never, not provided = default 24h
  let expiresAt: Date | null = null;
  const expiresInHours = (data as any).expiresInHours;
  if (expiresInHours === null) {
    expiresAt = null; // never
  } else {
    const hours = typeof expiresInHours === "number" ? expiresInHours : 24;
    expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  const [preview] = await db
    .insert(previewsTable)
    .values({
      id,
      freelancerName: data.freelancerName,
      agencyName: data.agencyName ?? null,
      clientName: null,
      fileName: data.fileName,
      fileType: data.fileType,
      fileMimeType: data.fileMimeType,
      fileSize: data.fileSize,
      fileUrl: data.fileUrl ?? null,
      passwordHash,
      ownerToken,
      expiresAt,
    })
    .returning();

  if (!preview) {
    res.status(500).json({ error: "server_error", message: "Failed to create preview" });
    return;
  }

  const previewUrl = `/preview/${preview.id}`;

  res.status(201).json({
    id: preview.id,
    freelancerName: preview.freelancerName,
    agencyName: preview.agencyName ?? null,
    fileName: preview.fileName,
    fileType: preview.fileType,
    fileMimeType: preview.fileMimeType,
    fileSize: preview.fileSize,
    hasPassword: !!preview.passwordHash,
    previewUrl,
    ownerToken: preview.ownerToken,
    createdAt: preview.createdAt,
    expiresAt: preview.expiresAt ?? null,
  });
});

router.get("/previews/dashboard", async (req, res): Promise<void> => {
  const ownerToken = req.query.ownerToken as string;
  if (!ownerToken) {
    res.status(400).json({ error: "validation_error", message: "ownerToken is required" });
    return;
  }

  const [preview] = await db
    .select()
    .from(previewsTable)
    .where(eq(previewsTable.ownerToken, ownerToken));

  if (!preview) {
    res.status(404).json({ error: "not_found", message: "No preview found with that Tracking UID" });
    return;
  }

  if (isExpired(preview)) {
    deleteUploadedFile(preview.fileUrl);
    await db.delete(previewsTable).where(eq(previewsTable.id, preview.id));
    res.status(410).json({ error: "expired", message: "This preview has expired and been deleted" });
    return;
  }

  const visits = await db
    .select()
    .from(visitsTable)
    .where(eq(visitsTable.previewId, preview.id))
    .orderBy(visitsTable.visitedAt);

  const uniqueIps = new Set(visits.filter((v) => v.ipAddress).map((v) => v.ipAddress)).size;
  const lastVisitAt = visits.length > 0 ? visits[visits.length - 1]!.visitedAt : null;

  res.json({
    previewId: preview.id,
    freelancerName: preview.freelancerName,
    agencyName: preview.agencyName ?? null,
    fileName: preview.fileName,
    fileType: preview.fileType,
    hasPassword: !!preview.passwordHash,
    createdAt: preview.createdAt,
    expiresAt: preview.expiresAt ?? null,
    previewUrl: `/preview/${preview.id}`,
    totalVisits: visits.length,
    uniqueIps,
    lastVisitAt: lastVisitAt ?? null,
    recentVisits: visits.map((v) => ({
      id: v.id,
      clientName: v.clientName ?? null,
      ipAddress: v.ipAddress ?? null,
      visitedAt: v.visitedAt,
    })),
  });
});

router.delete("/previews/delete", async (req, res): Promise<void> => {
  const ownerToken = req.query.ownerToken as string;
  if (!ownerToken) {
    res.status(400).json({ error: "validation_error", message: "ownerToken is required" });
    return;
  }

  const [preview] = await db
    .select()
    .from(previewsTable)
    .where(eq(previewsTable.ownerToken, ownerToken));

  if (!preview) {
    res.status(404).json({ error: "not_found", message: "No preview found with that Tracking UID" });
    return;
  }

  deleteUploadedFile(preview.fileUrl);
  await db.delete(previewsTable).where(eq(previewsTable.id, preview.id));

  res.json({ success: true, message: "Preview deleted successfully" });
});

router.get("/previews/:id", async (req, res): Promise<void> => {
  const params = GetPreviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "validation_error", message: params.error.message });
    return;
  }

  const query = GetPreviewQueryParams.safeParse(req.query);

  const [preview] = await db
    .select()
    .from(previewsTable)
    .where(eq(previewsTable.id, params.data.id));

  if (!preview) {
    res.status(404).json({ error: "not_found", message: "Preview not found" });
    return;
  }

  if (isExpired(preview)) {
    deleteUploadedFile(preview.fileUrl);
    await db.delete(previewsTable).where(eq(previewsTable.id, preview.id));
    res.status(410).json({ error: "expired", message: "This preview has expired and been deleted" });
    return;
  }

  if (preview.passwordHash) {
    const providedPassword = query.success ? query.data.password : undefined;
    if (!providedPassword) {
      res.status(401).json({ error: "password_required", message: "This preview is password protected" });
      return;
    }
    if (hashPassword(providedPassword) !== preview.passwordHash) {
      res.status(401).json({ error: "wrong_password", message: "Incorrect password" });
      return;
    }
  }

  const streamToken = generateStreamToken(preview.id);

  res.json({
    id: preview.id,
    freelancerName: preview.freelancerName,
    agencyName: preview.agencyName ?? null,
    fileName: preview.fileName,
    fileType: preview.fileType,
    fileMimeType: preview.fileMimeType,
    fileSize: preview.fileSize,
    hasPassword: !!preview.passwordHash,
    streamToken,
    createdAt: preview.createdAt,
    expiresAt: preview.expiresAt ?? null,
  });
});

router.get("/previews/:id/stream", async (req, res): Promise<void> => {
  const { id } = req.params;
  const token = req.query.t as string | undefined;

  if (!token || !validateStreamToken(id, token)) {
    res.status(403).json({ error: "forbidden", message: "Invalid or expired stream token" });
    return;
  }

  const [preview] = await db
    .select()
    .from(previewsTable)
    .where(eq(previewsTable.id, id));

  if (!preview) {
    res.status(404).json({ error: "not_found", message: "Preview not found" });
    return;
  }

  if (isExpired(preview)) {
    deleteUploadedFile(preview.fileUrl);
    await db.delete(previewsTable).where(eq(previewsTable.id, preview.id));
    res.status(410).json({ error: "expired", message: "Preview expired" });
    return;
  }

  if (!preview.fileUrl) {
    res.status(404).json({ error: "not_found", message: "No file attached to this preview" });
    return;
  }

  const filename = preview.fileUrl.split("/").pop();
  if (!filename) {
    res.status(404).json({ error: "not_found", message: "File not found" });
    return;
  }

  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "not_found", message: "File not found on disk" });
    return;
  }

  const stat = fs.statSync(filePath);
  res.setHeader("Content-Type", preview.fileMimeType || "application/octet-stream");
  res.setHeader("Content-Length", stat.size);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Disposition", "inline");

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

router.post("/previews/:id/visit", async (req, res): Promise<void> => {
  const params = RecordVisitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "validation_error", message: params.error.message });
    return;
  }

  const body = RecordVisitBody.safeParse(req.body);

  const [preview] = await db
    .select()
    .from(previewsTable)
    .where(eq(previewsTable.id, params.data.id));

  if (!preview) {
    res.status(404).json({ error: "not_found", message: "Preview not found" });
    return;
  }

  const ipAddress =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    null;

  const visitId = generateId();
  await db.insert(visitsTable).values({
    id: visitId,
    previewId: params.data.id,
    clientName: body.success ? ((body.data as any).clientName ?? null) : null,
    ipAddress,
    userAgent: body.success ? (body.data.userAgent ?? null) : null,
    referrer: body.success ? (body.data.referrer ?? null) : null,
  });

  res.json({ success: true, visitId });
});

router.get("/previews/:id/visits", async (req, res): Promise<void> => {
  const params = GetPreviewVisitsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "validation_error", message: params.error.message });
    return;
  }

  const query = GetPreviewVisitsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "validation_error", message: "ownerToken is required" });
    return;
  }

  const [preview] = await db
    .select()
    .from(previewsTable)
    .where(eq(previewsTable.id, params.data.id));

  if (!preview) {
    res.status(404).json({ error: "not_found", message: "Preview not found" });
    return;
  }

  if (preview.ownerToken !== query.data.ownerToken) {
    res.status(403).json({ error: "forbidden", message: "Invalid owner token" });
    return;
  }

  const visits = await db
    .select()
    .from(visitsTable)
    .where(eq(visitsTable.previewId, params.data.id))
    .orderBy(visitsTable.visitedAt);

  res.json({
    visits: visits.map((v) => ({
      id: v.id,
      previewId: v.previewId,
      clientName: v.clientName ?? null,
      ipAddress: v.ipAddress ?? null,
      userAgent: v.userAgent ?? null,
      referrer: v.referrer ?? null,
      visitedAt: v.visitedAt,
    })),
    total: visits.length,
  });
});

router.get("/previews/:id/stats", async (req, res): Promise<void> => {
  const params = GetPreviewStatsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "validation_error", message: params.error.message });
    return;
  }

  const query = GetPreviewStatsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "validation_error", message: "ownerToken is required" });
    return;
  }

  const [preview] = await db
    .select()
    .from(previewsTable)
    .where(eq(previewsTable.id, params.data.id));

  if (!preview) {
    res.status(404).json({ error: "not_found", message: "Preview not found" });
    return;
  }

  if (preview.ownerToken !== query.data.ownerToken) {
    res.status(403).json({ error: "forbidden", message: "Invalid owner token" });
    return;
  }

  const visits = await db
    .select()
    .from(visitsTable)
    .where(eq(visitsTable.previewId, params.data.id))
    .orderBy(visitsTable.visitedAt);

  const uniqueIps = new Set(visits.filter((v) => v.ipAddress).map((v) => v.ipAddress)).size;
  const lastVisitAt = visits.length > 0 ? visits[visits.length - 1]!.visitedAt : null;

  res.json({
    previewId: params.data.id,
    totalVisits: visits.length,
    uniqueIps,
    lastVisitAt: lastVisitAt ?? null,
    recentVisits: visits.map((v) => ({
      id: v.id,
      previewId: v.previewId,
      clientName: v.clientName ?? null,
      ipAddress: v.ipAddress ?? null,
      userAgent: v.userAgent ?? null,
      referrer: v.referrer ?? null,
      visitedAt: v.visitedAt,
    })),
  });
});

export default router;
