import { RedisClientType } from "redis";
import Embed from "./types/Embed";
import StatusCache from "./types/StatusCache";

const createOnNotifyListener = (embed: Embed, previousStatuses: StatusCache, redisClient: RedisClientType<any,any,any>) => {
    return (status: "live" | "offline", liveUrl?: string) => {
        const previousStatus = previousStatuses[embed.channelId] || false;
            
        if (previousStatus === status) return;

        previousStatuses[embed.channelId] = status;
        
        console.log(`[${embed.platform.toUpperCase()}] ${embed.displayName} is now ${status === "live" ? 'LIVE' : 'OFFLINE'}`);

        redisClient.publish('stream_status', JSON.stringify({
            platform: embed.platform,
            channelId: embed.channelId,
            displayName: embed.displayName,
            status,
            embedUrl: liveUrl,
        }));
    }
};

export default createOnNotifyListener;
