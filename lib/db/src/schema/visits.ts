import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const visitsTable = pgTable("visits", {
  id: text("id").primaryKey(),
  previewId: text("preview_id").notNull(),
  clientName: text("client_name"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  city: text("city"),
  region: text("region"),
  country: text("country"),
  visitedAt: timestamp("visited_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVisitSchema = createInsertSchema(visitsTable).omit({ visitedAt: true });
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type Visit = typeof visitsTable.$inferSelect;
