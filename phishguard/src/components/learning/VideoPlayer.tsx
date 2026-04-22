import { useEffect, useRef, useCallback, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface VideoPlayerProps {
  playbackId: string;
  title?: string;
  onProgress?: (progress: number, duration: number) => void;
  onComplete?: () => void;
  initialProgress?: number;
  className?: string;
  startTime?: number;
}

export function VideoPlayer({
  playbackId,
  title,
  onProgress,
  onComplete,
  initialProgress = 0,
  className,
  startTime,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime || initialProgress);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(initialProgress);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const hasCompletedRef = useRef(false);

  // Mux playback URL construction
  const muxUrl = `https://stream.mux.com/${playbackId}.m3u8`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      if (startTime) {
        video.currentTime = startTime;
      }
    };

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      const dur = video.duration;
      setCurrentTime(time);
      const progress = dur > 0 ? (time / dur) * 100 : 0;
      setPlaybackProgress(progress);
      onProgress?.(time, dur);

      // Check for completion (90% watched)
      if (!hasCompletedRef.current && progress >= 90) {
        hasCompletedRef.current = true;
        onComplete?.();
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [startTime, onProgress, onComplete]);

  const formatTime = (time: number): string => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value;
    }
    setIsMuted(value === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative w-full overflow-hidden rounded-xl bg-noir-900',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element - Using native video with HLS support */}
      <video
        ref={videoRef}
        className="w-full aspect-video cursor-pointer"
        onClick={togglePlay}
        playsInline
        crossOrigin="anonymous"
      >
        <source src={muxUrl} type="application/x-mpegURL" />
        {/* Fallback for non-HLS browsers - would need HLS.js in production */}
        Your browser does not support HLS video playback.
      </video>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-noir-950/60">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      )}

      {/* Controls Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls ? 1 : 0 }}
        className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-noir-950/90 via-transparent to-transparent"
      >
        {/* Title */}
        {title && (
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-noir-950/80 to-transparent">
            <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
          </div>
        )}

        {/* Center Play Button */}
        {!isPlaying && !isLoading && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={togglePlay}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/90 hover:bg-amber-500 transition-colors"
            aria-label="Reproduzir vídeo"
          >
            <svg className="h-8 w-8 text-noir-950 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </motion.button>
        )}

        {/* Bottom Controls */}
        <div className="p-4 space-y-3">
          {/* Progress Bar */}
          <div
            className="group relative h-1.5 cursor-pointer rounded-full bg-noir-700"
            onClick={handleSeek}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-amber-500"
              style={{ width: `${playbackProgress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              style={{ left: `calc(${playbackProgress}% - 8px)` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-noir-700 transition-colors"
                aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? (
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Skip Backward */}
              <button
                onClick={() => skip(-10)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-noir-700 transition-colors"
                aria-label="Voltar 10 segundos"
              >
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.5 3C17.15 3 21.08 6.03 22.47 10.22L20.1 11C19.05 7.81 16.04 5.5 12.5 5.5C10.54 5.5 8.77 6.22 7.38 7.38L10 10H3V3L5.6 5.6C7.45 4 9.85 3 12.5 3M10 12V22H8V14H6V12H10M18 14V20C18 21.11 17.11 22 16 22H8C6.89 22 6 21.11 6 20V14C6 12.89 6.89 12 8 12H16C17.11 12 18 12.89 18 14M16 14H8V20H16V14M14 16H10V18H14V16Z" />
                </svg>
              </button>

              {/* Skip Forward */}
              <button
                onClick={() => skip(10)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-noir-700 transition-colors"
                aria-label="Avançar 10 segundos"
              >
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 12V22H8V14H6V12H10M18 14V20C18 21.11 17.11 22 16 22H8C6.89 22 6 21.11 6 20V14C6 12.89 6.89 12 8 12H16C17.11 12 18 12.89 18 14M16 14H8V20H16V14M12.5 3C17.15 3 21.08 6.03 22.47 10.22L20.1 11C19.05 7.81 16.04 5.5 12.5 5.5C10.54 5.5 8.77 6.22 7.38 7.38L10 10H3V3L5.6 5.6C7.45 4 9.85 3 12.5 3M10 12V22H8V14H6V12H10M18 14V20C18 21.11 17.11 22 16 22H8C6.89 22 6 21.11 6 20V14C6 12.89 6.89 12 8 12H16C17.11 12 18 12.89 18 14Z" />
                </svg>
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1 group">
                <button
                  onClick={toggleMute}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-noir-700 transition-colors"
                  aria-label={isMuted ? 'Ativar som' : 'Silenciar'}
                >
                  {isMuted || volume === 0 ? (
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12C16.5 10.23 15.48 8.71 14 7.97V16C15.48 15.29 16.5 13.77 16.5 12M3 9V15H7L12 20V4L7 9H3M21.5 12C21.5 10.23 20.48 8.71 19 7.97V10.18L16.97 12.18C17.68 13.06 18 14.03 18 15C18 16.03 17.68 17 16.97 17.82L19 19.82V12.18C20.48 12.71 21.5 14.23 21.5 12M19 17.82C19 16.03 17.68 14.29 16.18 13.55L18.36 11.36C18.93 12.11 19.27 13.09 19.27 14.18C19.27 15.09 19 16 18.5 16.77L19.17 17.5C19.11 17.65 19 17.78 19 17.82Z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 3.23V5.29C16.89 6.15 19 8.83 19 12C19 15.17 16.89 17.84 14 18.71V20.77C18.01 19.86 21 16.28 21 12C21 7.72 18.01 4.14 14 3.23M16.5 12C16.5 10.23 15.5 8.71 14 7.97V16C15.5 15.29 16.5 13.77 16.5 12M3 9V15H7L12 20V4L7 9H3M13.5 12C13.5 10.23 12.5 8.71 11 7.97V16C12.5 15.29 13.5 13.77 13.5 12Z" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  aria-label="Volume"
                />
              </div>

              {/* Time */}
              <span className="text-sm text-noir-300 font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Closed Captions Button */}
            <button
              className="flex h-8 items-center gap-2 rounded-full px-3 hover:bg-noir-700 transition-colors"
              aria-label="Legendas"
            >
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4M20 18H4V6H20V18M6 10H18V12H6V10M6 14H14V16H6V14Z" />
              </svg>
              <span className="text-xs text-white">CC</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}