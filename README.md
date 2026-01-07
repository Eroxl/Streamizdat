<div align="center">
    <h1>Streamizdat</h1>
    <p>Entirely Self-Hosted Streaming Platform</p>  
</div>

Streamizdat is an open-source, self-hosted streaming platform that allows a streamer to broadcast their contnt and engage with their audience without relying on third-party services. 

Built with a focus on privacy, customization, and community engagement, Streamizdat provides streamers with the tools they need to create a unique streaming experience.

## Features

### Embeds

#### Personal

Streamers can embed youtube, twitch, and kick streams directly into their Streamizdat channel, allowing them to consolidate their streaming presence and allow for users to easily use their favorite platform.

This also ensures that if one platform goes down, you can continue streaming directly to your audience without interruption.

#### Community

Community embeds can be configured to allow streamers to showcase other streamer's content on their channel. Community embeds only appear when the main stream is offline so viewers always have something to watch.

### Native Streaming Support

RTMP streaming is supported natively, allowing users to broadcast their streams using popular software like OBS Studio while still being completely self-hostable, meaning you have full control over your streaming content and data.

RTMP streaming should usually only be used in the case where you can not reliably stream using the embed features and should only be treated as a fallback option.

### Chat

Built-in chat features allow viewers to interact with streamers and other viewers in real-time. The chat supports user roles, with customizable colors and badges for each role. 

## Setup

Clone the repository

```bash
git clone https://github.com/eroxl/Streamizdat.git
cd ./Streamizdat
```

Copy the example environment file and modify it to your needs

```bash
cp .env.example .env
```

Install Podman and Podman Compose if you haven't already. Follow the instructions on the [Podman installation guide](https://podman.io/getting-started/installation) for your operating system.


Initialize and start the Docker containers

```bash 
podman compose --env-file .env -f docker-compose.yaml up
```

### Development

A develelopment environment can be set up by running the following command:

```bash
./dev.sh up
```

This starts all necessary services and watches for file changes to automatically rebuild the backend and frontend (it's a little janky right now, but it works for development purposes).

## Contributing

### Repository Structure

The project is organized as a monorepo with the following structure:

- `backend/`: All REST and Websocket API code.
- `frontend/`: Central frontend codebase.
- `embed-watcher/`: Service that monitors embedded streams and pushes updates to Redis.
- `srs-callbacks/`: Simple HTTP server that handles SRS callbacks for stream start/stop events.
- `srs.conf`: [SRS](https://github.com/ossrs/srs) configuration file for RTMP streaming.
