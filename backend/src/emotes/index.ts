import express from "express";

import hasPermissions from "../middleware/hasPermissions";
import uploadEmoteRouter from "./uploadEmote";
import deleteEmoteRouter from "./deleteEmote";
import listEmotesRouter from "./listEmotes";

const router = express.Router();

const EMOTES_DIR = process.env.EMOTES_DIR || "/data/emotes";

router.use(
    "/files",
    express.static(EMOTES_DIR, {
        maxAge: "1y",
        immutable: true,
        setHeaders: (res) => {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        },
    })
);

router.use("/", listEmotesRouter);

router.use("/", hasPermissions(["manage_emotes"]), uploadEmoteRouter);
router.use("/", hasPermissions(["manage_emotes"]), deleteEmoteRouter);

export default router;
