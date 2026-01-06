import express from 'express';
import { createClient } from 'redis';

const app = express();
app.use(express.json());

const PUBLISH_KEY = process.env.PUBLISH_KEY || 'change-me';
const STREAM_NAME = process.env.STREAM_NAME || 'livestream';
const PORT = parseInt(process.env.PORT || '8080', 10);

const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';

const REDIS_URL = `redis://${REDIS_PASSWORD ? `:${REDIS_PASSWORD}@` : ''}${REDIS_HOST}:${REDIS_PORT}`;

// Initialize Redis client
const redisClient = createClient({
    url: REDIS_URL
});

redisClient.on('error', (err: Error) => console.log('Redis Client Error', err));

// Connect to Redis
redisClient.connect().catch(console.error);

type SrsOnPublishBody = {
    action?: string;
    stream?: string;
    param?: string; // query string beginning with '?'
    app?: string;
    ip?: string;
    tcUrl?: string;
    [k: string]: any;
};

const parseParams = (param?: string): Record<string, string> => {
    const out: Record<string, string> = {};

    if (!param) return out;

    const qs = param.startsWith('?') ? param.slice(1) : param;

    for (const pair of qs.split('&')) {
        if (!pair) continue;

        const [k, v = ''] = pair.split('=');

        if (!k) continue;

        out[decodeURIComponent(k)] = decodeURIComponent(v);
    }

    return out;
};

const deny = (res: express.Response, msg: string) => res.status(200).json({ code: 1, msg });

app.post('/publish', async (req, res) => {
    const body: SrsOnPublishBody = req.body || {};

    if (body.action && body.action !== 'on_publish') return deny(res, 'invalid action');

    if (!body.stream) return deny(res, 'missing stream');

    if (STREAM_NAME && body.stream !== STREAM_NAME) return deny(res, 'stream not allowed');

    let unparsedURLParams = body.tcUrl?.split('?')[1] || '';

    const params = parseParams(unparsedURLParams);
    const key = params['key'];

    if (!key) return deny(res, 'missing key');

    if (key !== PUBLISH_KEY) return deny(res, 'bad key');

    // Set IS_ONLINE to true in Redis when publish starts
    try {
        await redisClient.set('IS_ONLINE', 'true');
        console.log('Stream is now online - set IS_ONLINE to true');
    } catch (error) {
        console.error('Error setting IS_ONLINE in Redis:', error);
    }

    return res.json({ code: 0 });
});

app.post('/unpublish', async (req, res) => {
    const body: SrsOnPublishBody = req.body || {};

    if (body.action && body.action !== 'on_unpublish') return deny(res, 'invalid action');

    if (!body.stream) return deny(res, 'missing stream');

    if (STREAM_NAME && body.stream !== STREAM_NAME) return deny(res, 'stream not allowed');

    // Set IS_ONLINE to false in Redis when publish stops
    try {
        await redisClient.set('IS_ONLINE', 'false');
        console.log('Stream is now offline - set IS_ONLINE to false');
    } catch (error) {
        console.error('Error setting IS_ONLINE in Redis:', error);
    }

    return res.json({ code: 0 });
});

app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Auth server (single publisher mode) on port ${PORT}`);
});
