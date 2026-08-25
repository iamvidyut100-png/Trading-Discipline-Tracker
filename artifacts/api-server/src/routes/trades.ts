import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, tradesTable } from "@workspace/db";
import {
  CreateTradeBody,
  CreateTradeResponse,
  DeleteTradeParams,
  GetAnalyticsSummaryResponse,
  GetTradeParams,
  GetTradeResponse,
  ListTradesResponse,
  UpdateTradeBody,
  UpdateTradeParams,
  UpdateTradeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeTrade(trade: typeof tradesTable.$inferSelect) {
  return {
    ...trade,
    disciplineScore: Number(trade.disciplineScore),
    pnl: trade.pnl == null ? null : Number(trade.pnl),
  };
}

router.get("/trades", async (_req, res): Promise<void> => {
  const trades = await db.select().from(tradesTable).orderBy(desc(tradesTable.createdAt));
  res.json(ListTradesResponse.parse(trades.map(serializeTrade)));
});

router.post("/trades", async (req, res): Promise<void> => {
  const parsed = CreateTradeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [trade] = await db.insert(tradesTable).values({
    ...parsed.data,
    disciplineScore: String(parsed.data.disciplineScore),
    pnl: parsed.data.pnl == null ? null : String(parsed.data.pnl),
  }).returning();
  res.status(201).json(CreateTradeResponse.parse(serializeTrade(trade)));
});

router.get("/trades/:id", async (req, res): Promise<void> => {
  const params = GetTradeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [trade] = await db.select().from(tradesTable).where(eq(tradesTable.id, params.data.id));
  if (!trade) {
    res.status(404).json({ error: "Trade not found" });
    return;
  }
  res.json(GetTradeResponse.parse(serializeTrade(trade)));
});

router.patch("/trades/:id", async (req, res): Promise<void> => {
  const params = UpdateTradeParams.safeParse(req.params);
  const parsed = UpdateTradeBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const patch: Partial<typeof tradesTable.$inferInsert> = {};
  if (parsed.data.result !== undefined) patch.result = parsed.data.result;
  if (parsed.data.beforeAnswers !== undefined) patch.beforeAnswers = parsed.data.beforeAnswers;
  if (parsed.data.duringAnswers !== undefined) patch.duringAnswers = parsed.data.duringAnswers;
  if (parsed.data.afterAnswers !== undefined) patch.afterAnswers = parsed.data.afterAnswers;
  if (parsed.data.screenshots !== undefined) patch.screenshots = parsed.data.screenshots;
  if (parsed.data.mistake !== undefined) patch.mistake = parsed.data.mistake;
  if (parsed.data.disciplineScore !== undefined) patch.disciplineScore = String(parsed.data.disciplineScore);
  if (parsed.data.pnl !== undefined) patch.pnl = parsed.data.pnl == null ? null : String(parsed.data.pnl);
  const [trade] = await db.update(tradesTable).set(patch).where(eq(tradesTable.id, params.data.id)).returning();
  if (!trade) {
    res.status(404).json({ error: "Trade not found" });
    return;
  }
  res.json(UpdateTradeResponse.parse(serializeTrade(trade)));
});

router.delete("/trades/:id", async (req, res): Promise<void> => {
  const params = DeleteTradeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [trade] = await db.delete(tradesTable).where(eq(tradesTable.id, params.data.id)).returning();
  if (!trade) {
    res.status(404).json({ error: "Trade not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/analytics/summary", async (_req, res): Promise<void> => {
  const trades = (await db.select().from(tradesTable).orderBy(desc(tradesTable.createdAt))).map(serializeTrade);
  const wins = trades.filter((trade) => trade.result === "WIN").length;
  const today = new Date().toISOString().slice(0, 10);
  const todaysTrades = trades.filter((trade) => trade.createdAt.toISOString().slice(0, 10) === today);
  let streak = 0;
  for (const trade of trades) {
    if (trade.result === "WIN") streak += 1;
    else break;
  }
  const summary = {
    todayTrades: todaysTrades.length,
    todayPnl: todaysTrades.reduce((sum, trade) => sum + (trade.pnl ?? 0), 0),
    winRate: trades.length ? (wins / trades.length) * 100 : 0,
    disciplineScore: trades.length ? trades.reduce((sum, trade) => sum + trade.disciplineScore, 0) / trades.length : 0,
    currentStreak: streak,
    totalTrades: trades.length,
    pnlSeries: trades.slice(0, 7).reverse().map((trade) => ({ label: new Date(trade.createdAt).toLocaleDateString("en-IN", { weekday: "short" }), value: trade.pnl ?? 0 })),
    disciplineSeries: trades.slice(0, 7).reverse().map((trade) => ({ label: new Date(trade.createdAt).toLocaleDateString("en-IN", { weekday: "short" }), value: trade.disciplineScore })),
  };
  res.json(GetAnalyticsSummaryResponse.parse(summary));
});

export default router;