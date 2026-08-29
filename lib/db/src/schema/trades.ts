import { createInsertSchema } from "drizzle-zod";
import { index, jsonb, numeric, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const tradesTable = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  result: text("result").notNull(),
  disciplineScore: numeric("discipline_score", { precision: 5, scale: 2 }).notNull(),
  beforeAnswers: jsonb("before_answers").notNull().default({}),
  duringAnswers: jsonb("during_answers").notNull().default({}),
  afterAnswers: jsonb("after_answers").notNull().default({}),
  screenshots: text("screenshots").array().notNull().default([]),
  pnl: numeric("pnl", { precision: 12, scale: 2 }),
  mistake: text("mistake").notNull().default("No mistake"),
}, (table) => [index("trades_user_id_idx").on(table.userId)]);

export const insertTradeSchema = createInsertSchema(tradesTable).omit({ id: true, createdAt: true });
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof tradesTable.$inferSelect;