const TwitchVideoEmbed = ({ streamer }: { streamer: string }) => {
    return (
        <iframe
            width="100%"
            height="100%"
            src={`https://player.twitch.tv/?channel=${streamer}&parent=localhost`}
            className="h-full w-full rounded-lg aspect-video"
            allowFullScreen
        ></iframe>
    )
}

export default TwitchVideoEmbed;
