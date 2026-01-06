import express from "express";
import { EmbedAccount, streamSettings } from "../db/schemas/settings-schema";
import db from "../db/db";
import { eq } from "drizzle-orm";

const router = express.Router();

type PersonalEmbedPayload = {
  platform: EmbedAccount["platform"];
  channelId?: string;
  enabled?: boolean;
};

const verifyPersonalEmbedPayload = (
  payload: any
): payload is PersonalEmbedPayload => {
  if (typeof payload !== "object" || payload === null) return false;

  if (typeof payload.platform !== "string") return false;
  if (payload.channelId !== undefined && typeof payload.channelId !== "string") return false;
  if (payload.enabled !== undefined && typeof payload.enabled !== "boolean") return false;

  return true;
};

router.put("/personal-embed", async (req, res) => {
  const payload = req.body;

  if (!verifyPersonalEmbedPayload(payload)) {
    return res.status(400).json({ error: "Invalid payload structure" });
  }

  const { platform, channelId, enabled } = payload;

  const settings = await db
    .select()
    .from(streamSettings)
    .limit(1)
    .then((res) => res[0]);

  if (!settings) {
    return res
      .status(404)
      .json({
        error: "Stream settings not found, cannot update personal embed",
      });
  }

  if (!settings.personalAccounts.some((acc) => acc.platform === platform)) {
    settings.personalAccounts.push({
        platform,
        channelId: channelId || "",
        priority: 99,
        displayName: process.env.ADMIN_USERNAME || (channelId || ""),
        enabled: enabled !== undefined ? enabled : true,
      });
  }

  const updatedPersonalAccounts = settings.personalAccounts.map((account) => {
    if (account.platform !== platform) return account;

    return {
      ...account,
      displayName: process.env.ADMIN_USERNAME || account.channelId,
      channelId: channelId !== undefined ? channelId : account.channelId,
      enabled: enabled !== undefined ? enabled : account.enabled,
    };
  });

  const result = await db
    .update(streamSettings)
    .set({ personalAccounts: updatedPersonalAccounts })
    .where(eq(streamSettings.id, settings.id))
    .returning()
    .then((res) => res[0]);

  return res.status(200).json({ success: true, data: result });
});

export default router;
