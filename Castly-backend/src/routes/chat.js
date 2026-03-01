import { Router } from "express";
import { matchIdParamSchema } from "../validation/matches.js";
import { createChatSchema, listChatQuerySchema } from "../validation/chat.js";
import { chatMessages } from "../db/schema.js";
import { db } from "../db/db.js";
import { desc, eq } from "drizzle-orm";

const MAX_LIMIT = 100;
export const chatRouter = Router({ mergeParams: true });

// GET /matches/:id/chat?limit=50
chatRouter.get('/', async (req, res) => {
    const paramsResult = matchIdParamSchema.safeParse(req.params);
    if (!paramsResult.success) {
        return res.status(400).json({ error: "Invalid match id.", details: paramsResult.error.issues });
    }

    const queryResult = listChatQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
        return res.status(400).json({ error: "Invalid payload.", details: queryResult.error.issues });
    }

    try {
        const { id: matchId } = paramsResult.data;
        const { limit = 50 } = queryResult.data;
        const safeLimit = Math.min(limit, MAX_LIMIT);

        const results = await db
            .select()
            .from(chatMessages)
            .where(eq(chatMessages.matchId, matchId))
            .orderBy(desc(chatMessages.createdAt))
            .limit(safeLimit);

        res.status(200).json({ data: results });
    } catch (error) {
        console.error("Failed to fetch chat messages", error);
        return res.status(500).json({ error: "Failed to fetch chat messages" });
    }
});

// POST /matches/:id/chat
chatRouter.post('/', async (req, res) => {
    const paramsResult = matchIdParamSchema.safeParse(req.params);
    if (!paramsResult.success) {
        return res.status(400).json({ error: "Invalid match id.", details: paramsResult.error.issues });
    }

    const bodyResult = createChatSchema.safeParse(req.body);
    if (!bodyResult.success) {
        return res.status(400).json({ error: "Invalid payload.", details: bodyResult.error.issues });
    }

    try {
        const [result] = await db
            .insert(chatMessages)
            .values({
                matchId: paramsResult.data.id,
                author: bodyResult.data.author,
                message: bodyResult.data.message,
            })
            .returning();

        if (req.app.locals.broadcastChat) {
            req.app.locals.broadcastChat(result.matchId, result);
        }

        res.status(201).json({ data: result });
    } catch (error) {
        console.error("Failed to create chat message", error);
        return res.status(500).json({ error: "Failed to create chat message" });
    }
});
