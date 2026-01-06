"use client";

import { useEffect, useRef, useState } from "react";
import Hls, { LevelSwitchedData } from 'hls.js';
import { useStreamStatus } from '@/lib/hooks/useStreamStatus';
import { Pause, Play, Settings } from "lucide-react";

type VideoPlayerProps = {
  hlsUrl?: string;
  initialStatus: 'online' | 'offline';
}

const hlsConfig = {
  // Multi-bitrate optimized settings
  liveSyncDuration: 3,           // Stay 3 segments behind live edge
  liveMaxLatencyDuration: 8,     // Allow up to 8 seconds latency
  maxBufferLength: 10,           // 10 seconds of buffer ahead
  maxMaxBufferLength: 15,        // Max 15 seconds buffer
  maxBufferSize: 25 * 1000 * 1000, // 25MB buffer size
  maxBufferHole: 1,              // Allow 1 second holes

  // Conservative loading for stability
  maxLoadingDelay: 3,            // Wait up to 3 seconds
  manifestLoadingTimeOut: 10000, // 10 second manifest timeout  
  manifestLoadingMaxRetry: 3,    // 3 retries for manifest
  fragLoadingTimeOut: 10000,     // 10 second fragment timeout

  // Quality switching settings - be conservative
  startLevel: 0,                 // Always start with lowest quality (360p)
  progressive: false,
  enableWorker: true,
  lowLatencyMode: false,
  backBufferLength: 6,           // Keep 6 seconds back buffer

  // Live streaming settings
  liveBackBufferLength: 4,       // 4 seconds back buffer for live
  nudgeOffset: 1,                // 1 second nudge for stalled buffers
  nudgeMaxRetry: 3,              // Fewer nudge retries to avoid loops

  // Recovery settings
  fragLoadingMaxRetry: 2,        // Fewer retries for faster fallback
  fragLoadingMaxRetryTimeout: 6000, // 6 second retry timeout

  // Adaptive bitrate settings
  abrEwmaFastLive: 3.0,          // Fast adaptation factor for live
  abrEwmaSlowLive: 9.0,          // Slow adaptation factor for live
  abrMaxWithRealBitrate: true,   // Use real bitrate for decisions
  maxStarvationDelay: 2,         // Max 2 seconds starvation before dropping quality

  // Stall detection and recovery
  highBufferWatchdogPeriod: 2,   // Check for stalls every 2 seconds

  // Disable aggressive optimizations that can cause issues
  enableSoftwareAES: false       // Use hardware AES if available
}

