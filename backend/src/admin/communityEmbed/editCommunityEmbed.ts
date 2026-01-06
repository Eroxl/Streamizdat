import express from "express";
import { EmbedAccount, streamSettings } from "../../db/schemas/settings-schema";
import db from "../../db/db";
import { eq } from "drizzle-orm";
import redisClient from "../../db/redisClientPublish";

const router = express.Router();

type CommunityEmbedPayload = {
  oldPlatform: EmbedAccount["platform"];
  newPlatform?: EmbedAccount["platform"];
  
  oldChannelId: string;
  newChannelId?: string;
  
  displayName?: string;
  enabled?: boolean;
};

const verifyCommunityEmbedPayload = (
  payload: any
): payload is CommunityEmbedPayload => {
  if (typeof payload !== "object" || payload === null) return false;

  if (typeof payload.oldPlatform !== "string") return false;
  if (payload.newPlatform !== undefined && typeof payload.newPlatform !== "string")
    return false;

  if (typeof payload.oldChannelId !== "string") return false;
  if (payload.newChannelId !== undefined && typeof payload.newChannelId !== "string")
    return false;

  if (
    payload.displayName !== undefined &&
    typeof payload.displayName !== "string"
  )
    return false;

  if (payload.enabled !== undefined && typeof payload.enabled !== "boolean")
    return false;

  if (payload.oldChannelId.length === 0) return false;

  return true;
};

router.put("/community-embed", async (req, res) => {
  const payload = req.body;

  if (!verifyCommunityEmbedPayload(payload)) {
    return res.status(400).json({ error: "Invalid payload structure" });
  }

  const { oldPlatform, oldChannelId, newPlatform, newChannelId, displayName, enabled } = payload;

  const settings = await db
    .select()
    .from(streamSettings)
    .limit(1)
    .then((res) => res[0]);

  if (!settings) {
    return res.status(404).json({
      error: "Stream settings not found, cannot update Community embed",
    });
  }

  settings.supportedEmbeds = settings.supportedEmbeds.map((account) => {
    if (account.platform !== oldPlatform || account.channelId !== oldChannelId) return account;
    
    return {
      ...account,
      channelId: newChannelId || account.channelId,
      displayName: displayName || account.displayName,
      platform: newPlatform || account.platform,
      enabled: enabled !== undefined ? enabled : account.enabled,
    };
  });

  const result = await db
    .update(streamSettings)
    .set({ supportedEmbeds: settings.supportedEmbeds })
    .where(eq(streamSettings.id, settings.id))
    .returning()
    .then((res) => res[0]);
  
  const deleteRedisResult = await redisClient.publish(
    "embed_update",
    JSON.stringify({
      type: "remove",
      embed: {
        platform: oldPlatform,
        channelId: oldChannelId,
      }
    })
  );

  if (deleteRedisResult === null) {
    console.error("failed to publish embed update to redis");
  }

  const addRedisResult = await redisClient.publish(
    "embed_update",
    JSON.stringify({
      type: "add",
      embed: {
        platform: newPlatform || oldPlatform,
        channelId: newChannelId || oldChannelId,
        displayName: displayName || (newChannelId || oldChannelId),
        enabled: enabled !== undefined ? enabled : true,
      }
    })
  );

  if (addRedisResult === null) {
    console.error("failed to publish embed update to redis");
  }
  
  return res.status(200).json({ success: true, data: result });
});

export default router;
