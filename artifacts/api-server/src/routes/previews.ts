import { Router, type IRouter } from "express";
import { eq, count, countDistinct } from "drizzle-orm";
import { db, previewsTable, visitsTable } from "@workspace/db";
import {
  CreatePreviewBody,
  GetPreviewParams,
  GetPreviewQueryParams,
  RecordVisitParams,
  RecordVisitBody,
  GetPreviewVisitsParams,
  GetPreviewVisitsQueryParams,
  GetUploadUrlParams,
  GetUploadUrlBody,
  GetPreviewStatsParams,
  GetPreviewStatsQueryParams,
} from "@workspace/api-zod";
import { createHash, randomBytes } from "crypto";

const router: IRouter = Router();

function generateId(): string {
  return randomBytes(8).toString("hex");
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
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

  const [preview] = await db
    .insert(previewsTable)
    .values({
      id,
      freelancerName: data.freelancerName,
      agencyName: data.agencyName ?? null,
      clientName: data.clientName,
      fileName: data.fileName,
      fileType: data.fileType,
      fileMimeType: data.fileMimeType,
      fileSize: data.fileSize,
      fileUrl: data.fileUrl ?? null,
      passwordHash,
      ownerToken,
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
    clientName: preview.clientName,
    fileName: preview.fileName,
    fileType: preview.fileType,
    fileMimeType: preview.fileMimeType,
    fileSize: preview.fileSize,
    fileUrl: preview.fileUrl ?? null,
    hasPassword: !!preview.passwordHash,
    previewUrl,
    ownerToken: preview.ownerToken,
    createdAt: preview.createdAt,
    expiresAt: preview.expiresAt ?? null,
  });
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

  res.json({
    id: preview.id,
    freelancerName: preview.freelancerName,
    agencyName: preview.agencyName ?? null,
    clientName: preview.clientName,
    fileName: preview.fileName,
    fileType: preview.fileType,
    fileMimeType: preview.fileMimeType,
    fileSize: preview.fileSize,
    fileUrl: preview.fileUrl ?? null,
    hasPassword: !!preview.passwordHash,
    createdAt: preview.createdAt,
  });
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
      ipAddress: v.ipAddress ?? null,
      userAgent: v.userAgent ?? null,
      referrer: v.referrer ?? null,
      visitedAt: v.visitedAt,
    })),
    total: visits.length,
  });
});

router.post("/previews/:id/upload-url", async (req, res): Promise<void> => {
  const params = GetUploadUrlParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "validation_error", message: params.error.message });
    return;
  }

  const body = GetUploadUrlBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "validation_error", message: body.error.message });
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

  const uploadUrl = `/api/previews/${params.data.id}/file`;
  const fileUrl = `/api/previews/${params.data.id}/file`;

  res.json({ uploadUrl, fileUrl });
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
  const recentVisits = visits.slice(-5).reverse();

  res.json({
    previewId: params.data.id,
    totalVisits: visits.length,
    uniqueIps,
    lastVisitAt: lastVisitAt ?? null,
    recentVisits: recentVisits.map((v) => ({
      id: v.id,
      previewId: v.previewId,
      ipAddress: v.ipAddress ?? null,
      userAgent: v.userAgent ?? null,
      referrer: v.referrer ?? null,
      visitedAt: v.visitedAt,
    })),
  });
});

export default router;
