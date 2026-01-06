import express from "express";
import { EmbedAccount, streamSettings } from "../../db/schemas/settings-schema";
import db from "../../db/db";
import { eq } from "drizzle-orm";
import redisClient from "../../db/redisClientPublish";

const router = express.Router();

type CommunityEmbedPayload = {
  platform: EmbedAccount["platform"];
  channelId: string;
  displayName: string;
};

const verifyCommunityEmbedPayload = (
  payload: any
): payload is CommunityEmbedPayload => {
  if (typeof payload !== "object" || payload === null) return false;

  if (typeof payload.platform !== "string") return false;
  if (typeof payload.channelId !== "string") return false;
  if (typeof payload.displayName !== "string") return false;

  if (payload.channelId.length === 0) return false;
  if (payload.displayName.length === 0) return false;

  return true;
};

router.post("/community-embed", async (req, res) => {
  const payload = req.body;

  if (!verifyCommunityEmbedPayload(payload)) {
    return res.status(400).json({ error: "Invalid payload structure" });
  }

  const { platform, channelId, displayName } = payload;

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

  const newEmbed = {
      platform,
      channelId: channelId || "",
      priority: 99,
      displayName: displayName || (channelId || ""),
      enabled: true,
  }

  settings.supportedEmbeds.push(newEmbed);

  const result = await db
    .update(streamSettings)
    .set({ supportedEmbeds: settings.supportedEmbeds })
    .where(eq(streamSettings.id, settings.id))
    .returning()
    .then((res) => res[0]);

  const redisResult = await redisClient.publish(
    "embed_update",
    JSON.stringify({
      type: "add",
      embed: newEmbed,
    })
  );

  if (redisResult === null) {
    console.error("Failed to publish embed update to Redis");
  }

  return res.status(200).json({ success: true, data: result });
});

export default router;
