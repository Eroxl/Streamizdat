# Auth Service (Single Publisher)

Ultra-simple `on_publish` authentication for SRS that allows exactly one publisher (static key).

## Quick start
1. Choose a strong key (e.g. from `openssl rand -hex 16`).
2. Set environment variables when running the container/service:
  - `PUBLISH_KEY` (required) – the single secret key a publisher must supply.
  - `STREAM_NAME` (optional) – if set, only that exact stream name is accepted.
3. Configure SRS `on_publish` hook to call `http://auth:8080/auth`.
4. Publish using: `rtmp://<srs-host>/<app>/<stream>?key=<PUBLISH_KEY>`.
5. Only publishes with the correct key (and stream name, if enforced) succeed.

## Flow
1. Broadcaster (OBS/FFmpeg/etc.) attempts RTMP publish with `?key=<PUBLISH_KEY>`.
2. SRS sends POST JSON to this service (includes `stream` and `param`).
3. Service extracts `key` query param and compares to `PUBLISH_KEY`.
4. (If `STREAM_NAME` is set) service also checks `stream === STREAM_NAME`.
5. Responds `{"code":0}` to allow, otherwise `{"code":1,"msg":"reason"}` to deny.

## Request example from SRS (simplified)
```json
{
  "action": "on_publish",
  "client_id": 123,
  "ip": "203.0.113.10",
  "vhost": "__defaultVhost__",
  "app": "live",
  "stream": "myshow",
  "param": "?key=SECRET_KEY_VALUE",
  "tcUrl": "rtmp://srs/live"
}
```

## Environment variables
| Variable | Required | Purpose |
|----------|----------|---------|
| `PUBLISH_KEY` | Yes | Static key required in `?key=` query param. |
| `STREAM_NAME` | No  | Force a single allowed stream name. |
| `PORT` | No (8080) | HTTP listen port. |

Set these in `docker-compose.yml` or your deployment environment.

## Generate a key
```bash
openssl rand -hex 16
```
Use the output as `PUBLISH_KEY`.

## Security notes
- Keep `PUBLISH_KEY` secret; rotate if compromised.
- Prefer distributing the key over a secure channel only to the single publisher.
