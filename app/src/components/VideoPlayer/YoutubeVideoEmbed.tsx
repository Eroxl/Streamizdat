const YoutubeVideoEmbed = ({ videoId }: { videoId: string }) => {
    return (
        <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title="YouTube video player"
            className="h-full w-full rounded-lg aspect-video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
        ></iframe>
    )
}

export default YoutubeVideoEmbed;
