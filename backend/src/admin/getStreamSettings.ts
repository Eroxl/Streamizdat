import express from 'express';
import { streamSettings } from '../db/schemas/settings-schema';
import db from '../db/db';
import { eq } from 'drizzle-orm';

const router = express.Router();


router.get('/stream-settings', async (_, res) => {
    const settings = await db
        .select()
        .from(streamSettings)
        .where(eq(streamSettings.id, 'default'))
        .limit(1)
        .then((rows) => rows[0]);

    if (!settings) {
        return res.status(404).json({ error: 'Stream settings not found' });
    }

    return res.json({ success: true, settings });
});

export default router;