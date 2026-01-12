import express from "express";
import path from "path";
import fs from "fs/promises";
import { eq } from "drizzle-orm";

import db from "../db/db";
import { emotes } from "../db/schemas/emotes-schema";

const router = express.Router();

const EMOTES_DIR = process.env.EMOTES_DIR || "/data/emotes";

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await db
            .select()
            .from(emotes)
            .where(eq(emotes.id, id))
            .limit(1);

        if (existing.length === 0) return res.status(404).json({ error: "Emote not found" });

        const emote = existing[0];
        const filepath = path.join(EMOTES_DIR, emote.filename);

        try {
            await fs.unlink(filepath);
        } catch (err) {
            console.warn(`Could not delete emote file ${filepath}:`, err);
        }

        await db.delete(emotes).where(eq(emotes.id, id));

        return res.json({
            message: "Emote deleted successfully",
            deleted: {
                id: emote.id,
                name: emote.name,
            },
        });
    } catch (error) {
        console.error("Failed to delete emote:", error);
        return res.status(500).json({ error: "Failed to delete emote" });
    }
});

export default router;
