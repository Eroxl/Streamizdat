import express from "express";
import multer from "multer";
import sharp from "sharp";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";
import { eq } from "drizzle-orm";

import db from "../db/db";
import { emotes } from "../db/schemas/emotes-schema";

const router = express.Router();

const EMOTES_DIR = process.env.EMOTES_DIR || "/data/emotes";
const EMOTE_HEIGHT = 128;
const MAX_FILE_SIZE = 512 * 1024;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
    fileFilter: (_req, file, cb) => {
        const allowedMimes = [
            "image/webp",
            "image/png",
            "image/jpeg",
            "image/gif",
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only WebP, PNG, JPEG, and GIF images are allowed"));
        }
    },
});

const sanitizeEmoteName = (name: string): string | null => {
    const sanitized = name.trim();

    if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) return null;
    if (sanitized.length < 2 || sanitized.length > 32) return null;
    
    return sanitized;
};

router.post("/", upload.single("emote"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const emoteName = sanitizeEmoteName(req.body.name || "");
        if (!emoteName) {
            return res.status(400).json({
                error: "Invalid emote name. Must be 2-32 characters, alphanumeric with underscores and hyphens only.",
            });
        }

        const existing = await db
            .select({ id: emotes.id, filename: emotes.filename })
            .from(emotes)
            .where(eq(emotes.name, emoteName))
            .limit(1);

        const image = sharp(req.file.buffer, { animated: true });
        const metadata = await image.metadata();

        const aspectRatio = (metadata.width || 32) / ((metadata.pages ? metadata.pageHeight : metadata.height) || 32);
        const newHeight = EMOTE_HEIGHT;
        const newWidth = Math.round(newHeight * aspectRatio);

        const processedBuffer = await image
            .resize(newWidth, newHeight, {
                fit: "contain",
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .webp({
                quality: 80,
                loop: 0,
                effort: 6,
            })
            .toBuffer();

        if (processedBuffer.length > 128 * 1024) {
            return res.status(400).json({
                error: "Processed emote exceeds 128KB. Try a simpler image.",
            });
        }

        const hash = crypto
            .createHash("sha256")
            .update(processedBuffer)
            .digest("hex")
            .substring(0, 12);

        const filename = `${emoteName}-${hash}.webp`;
        const filepath = path.join(EMOTES_DIR, filename);

        await fs.mkdir(EMOTES_DIR, { recursive: true });

        if (existing.length > 0) {
            const oldFilepath = path.join(EMOTES_DIR, existing[0].filename);
            try {
                await fs.unlink(oldFilepath);
            } catch {}

            await db
                .update(emotes)
                .set({
                    filename,
                    width: newWidth,
                    height: newHeight,
                })
                .where(eq(emotes.id, existing[0].id));

            await fs.writeFile(filepath, processedBuffer);

            return res.json({
                message: "Emote replaced successfully",
                emote: {
                    id: existing[0].id,
                    name: emoteName,
                    filename,
                    width: newWidth,
                    height: newHeight,
                    url: `/emotes/files/${filename}`,
                },
            });
        }

        await fs.writeFile(filepath, processedBuffer);

        const userId = (req as any).user?.id;
        if (!userId) {
            await fs.unlink(filepath);
            return res.status(401).json({ error: "User not authenticated" });
        }

        const emoteId = crypto.randomUUID();
        await db.insert(emotes).values({
            id: emoteId,
            name: emoteName,
            filename,
            width: newWidth,
            height: newHeight,
            uploadedBy: userId,
        });

        return res.status(201).json({
            message: "Emote uploaded successfully",
            emote: {
                id: emoteId,
                name: emoteName,
                filename,
                width: newWidth,
                height: newHeight,
                url: `/emotes/files/${filename}`,
            },
        });
    } catch (error) {
        console.error("Failed to upload emote:", error);

        if (error instanceof multer.MulterError) {
            if (error.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ error: "File too large. Max 512KB." });
            }
        }

        if (error instanceof Error) {
            return res.status(400).json({ error: error.message });
        }
        
        return res.status(500).json({ error: "Failed to upload emote" });
    }
});

export default router;
