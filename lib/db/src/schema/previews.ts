import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const previewsTable = pgTable("previews", {
  id: text("id").primaryKey(),
  freelancerName: text("freelancer_name").notNull(),
  agencyName: text("agency_name"),
  clientName: text("client_name"),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileMimeType: text("file_mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  fileUrl: text("file_url"),
  passwordHash: text("password_hash"),
  ownerToken: text("owner_token").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const insertPreviewSchema = createInsertSchema(previewsTable).omit({ createdAt: true });
export type InsertPreview = z.infer<typeof insertPreviewSchema>;
export type Preview = typeof previewsTable.$inferSelect;
