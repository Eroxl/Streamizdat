import { createClient } from 'redis';
import { Client } from 'pg';
import { WATCHERS } from './watchers';
import loadDBEmbeds from './loadDBEmbeds';
import handleEmbedUpdate from './events/handleEmbedUpdate';
import handleServerEvent from './events/handleServerEvent';
import StatusCache from './types/StatusCache';

const SECONDS_TO_MILLISECONDS = 1000;
const MINUTES_TO_SECONDS = 60;

/**
 * Refresh interval for checking stream statuses.
 */
const REFRESH_INTERVAL = 1 * MINUTES_TO_SECONDS * SECONDS_TO_MILLISECONDS;
/**
 * Interval for ensuring parity between in-memory statuses and database.
 */
const BACKUP_INTERVAL = 60 * MINUTES_TO_SECONDS * SECONDS_TO_MILLISECONDS;

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

const redisConfig = {
    socket: {
        port: parseInt(REDIS_PORT, 10),
        host: REDIS_HOST,
    },
    password: REDIS_PASSWORD,
};

const redisClientPublish = createClient(redisConfig);
const redisClientSubscribe = createClient(redisConfig);

const pgClient = new Client({
    host: PG_HOST,
    port: parseInt(PG_PORT, 10),
    user: PG_USER,
    password: PG_PASSWORD,
    database: PG_DATABASE,
});

const previousStatuses: StatusCache = {};

(async () => {
    await redisClientPublish.connect();
    await redisClientSubscribe.connect();
    await pgClient.connect();
    
    redisClientSubscribe.subscribe("server_events", (message) => handleServerEvent(message, previousStatuses));
    redisClientSubscribe.subscribe("embed_update", (message) => handleEmbedUpdate(message, previousStatuses, redisClientPublish));
    
    loadDBEmbeds(pgClient, previousStatuses, redisClientPublish);
    setInterval(() => loadDBEmbeds(pgClient, previousStatuses, redisClientPublish), BACKUP_INTERVAL);

    setInterval(async () => {
        Object.values(WATCHERS).forEach(async (watcher) => {
            await watcher.refreshAllStatuses();
        });
    }, REFRESH_INTERVAL);
})();
