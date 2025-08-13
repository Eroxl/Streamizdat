# Streamizdat
Uncensorable self hostable live streaming platform.

## Services
* `srs` – SRS media server (RTMP ingest, HLS output)
* `auth` – Simple on_publish auth hook (single publisher)
* `app` – Next.js web frontend (HLS player at `/live`)

## Quick Start
```
docker compose up --build
```

Publish (replace KEY):
```
ffmpeg -re -i input.mp4 -c:v libx264 -preset veryfast -tune zerolatency -c:a aac -f flv "rtmp://localhost/live/eroxl?key=f4956c20c18249861e1e0cbf2427c41f"
```

View stream:
Open http://localhost:3000/live in a browser. (Playlist origin: http://localhost:8080/live/eroxl.m3u8)

Configure player URL via env `NEXT_PUBLIC_HLS_URL` on the `app` service.

## TODO
* Better UI & chat
* Multi-user auth
* DVR / recording options
