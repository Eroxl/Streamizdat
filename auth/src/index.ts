// Simplified single-publisher auth.
// Only one pre-shared publish key is allowed (env PUBLISH_KEY).
// Optional: restrict to a single stream name (env STREAM_NAME) else any stream.
// Publish URL format: rtmp://<host>/<app>/<stream>?key=<PUBLISH_KEY>

import express from 'express';

const app = express();
app.use(express.json());

const PUBLISH_KEY = process.env.PUBLISH_KEY || 'change-me';
const STREAM_NAME = process.env.STREAM_NAME; // if set, enforce exact match
const PORT = parseInt(process.env.PORT || '8080', 10);

type SrsOnPublishBody = {
    action?: string;
    stream?: string;
    param?: string; // query string beginning with '?'
    app?: string;
    ip?: string;
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

app.post('/auth', (req, res) => {
    const body: SrsOnPublishBody = req.body || {};

    if (body.action && body.action !== 'on_publish') return deny(res, 'invalid action');

    if (!body.stream) return deny(res, 'missing stream');
    
    if (STREAM_NAME && body.stream !== STREAM_NAME) return deny(res, 'stream not allowed');

    let unparsedURLParams = body.tcUrl.split('?')[1] || '';

    const params = parseParams(unparsedURLParams);
    const key = params['key'];

    if (!key) return deny(res, 'missing key');

    if (key !== PUBLISH_KEY) return deny(res, 'bad key');

    return res.json({ code: 0 });
});

app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Auth server (single publisher mode) on port ${PORT}`);
});
