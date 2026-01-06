import express from 'express';
import { streamSettings, EmbedAccount } from '../db/schemas/settings-schema';
import db from '../db/db';

const router = express.Router();

type StreamSettingsPayload = {
    streamKey?: string;
    title?: string;
    description?: string;
    preferedEmbed?: EmbedAccount["platform"];
}


const verifyStreamSettingsPayload = (payload: any): payload is StreamSettingsPayload => {
    if (payload.streamKey && typeof payload.streamKey !== 'string') {
        return false;
    }

    if (payload.title && typeof payload.title !== 'string') {
        return false;
    }

    if (payload.description && typeof payload.description !== 'string') {
        return false;
    }

    if (payload.preferedEmbed && typeof payload.preferedEmbed !== 'string') {
        return false;
    }
    
    return true;
}

router.put('/stream-settings', async (req, res) => {
    const payload = req.body;

    if (!verifyStreamSettingsPayload(payload)) {
        return res.status(400).json({ error: 'Invalid payload structure' });
    }

    const result = await db
        .insert(streamSettings)
        .values({
            id: "default",
            streamKey: payload.streamKey || crypto.randomUUID(),
            preferedEmbed: payload.preferedEmbed || 'native',
            title: payload.title || 'Untitled Stream',
            description: payload.description || '',
            personalAccounts: [],
            supportedEmbeds: [],
        })
        .onConflictDoUpdate({
            target: streamSettings.id,
            set: {
                streamKey: payload.streamKey,
                preferedEmbed: payload.preferedEmbed,
                title: payload.title,
                description: payload.description,
            },
        })
        .returning()
        .then((rows) => rows[0]);

    return res.status(200).json({ success: true, data: result });
});

export default router;