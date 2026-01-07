import type { RedisClientType, RedisFunctions, RedisModules, RedisScripts } from "redis";

type RedisClient = RedisClientType<RedisModules, RedisFunctions, RedisScripts>;
import Embed from "../types/Embed";
import { WATCHERS } from "../watchers";
import createOnNotifyListener from "../createOnNotifyListener";
import StatusCache from "../types/StatusCache";

type EmbedUpdateCommand = {
    type: "add";
    embed: Embed;
} | {
    type: "remove";
    embed: Pick<Embed, 'platform' | 'channelId'>;
}

const addEmbed = (embed: Embed, previousStatuses: StatusCache, redisClient: RedisClient) => {
    if (!embed.enabled) return;

    const watcher = WATCHERS[embed.platform as keyof typeof WATCHERS];
    if (!watcher) return;

    const notifyListener = createOnNotifyListener(embed, previousStatuses, redisClient);
    watcher.subscribe(embed.channelId,  notifyListener);

    watcher.checkStatus(embed.channelId).then((status) => {
        notifyListener(status?.isLive ? "live" : "offline", status?.liveUrl);
    });
}

const deleteEmbed = (embed: Pick<Embed, 'platform' | 'channelId'>, previousStatuses: StatusCache, redisClient: RedisClient) => {
    const { platform, channelId } = embed;

    const watcher = WATCHERS[platform as keyof typeof WATCHERS];
    if (!watcher) return;

    watcher.unsubscribe(channelId);
    previousStatuses[channelId] = "offline";
    
    redisClient.publish('stream_status', JSON.stringify({
        platform,
        channelId,
        status: "offline",
        embedUrl: undefined,
    })); 
}

const handleEmbedUpdate = async (message: string, previousStatuses: StatusCache, redisClient: RedisClient) => {
    const updatedEmbed = JSON.parse(message) as EmbedUpdateCommand;

    if (updatedEmbed.type === "add") {
        addEmbed(updatedEmbed.embed, previousStatuses, redisClient);
    } else if (updatedEmbed.type === "remove") {
        deleteEmbed(updatedEmbed.embed, previousStatuses, redisClient);
    }
}

export default handleEmbedUpdate;
