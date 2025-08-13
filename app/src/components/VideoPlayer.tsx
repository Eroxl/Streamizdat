'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  status?: 'online' | 'offline' | 'idle';
  hlsUrl?: string;
  className?: string; // allow caller to extend
}

const VideoPlayer = ({ status, hlsUrl, className = '' }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolvedStatus, setResolvedStatus] = useState<'online' | 'offline' | 'idle'>(status || 'offline');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Use the master playlist URL for adaptive bitrate streaming
    const masterPlaylistUrl = 'http://localhost:8080/livestream/livestream.m3u8';
    // Fallback to a specific quality if master playlist fails
    const fallbackUrl = 'http://localhost:8080/hls/livestream-480p.m3u8';

    console.log('VideoPlayer: Using HLS URL:', masterPlaylistUrl);
    console.log('VideoPlayer: Fallback URL:', fallbackUrl);

    let hls: Hls | null = null;
    let isDestroyed = false;

    const loadStream = (url: string, isFallback = false) => {
      if (isDestroyed) return;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('error', () => {
          if (!isFallback && fallbackUrl !== url) {
            console.log('Safari HLS failed, trying fallback URL');
            loadStream(fallbackUrl, true);
          } else {
            setError('Playback error');
            setResolvedStatus('offline');
          }
        });
        video.addEventListener('loadstart', () => setError(null));
        return;
      } 
      
      if (Hls.isSupported()) {
        // Clean up previous instance
        if (hls) {
          hls.destroy();
        }

        hls = new Hls({
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
          progressive: false,            // Disable progressive loading for live
          enableSoftwareAES: false       // Use hardware AES if available
        });

        hls.loadSource(url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest parsed successfully');
          setError(null);
          setResolvedStatus('online');
          // Start playback immediately for live streams
          if (video) {
            video.play().catch((playError) => {
              console.error('Auto-play failed:', playError);
              // This is often due to browser autoplay policy, not an error
            });
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data);
          
          // Handle non-fatal errors
          if (!data.fatal) {
            switch (data.details) {
              case 'bufferStalledError':
                console.log('Buffer stalled, attempting recovery...');
                if (hls && video) {
                  // Try to recover by seeking slightly forward
                  const currentTime = video.currentTime;
                  video.currentTime = currentTime + 0.1;
                }
                return; // Don't treat as fatal
              case 'bufferNudgeOnStall':
                console.log('Buffer nudged on stall');
                return; // This is normal recovery
              default:
                console.log('Non-fatal HLS error:', data.details);
                return;
            }
          }
          
          // Handle fatal errors
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('Network error, trying fallback...');
                if (!isFallback && fallbackUrl !== url) {
                  loadStream(fallbackUrl, true);
                } else {
                  setError('Network error - check stream availability');
                  setResolvedStatus('offline');
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Media error, attempting recovery...');
                try {
                  if (hls) {
                    hls.recoverMediaError();
                  }
                } catch (recoverError) {
                  console.error('Recovery failed:', recoverError);
                  setError('Media playback error');
                  setResolvedStatus('offline');
                }
                break;
              default:
                console.log('Fatal error, trying fallback...');
                if (!isFallback && fallbackUrl !== url) {
                  loadStream(fallbackUrl, true);
                } else {
                  setError('Playback error');
                  setResolvedStatus('offline');
                }
                break;
            }
          }
        });

        // Add additional event listeners for better debugging and recovery
        hls.on(Hls.Events.BUFFER_APPENDED, () => {
          console.log('Buffer appended');
        });

        hls.on(Hls.Events.BUFFER_FLUSHED, () => {
          console.log('Buffer flushed');
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          console.log('Quality level switched to:', data.level);
        });
      } else {
        setError('HLS not supported in this browser');
        setResolvedStatus('offline');
      }
    };

    // Start with master playlist
    loadStream(masterPlaylistUrl);

    return () => {
      isDestroyed = true;
      if (hls) {
        // Clear buffer check interval if it exists
        if ((hls as any).bufferCheckInterval) {
          clearInterval((hls as any).bufferCheckInterval);
        }
        hls.destroy();
        hls = null;
      }
    };
  }, [hlsUrl]);

  useEffect(() => {
    if (status) {
      setResolvedStatus(status);
    } else if (error) {
      setResolvedStatus('offline');
    } else {
      setResolvedStatus('online');
    }
  }, [status, error]);

  const glowClass = `video-glow video-glow--${resolvedStatus}`;

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        muted
        controls
        playsInline
        crossOrigin="anonymous"
        preload="none"
        className={`${glowClass} w-full h-auto aspect-video rounded-lg`}
        onError={(e) => {
          console.error('Video element error:', e);
          setError('Video playback error');
          setResolvedStatus('offline');
        }}
        onLoadStart={() => {
          console.log('Video load started');
          setError(null);
        }}
        onCanPlay={() => {
          console.log('Video can play');
          setResolvedStatus('online');
        }}
        onStalled={() => {
          console.log('Video stalled');
          // Don't immediately set error, let HLS.js handle recovery
        }}
        onWaiting={() => {
          console.log('Video waiting for data');
        }}
        onPlaying={() => {
          console.log('Video playing');
          setError(null);
        }}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
          <div className="text-white text-center p-4">
            <p className="text-sm mb-2">Stream Error</p>
            <p className="text-xs opacity-75">{error}</p>
          </div>
        </div>
      )}
      {resolvedStatus === 'offline' && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
          <div className="text-white text-center p-4">
            <p className="text-sm">Stream Offline</p>
            <p className="text-xs opacity-75">Waiting for broadcast...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;
