import { Router } from "express";
import { listMatchesQuerySchema, matchIdParamSchema } from "../validation/matches.js";
import { createCommentarySchema, listCommentaryQuerySchema } from "../validation/commentary.js";
import { commentary } from "../db/schema.js";
import { db } from "../db/db.js";
import { desc, eq } from "drizzle-orm";

const MAX_LIMIT = 100;
export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get('/', async (req, res)=>{
    // res.status(200).json({message: 'Commentary List'});
    const paramsResult = matchIdParamSchema.safeParse(req.params);
    if(!paramsResult.success){
        return res.status(400).json({error:"Invalid match id.", details: paramsResult.error.issues});
    }

    const queryResult = listCommentaryQuerySchema.safeParse(req.query);
    if(!queryResult.success){
        return res.status(400).json({error: "Invalid payload.", details:queryResult.error.issues});
    }

    try {
    const {id: matchId} = paramsResult.data;
    const {limit = 10} = queryResult.data;

    const safeLimit = Math.min(limit, MAX_LIMIT);

    const results = await db.select().from(commentary).where(eq(commentary.matchId, matchId)).orderBy(desc(commentary.createdAt)).limit(safeLimit);

       res.status(200).json({data: results});

    } catch (error) {
        console.error("Failed to fetch commentary", error);
        return res.status(500).json({error:"Failed to fetch commentary"});
    }
})

commentaryRouter.post('/', async (req, res)=>{
    const paramsResult = matchIdParamSchema.safeParse(req.params);
    if(!paramsResult.success){
        return res.status(400).json({error: "Invalid match id.", details: paramsResult.error.issues});
    }
    const bodyResult = createCommentarySchema.safeParse(req.body);
    if(!bodyResult.success){
        return res.status(400).json({error: "Invalid payload", details: bodyResult.error.issues});
    }

    try {
        const {minutes, ...rest} = bodyResult.data;
        const [result] = await db.insert(commentary).values({
            matchId: paramsResult.data.id,
            minutes: minutes,
            ...rest
        }).returning();

        if(req.app.locals.broadcastCommentary){
            req.app.locals.broadcastCommentary(result.matchId, result)
        }

        res.status(201).json({data: result});
    } catch (error) {
        console.error('Failed to create commentary', error);
        return res.status(500).json({error: "Failed to create commentary"});
    }
})

