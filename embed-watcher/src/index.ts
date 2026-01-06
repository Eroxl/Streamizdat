import { createClient } from 'redis';
import { Client } from 'pg';
import youtubeWatcher from './watchers/youtubeWatcher';
import twitchWatcher from './watchers/twitchWatcher';
import kickWatcher from './watchers/kickWatcher';

const SECONDS_TO_MILLISECONDS = 1000;
const MINUTES_TO_SECONDS = 60;
const REFRESH_INTERVAL = 1 * MINUTES_TO_SECONDS * SECONDS_TO_MILLISECONDS;

const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

const PG_PORT = process.env.PG_PORT;
const PG_HOST = process.env.PG_HOST;
const PG_USER = process.env.PG_USER;
const PG_PASSWORD = process.env.PG_PASSWORD;
const PG_DATABASE = process.env.PG_DATABASE;

if (!REDIS_PORT || !REDIS_HOST || !REDIS_PASSWORD) {
    throw new Error('Missing Redis configuration in environment variables.');
}

if (!PG_PORT || !PG_HOST || !PG_USER || !PG_PASSWORD || !PG_DATABASE) {
    throw new Error('Missing PostgreSQL configuration in environment variables.');
}

const redisClientPublish = createClient({
    socket: {
        port: parseInt(REDIS_PORT, 10),
        host: REDIS_HOST,
    },
    password: REDIS_PASSWORD,
});

const redisClientSubscribe = createClient({
    socket: {
        port: parseInt(REDIS_PORT, 10),
        host: REDIS_HOST,
    },
    password: REDIS_PASSWORD,
});

const pgClient = new Client({
    host: PG_HOST,
    port: parseInt(PG_PORT, 10),
    user: PG_USER,
    password: PG_PASSWORD,
    database: PG_DATABASE,
});

type Embed = {
    enabled: boolean;
    platform: "twitch" | "youtube" | "kick" | "native";
    displayName: string;
    channelId: string;
}

type StreamSettings = {
    personal_accounts: Embed[];
    supported_embeds: Embed[];
}

const watchers = {
    youtube: youtubeWatcher,
    twitch: twitchWatcher,
    kick: kickWatcher,
};

const previousStatuses: Record<string, "live" | "offline"> = {};

(async () => {
    await redisClientPublish.connect();
    await redisClientSubscribe.connect();
    await pgClient.connect();

    const platformSettings = (await pgClient.query('SELECT * FROM stream_settings')).rows[0] as StreamSettings;
    
    const initialEmbeds = [
        ...(platformSettings.personal_accounts || []),
        ...(platformSettings.supported_embeds || []),
    ]
    
    const createOnNotifyListener = (embed: Embed) => {
        return (status: "live" | "offline", liveUrl?: string) => {
            const previousStatus = previousStatuses[embed.channelId] || false;
                
            if (previousStatus === status) return;

            previousStatuses[embed.channelId] = status;
            
            console.log(`[${embed.platform.toUpperCase()}] ${embed.displayName} is now ${status === "live" ? 'LIVE' : 'OFFLINE'}`);

            redisClientPublish.publish('stream_status', JSON.stringify({
                platform: embed.platform,
                channelId: embed.channelId,
                displayName: embed.displayName,
                status,
                embedUrl: liveUrl,
            }));
        }
    };
    
    redisClientSubscribe.subscribe("server_events", (message: string) => {
        const event = JSON.parse(message) as { type: string; timestamp: number; };

        if (event.type !== "server_restart") return;

        console.log('Received server restart message, checking all embed statuses...');

        Object.values(watchers).forEach(async (watcher) => {
            Object.keys(previousStatuses).forEach(channelId => {
                delete previousStatuses[channelId];
            });

            await watcher.refreshAllStatuses();
        });
    });

    redisClientSubscribe.subscribe("embed_update", async (message) => {
        const updatedEmbed = JSON.parse(message.toString()) as (
            {
                type: "add";
                embed: Embed;
            } | {
                type: "remove";
                embed: Pick<Embed, 'platform' | 'channelId'>;
            }
        );

        if (updatedEmbed.type === "add") {
            console.log(`Subscribing to updates for ${updatedEmbed.embed.platform} channel ${updatedEmbed.embed.channelId}`);

            const embed = updatedEmbed.embed;
            if (!embed.enabled) return;

            const watcher = watchers[embed.platform as keyof typeof watchers];
            if (!watcher) return;

            const notifyListener = createOnNotifyListener(embed);

            watcher.subscribe(embed.channelId,  notifyListener);

            watcher.checkStatus(embed.channelId).then((status) => {
                notifyListener(status?.isLive ? "live" : "offline", status?.liveUrl);
            });
        } else if (updatedEmbed.type === "remove") {
            console.log(`Unsubscribing from updates for ${updatedEmbed.embed.platform} channel ${updatedEmbed.embed.channelId}`);
            const { platform, channelId } = updatedEmbed.embed;

            const watcher = watchers[platform as keyof typeof watchers];
            if (!watcher) return;

            watcher.unsubscribe(channelId);
            previousStatuses[channelId] = "offline";
            
            redisClientPublish.publish('stream_status', JSON.stringify({
                platform,
                channelId,
                status: "offline",
                embedUrl: undefined,
            })); 
        }
    });

    setInterval(async () => {
        console.log('Refreshing embed subscriptions from database...');
        Object.values(watchers).forEach(watcher => watcher.unSubscribeAll());

        const updatedPlatformSettings = (await pgClient.query('SELECT * FROM stream_settings')).rows[0] as StreamSettings;

        const updatedEmbeds = [
            ...(updatedPlatformSettings.personal_accounts || []),
            ...(updatedPlatformSettings.supported_embeds || []),
        ];

        updatedEmbeds.forEach(async (embed) => {
            if (!embed.enabled) return;

            const watcher = watchers[embed.platform as keyof typeof watchers];
            if (!watcher) return;

            watcher.subscribe(embed.channelId, createOnNotifyListener(embed));
        });
    }, 60 * 60 * 1000);

    initialEmbeds.forEach(async (embed) => {
        if (!embed.enabled) return;

        const watcher = watchers[embed.platform as keyof typeof watchers];

        if (!watcher) return;

        watcher.subscribe(embed.channelId, createOnNotifyListener(embed));
    });

    Object.values(watchers).forEach(async (watcher) => {
        await watcher.refreshAllStatuses();
    });

    setInterval(async () => {
        Object.values(watchers).forEach(async (watcher) => {
            await watcher.refreshAllStatuses();
        });
    }, REFRESH_INTERVAL);
})();
