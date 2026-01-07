import createOnNotifyListener from "./createOnNotifyListener";
import Embed from "./types/Embed";
import type { Client, Pool } from "pg";
import { WATCHERS } from "./watchers";
import StatusCache from "./types/StatusCache";
import { RedisClientType } from "redis";

type StreamSettings = {
    personal_accounts: Embed[];
    supported_embeds: Embed[];
}

const loadDBEmbeds = async (pgClient: Client | Pool, previousStatuses: StatusCache, redisClient: RedisClientType<any,any,any>) => {
    Object.values(WATCHERS).forEach(watcher => watcher.unSubscribeAll());

    const updatedPlatformSettings = (await pgClient.query('SELECT * FROM stream_settings')).rows[0] as StreamSettings;

    const updatedEmbeds = [
        ...(updatedPlatformSettings.personal_accounts || []),
        ...(updatedPlatformSettings.supported_embeds || []),
    ];

    updatedEmbeds.forEach(async (embed) => {
        if (!embed.enabled) return;

        const watcher = WATCHERS[embed.platform as keyof typeof WATCHERS];
        if (!watcher) return;

        watcher.subscribe(embed.channelId, createOnNotifyListener(embed, previousStatuses, redisClient));
    });
}

export default loadDBEmbeds;
