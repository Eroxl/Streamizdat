import { createClient } from 'redis';

const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

if (!REDIS_PORT || !REDIS_HOST || !REDIS_PASSWORD) {
    throw new Error('Missing Redis configuration in environment variables.');
}

const redisClientSubscribe = createClient({
    socket: {
        port: parseInt(REDIS_PORT, 10),
        host: REDIS_HOST,
    },
    password: REDIS_PASSWORD,
});

redisClientSubscribe.on('error', (err) => {
    console.error('Redis Client Error', err);
});

redisClientSubscribe.connect().then(() => {
    console.log('Connected to Redis server successfully.');
}).catch((err) => {
    console.error('Failed to connect to Redis server:', err);
});

export default redisClientSubscribe;
