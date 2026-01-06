import express from "express";
import { EmbedAccount, streamSettings } from "../../db/schemas/settings-schema";
import db from "../../db/db";
import { eq } from "drizzle-orm";
import redisClient from "../../db/redisClientPublish";

const router = express.Router();

type CommunityEmbedPayload = {
  platform: EmbedAccount["platform"];
  channelId: string;
};

const verifyCommunityEmbedPayload = (
  payload: any
): payload is CommunityEmbedPayload => {
  if (typeof payload !== "object" || payload === null) return false;

  if (typeof payload.platform !== "string") return false;
  if (typeof payload.channelId !== "string") return false;

  if (payload.channelId.length === 0) return false;

  return true;
};

router.delete("/community-embed", async (req, res) => {
  const payload = req.body;

  if (!verifyCommunityEmbedPayload(payload)) {
    return res.status(400).json({ error: "Invalid payload structure" });
  }

  const { platform, channelId } = payload;

  const settings = await db
    .select()
    .from(streamSettings)
    .limit(1)
    .then((res) => res[0]);

  if (!settings) {
    return res
      .status(404)
      .json({
        error: "Stream settings not found, cannot update Community embed",
      });
  }

  settings.supportedEmbeds = settings.supportedEmbeds.filter(
    (embed) => !(embed.platform === platform && embed.channelId === channelId)
  );

  const result = await db
    .update(streamSettings)
    .set({ supportedEmbeds: settings.supportedEmbeds })
    .where(eq(streamSettings.id, settings.id))
    .returning()
    .then((res) => res[0]);
  
  const redisResult = await redisClient.publish(
    "embed_update",
    JSON.stringify({
      type: "remove",
      embed: {
        platform,
        channelId,
      }
    })
  );

  if (redisResult === null) {
    console.error("failed to publish embed update to redis");
  }

  return res.status(200).json({ success: true, data: result });
});

export default router;
