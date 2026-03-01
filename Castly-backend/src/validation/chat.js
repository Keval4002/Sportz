import { z } from 'zod';

export const listChatQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createChatSchema = z.object({
    author: z.string().min(1).max(50),
    message: z.string().min(1).max(500),
});
