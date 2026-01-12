import express from "express";
import db from "../db/db";
import { emotes } from "../db/schemas/emotes-schema";

const router = express.Router();

router.get("/", async (_, res) => {
    try {
        const allEmotes = await db.select({
            id: emotes.id,
            name: emotes.name,
            filename: emotes.filename,
            width: emotes.width,
            height: emotes.height,
            createdAt: emotes.createdAt,
        }).from(emotes);

        return res.json({
            emotes: allEmotes,
            baseUrl: "/emotes/files/",
        });
    } catch (error) {
        console.error("Failed to list emotes:", error);
        return res.status(500).json({ error: "Failed to list emotes" });
    }
});

export default router;
