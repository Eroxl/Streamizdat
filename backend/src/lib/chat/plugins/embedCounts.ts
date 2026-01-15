import redisClientSubscribe from "../../../db/redisClientSubscribe";
import { isJSONMessage } from "../chatApp";
import type { ChatMiddlewareFn, ChatPlugin, ChatServiceFn, ConnectMiddlewareFn } from "../chatApp";


type EmbedData = {
    platform: string;
    embedUrl: string;
    channelId?: string;
}

const isEmbedData = (data: any): data is EmbedData => {
    return data.platform !== undefined
        && data.embedUrl !== undefined;
}

const liveEmbeds: Map<
  string,
  {
    platform: string;
    channelId: string;
    embedUrl: string;
    displayName: string;
  }
> = new Map();
const embedUrlToChannelId: Map<string, string> = new Map();
const embedCounts = new Map<string, number>();

type EmbedStatusChange = {
    platform: string;
    channelId: string;
    embedUrl: string;
    displayName: string;
    status: "live" | "offline";
}

const getEmbedKey = (channelId: string, platform: string) => {
  return platform + ":" + channelId;
};

const embedStatusWatcherService: ChatServiceFn = (chatApp) => {
    redisClientSubscribe.subscribe("stream_status", (message: string) => {
        const parsedMessage = JSON.parse(message) as EmbedStatusChange;

        chatApp.broadcast({
            type: "embedStatusChange",
            data: {
                platform: parsedMessage.platform,
                channelId: parsedMessage.channelId,
                embedUrl: parsedMessage.embedUrl,
                displayName: parsedMessage.displayName,
                embedCount: embedCounts.get(
                    getEmbedKey(parsedMessage.channelId, parsedMessage.platform)
                ) || 0,
                status: parsedMessage.status,
            },
        });

        if (parsedMessage.status === "live") {
            liveEmbeds.set(
                getEmbedKey(parsedMessage.channelId, parsedMessage.platform),
                {
                    platform: parsedMessage.platform,
                    channelId: parsedMessage.channelId,
                    embedUrl: parsedMessage.embedUrl,
                    displayName: parsedMessage.displayName,
                }
            );
            
            embedUrlToChannelId.set(
                parsedMessage.embedUrl,
                parsedMessage.channelId,
            );
        } else {
            liveEmbeds.delete(
                getEmbedKey(parsedMessage.channelId, parsedMessage.platform)
            );
            
            embedUrlToChannelId.delete(
                parsedMessage.embedUrl,
            );
        }
    });
}

const broadcastInitialEmbedCounts: ConnectMiddlewareFn = (chatApp, client, next) => {
    const initialEmbeds = Array.from(liveEmbeds.entries()).map(([key, embed]) => {
        const [platform, channelId] = key.split(":");

        return {
            platform,
            channelId,
            embedUrl: embed.embedUrl,
            displayName: embed.displayName,
            embedCount: embedCounts.get(key) || 0,
        };
    });

    chatApp.sendToUser(
        {
            type: "initialEmbedCounts",
            data: initialEmbeds,
        }, 
        client.ws
    );

    next();
}

const disconnectEmbedCleanup: ConnectMiddlewareFn = (chatApp, client, next) => {
    const embededChannel = client.state["embededChannel"] as string | undefined;

    if (embededChannel === undefined) return next();

    const previousCount = embedCounts.get(embededChannel) || 1;
    embedCounts.set(embededChannel, previousCount - 1);

    const [previousPlatform, previousChannelId] = embededChannel.split(":");

    chatApp.broadcast(
        {
            type: "embedCountUpdate",
            data: {
                platform: previousPlatform,
                channelId: previousChannelId,
                embedCount: previousCount - 1,
            },
        },
        [client.ws]
    );

    delete client.state["embededChannel"];
    
    next();
}

const embedMiddleware: ChatMiddlewareFn = (message, chatApp, client, next) => {
    if (!isJSONMessage(message)) return next();

    if (message.type !== "embed" || !isEmbedData(message.data)) return next();

    const { platform, embedUrl } = message.data;

    const embededChannel = client.state["embededChannel"] as string | undefined;   

    if (embededChannel !== undefined) {
        const previousCount = embedCounts.get(embededChannel) || 1;
        embedCounts.set(embededChannel, previousCount - 1);
        
        const [previousPlatform, previousChannelId] = embededChannel.split(":");
        
        chatApp.broadcast(
            {
                type: "embedCountUpdate",
                data: {
                    platform: previousPlatform,
                    channelId: previousChannelId,
                    embedCount: previousCount - 1,
                },
            },
           [],
        );

        delete client.state["embededChannel"];
    }

    const channelId = (platform === "youtube" ? embedUrlToChannelId.get(embedUrl) : embedUrl);
    if (!channelId) return next();

    const key = platform + ":" + channelId;

    client.state["embededChannel"] = key;

    const currentCount = embedCounts.get(key) || 0;
    embedCounts.set(key, currentCount + 1);

    message.data.channelId = channelId;

    chatApp.broadcast(
        {
            type: "embedCountUpdate",
            data: {
                platform: platform,
                channelId: channelId,
                embedCount: embedCounts.get(key) || 0,
            },
        },
        []
    );

    next();
}

/**
 * Track and broadcast embed viewer counts to all connected clients.
 */
const embedMiddlewarePlugin: ChatPlugin = {
    services: [
        embedStatusWatcherService,
    ],
    middleware: {
        connect: [
            broadcastInitialEmbedCounts,
        ],
        message: [
            embedMiddleware,
        ],
        close: [
            disconnectEmbedCleanup,
        ],
    },
}

export default embedMiddlewarePlugin;