const VideoControls: React.FC<{
  hls: React.RefObject<Hls | null>;
  video: React.RefObject<HTMLVideoElement | null>;
}> = ({ hls, video }) => {
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [qualityLevel, setQualityLevel] = useState<number>(-1);
  const controls = useRef<HTMLDivElement | null>(null);
  const settings = useRef<HTMLDivElement | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(100);

  useEffect(() => {
    if (!video.current) return;

    const handlePlay = () => {
      setIsPaused(false);
      if (!hls.current || !video.current) return;

      hls.current.startLoad();
      hls.current.resumeBuffering();

      const buffered = video.current.buffered;

      if (buffered.length > 0) {
        const firstLoadedTime = buffered.start(0);
        video.current.currentTime = firstLoadedTime;
      }
    };
    const handlePause = () => {
      setIsPaused(true);
      if (!hls.current) return;

      hls.current.stopLoad();
      hls.current.pauseBuffering();
    };

    video.current.addEventListener('play', handlePlay);
    video.current.addEventListener('pause', handlePause);

    const permanentVideo = video.current;

    return () => {
      permanentVideo.removeEventListener('play', handlePlay);
      permanentVideo.removeEventListener('pause', handlePause);
    };
  }, [hls, video]);

  useEffect(() => {
    if (!video.current) return;

    video.current.volume = audioLevel / 100;
  }, [audioLevel, video]);

  useEffect(() => {
    if (!hls.current) return;

    const handleLevelSwitch = (_event: string, data: LevelSwitchedData) => {
      setQualityLevel(data.level);
      console.log(`Switched to quality level: ${data.level}`);
    };

    hls.current.on(Hls.Events.LEVEL_SWITCHED, handleLevelSwitch);

    const permanentHls = hls.current;

    return () => {
      permanentHls.off(Hls.Events.LEVEL_SWITCHED, handleLevelSwitch);
    };
  }, [hls]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!settings.current || settings.current.contains(e.target as Node)) return;

      setIsSettingsOpen(false);
    }

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    }
  }, [settings]);

  return (
    <div
      className="absolute top-0 left-0 right-0 bottom-0 z-20 group"
      onClick={(e) => {
        if (!video.current || !controls.current) return;

        if (controls.current.contains(e.target as Node)) return;

        if (video.current.paused) {
          video.current.play();
          return;
        }

        video.current.pause();
      }}
    >
      {isPaused && (
        <div className="w-full h-full items-center justify-center bg-black bg-opacity-50 rounded-lg" />
      )}
      <div
        ref={controls}
        className="absolute flex justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity bottom-0 h-12 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1"
      >
        <div>
          <button
            className="p-2"
            onClick={(e) => {
              e.stopPropagation();

              if (!video.current) return;

              if (video.current.paused) {
                video.current.play();
              }
              else {
                video.current.pause();
              }
            }}
          >
            {
              isPaused ? (
                <Play height={20} width={20} className="stroke-3" />
              ) : (
                <Pause height={20} width={20} className="stroke-3" />
              )
            }
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div ref={settings} className="relative">
            <button
              className="p-2"
              onClick={(e) => {
                e.stopPropagation();

                setIsSettingsOpen(!isSettingsOpen);
              }}
            >
              <Settings height={20} width={20} />
            </button>
            {
              isSettingsOpen && (
                <div className="absolute -top-1.5 -translate-y-full right-0 bg-black/50 text-white rounded-t-md w-40 py-2 z-30">
                  <p className="px-4 py-2 border-b border-gray-700">Quality Levels</p>
                  <button
                    className={`w-full text-left px-4 py-2 hover:bg-gray-800 ${qualityLevel === -1 ? 'bg-gray-700' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!hls.current) return;

                      hls.current.currentLevel = -1;
                      setQualityLevel(-1);
                    }}
                  >
                    Auto
                  </button>
                  {
                    hls.current?.levels.map((level, index) => (
                      <button
                        key={index}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-800 ${qualityLevel === index ? 'bg-gray-700' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!hls.current) return;

                          hls.current.currentLevel = index;
                          setQualityLevel(index);
                        }}
                      >
                        {level.height}p
                      </button>
                    ))
                  }
                </div>
              )
            }
          </div>
        </div>
      </div>
    </div>
  );
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ hlsUrl, initialStatus }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hls = useRef<Hls | null>(null);

  // Use the stream status hook for periodic checking (every 3 seconds)
  const { status: streamStatus, loading } = useStreamStatus(3000);

  // Determine the resolved status based on initial status, stream status, and errors
  const [resolvedStatus, setResolvedStatus] = useState<'online' | 'offline' | 'idle'>(initialStatus);

  // Update resolved status based on stream status and errors
  useEffect(() => {
    if (error) {
      setResolvedStatus('offline');
      return;
    }

    if (!loading) {
      setResolvedStatus(streamStatus.isOnline ? 'online' : 'offline');
    }
  }, [error, streamStatus.isOnline, loading]);


  useEffect(() => {
    const video = videoRef.current;
    if (!video || resolvedStatus !== 'online') return;

    const playlistURL = hlsUrl || 'http://localhost:8080/stream.m3u8';

    let isDestroyed = false;

    const loadStream = (url: string) => {
      if (isDestroyed) return;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;

        video.addEventListener('loadstart', () => setError(null));

        return;
      }

      if (!Hls.isSupported()) {
        setError('HLS not supported in this browser');
        return;
      }

      // Clean up previous instance
      if (hls.current) {
        hls.current.destroy();
      }

      hls.current = new Hls(hlsConfig);

      hls.current.loadSource(url);
      hls.current.attachMedia(video);

      hls.current.on(Hls.Events.MANIFEST_PARSED, () => {
        setError(null);

        if (!video) return;

        // Ensure video is muted before attempting autoplay
        video.muted = true;
      });

      hls.current.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          setError('Stream loading failed');
        }

        console.error('HLS error:', event, data);
      });
    };

    // Only load stream if status is online
    if (resolvedStatus === 'online') {
      loadStream(playlistURL);
    }

    return () => {
      isDestroyed = true;

      if (hls.current) {
        hls.current.destroy();
        hls.current = null;
      }
    };
  }, [hlsUrl, resolvedStatus]);

  return (
    <div className={`video-glow ${resolvedStatus === 'online' ? 'video-glow--online' : 'video-glow--offline'} w-full h-full bg-transparent rounded-lg`}>
      <div className="relative w-full h-full overflow-hidden rounded-lg">
        {
          resolvedStatus === 'online' && (
            <VideoControls hls={hls} video={videoRef} />
          )
        }
        <video
          ref={videoRef}
          autoPlay
          muted
          controls={false}
          playsInline
          crossOrigin="anonymous"
          preload="none"
          className="w-full h-auto aspect-video rounded-lg"
        />
        {
          error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
              <div className="text-white text-center p-4">
                <p className="text-sm mb-2">Stream Error</p>
                <p className="text-xs opacity-75">{error}</p>
              </div>
            </div>
          )
        }
      </div>
    </div>
  )
}


export default VideoPlayer;

