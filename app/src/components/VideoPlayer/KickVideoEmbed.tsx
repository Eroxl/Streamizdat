const KickVideoEmbed = ({ streamer }: { streamer: string }) => {
    return (
        <iframe 
            src={`https://player.kick.com/${streamer}?autoplay=true`}
            height="100%" 
            width="100%"
            className="h-full w-full rounded-lg aspect-video"
            allowFullScreen
        > 
        </iframe>
    )
}

export default KickVideoEmbed;
