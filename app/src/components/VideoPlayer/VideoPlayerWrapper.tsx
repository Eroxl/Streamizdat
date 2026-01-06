import { getStreamStatus } from '@/lib/stream';
import NativeVideoPlayer from './NativeVideoPlayer';
import YoutubeVideoEmbed from './YoutubeVideoEmbed';
import TwitchVideoEmbed from './TwitchVideoEmbed';
import KickVideoEmbed from './KickVideoEmbed';

interface VideoPlayerWrapperProps {
  service: "youtube" | "twitch" | "kick" | "native" | string & {};
  videoId?: string;
  className?: string;
}

const VideoPlayerWrapper = async ({ service, videoId, className = '' }: VideoPlayerWrapperProps) => {
  const initialStatus = await getStreamStatus();

  console.log(service);

  if (service === "youtube" && videoId) {
    return (
      <div className={`relative ${className}`}>
        <YoutubeVideoEmbed videoId={videoId} />
      </div>
    );
  }

  if (service === "twitch" && videoId) {
    return (
      <div className={`relative ${className}`}>
        <TwitchVideoEmbed streamer={videoId} />
      </div>
    );
  }

  if (service === "kick" && videoId) {
    return (
      <div className={`relative ${className}`}>
        <KickVideoEmbed streamer={videoId} />
      </div>
    );
  }
  
  return (
    <div className={`relative ${className}`}>
      <NativeVideoPlayer
        hlsUrl={videoId}
        initialStatus={initialStatus.isOnline ? 'online' : 'offline'}
      />
    </div>
  );
}

export default VideoPlayerWrapper;
