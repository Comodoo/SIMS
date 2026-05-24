'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Check,
  Download,
  PictureInPicture2,
  Subtitles,
  Bookmark,
  MessageSquare,
  Clock,
  Repeat,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoNote {
  id: string;
  timestamp: number;
  content: string;
  createdAt: Date;
}

interface VideoBookmark {
  id: string;
  timestamp: number;
  title: string;
}

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title: string;
  lessonId: string;
  courseId: string;
  initialProgress?: number;
  onProgressUpdate?: (progress: number, currentTime: number) => void;
  onComplete?: () => void;
  autoplay?: boolean;
  chapters?: { title: string; timestamp: number }[];
  subtitles?: { label: string; src: string; lang: string }[];
  nextLesson?: { id: string; title: string };
  prevLesson?: { id: string; title: string };
  onNextLesson?: () => void;
  onPrevLesson?: () => void;
}

const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const qualityOptions = ['Auto', '1080p', '720p', '480p', '360p'];

export function VideoPlayer({
  src,
  poster,
  title,
  lessonId,
  courseId,
  initialProgress = 0,
  onProgressUpdate,
  onComplete,
  autoplay = false,
  chapters = [],
  subtitles = [],
  nextLesson,
  prevLesson,
  onNextLesson,
  onPrevLesson,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState('Auto');
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [bookmarks, setBookmarks] = useState<VideoBookmark[]>([]);
  const [loopSection, setLoopSection] = useState<{ start: number; end: number } | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const progressSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Format time helper
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      if (initialProgress > 0 && initialProgress < 95) {
        video.currentTime = (initialProgress / 100) * video.duration;
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Check loop section
      if (loopSection && video.currentTime >= loopSection.end) {
        video.currentTime = loopSection.start;
      }
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setHasEnded(true);
      onComplete?.();
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [initialProgress, loopSection, onComplete]);

  // Save progress periodically
  useEffect(() => {
    if (progressSaveTimeoutRef.current) {
      clearTimeout(progressSaveTimeoutRef.current);
    }

    progressSaveTimeoutRef.current = setTimeout(() => {
      if (duration > 0) {
        const progress = (currentTime / duration) * 100;
        onProgressUpdate?.(progress, currentTime);
      }
    }, 5000);

    return () => {
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current);
      }
    };
  }, [currentTime, duration, onProgressUpdate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'j':
          e.preventDefault();
          skip(-10);
          break;
        case 'l':
          e.preventDefault();
          skip(10);
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault();
          seekToPercent(parseInt(e.key) * 10);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Controls visibility
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Video controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        if (hasEnded) {
          videoRef.current.currentTime = 0;
          setHasEnded(false);
        }
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoRef.current.currentTime + seconds, duration)
      );
    }
  };

  const seekToPercent = (percent: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = (percent / 100) * duration;
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      const newTime = (value[0] / 100) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const adjustVolume = (delta: number) => {
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      if (videoRef.current) videoRef.current.muted = false;
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (newVolume > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const changePlaybackSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;

    try {
      if (isPiP) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
      setIsPiP(!isPiP);
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  const addBookmark = () => {
    const newBookmark: VideoBookmark = {
      id: `bookmark-${Date.now()}`,
      timestamp: currentTime,
      title: `Bookmark at ${formatTime(currentTime)}`,
    };
    setBookmarks([...bookmarks, newBookmark]);
  };

  const jumpToBookmark = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        className={cn(
          'relative bg-black rounded-lg overflow-hidden group',
          isFullscreen && 'fixed inset-0 z-50 rounded-none'
        )}
        onMouseMove={showControlsTemporarily}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="w-full h-full"
          onClick={togglePlay}
          autoPlay={autoplay}
          playsInline
        >
          {subtitles.map((sub) => (
            <track
              key={sub.lang}
              kind="subtitles"
              src={sub.src}
              srcLang={sub.lang}
              label={sub.label}
              default={activeSubtitle === sub.lang}
            />
          ))}
        </video>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="h-12 w-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Play/Pause Overlay */}
        {!isPlaying && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="h-20 w-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <Play className="h-10 w-10 text-white ml-1" />
            </button>
          </div>
        )}

        {/* End Screen */}
        {hasEnded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <Check className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-white text-xl font-semibold mb-2">Lesson Complete!</h3>
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  setHasEnded(false);
                }
              }}>
                <Repeat className="h-4 w-4 mr-2" />
                Replay
              </Button>
              {nextLesson && onNextLesson && (
                <Button onClick={onNextLesson}>
                  Next Lesson
                  <SkipForward className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity',
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          )}
        >
          {/* Progress Bar */}
          <div className="relative mb-4">
            <div className="absolute inset-0 h-1 bg-white/20 rounded-full">
              <div
                className="h-full bg-white/40 rounded-full"
                style={{ width: `${buffered}%` }}
              />
              <div
                className="absolute top-0 h-full bg-primary rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <Slider
              value={[progress]}
              max={100}
              step={0.1}
              onValueChange={handleSeek}
              className="absolute inset-0 h-1 [&>span:first-child]:bg-transparent [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-primary [&_[role=slider]]:border-0 opacity-0 hover:opacity-100"
            />
            
            {/* Chapter Markers */}
            {chapters.map((chapter, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <button
                    className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-yellow-400 rounded"
                    style={{ left: `${(chapter.timestamp / duration) * 100}%` }}
                    onClick={() => {
                      if (videoRef.current) videoRef.current.currentTime = chapter.timestamp;
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{chapter.title}</p>
                  <p className="text-xs text-muted-foreground">{formatTime(chapter.timestamp)}</p>
                </TooltipContent>
              </Tooltip>
            ))}

            {/* Bookmark Markers */}
            {bookmarks.map((bookmark) => (
              <Tooltip key={bookmark.id}>
                <TooltipTrigger asChild>
                  <button
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full"
                    style={{ left: `${(bookmark.timestamp / duration) * 100}%` }}
                    onClick={() => jumpToBookmark(bookmark.timestamp)}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{bookmark.title}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/20">
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isPlaying ? 'Pause (k)' : 'Play (k)'}</p>
                </TooltipContent>
              </Tooltip>

              {/* Skip Backward */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => skip(-10)} className="text-white hover:bg-white/20">
                    <Rewind className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rewind 10s (j)</p>
                </TooltipContent>
              </Tooltip>

              {/* Skip Forward */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => skip(10)} className="text-white hover:bg-white/20">
                    <FastForward className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Forward 10s (l)</p>
                </TooltipContent>
              </Tooltip>

              {/* Volume */}
              <div className="flex items-center gap-1 group/volume">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/20">
                      {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mute (m)</p>
                  </TooltipContent>
                </Tooltip>
                <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-200">
                  <Slider
                    value={[isMuted ? 0 : volume * 100]}
                    max={100}
                    onValueChange={handleVolumeChange}
                    className="[&>span:first-child]:bg-white/30 [&_[role=slider]]:bg-white"
                  />
                </div>
              </div>

              {/* Time */}
              <span className="text-white text-sm ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Bookmark */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={addBookmark} className="text-white hover:bg-white/20">
                    <Bookmark className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add Bookmark</p>
                </TooltipContent>
              </Tooltip>

              {/* Subtitles */}
              {subtitles.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                      <Subtitles className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Subtitles</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setActiveSubtitle(null)}>
                      Off {!activeSubtitle && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                    {subtitles.map((sub) => (
                      <DropdownMenuItem key={sub.lang} onClick={() => setActiveSubtitle(sub.lang)}>
                        {sub.label} {activeSubtitle === sub.lang && <Check className="ml-auto h-4 w-4" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Speed */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 text-xs">
                    {playbackSpeed}x
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Playback Speed</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {playbackSpeeds.map((speed) => (
                    <DropdownMenuItem key={speed} onClick={() => changePlaybackSpeed(speed)}>
                      {speed}x {playbackSpeed === speed && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Settings */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Quality</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {qualityOptions.map((q) => (
                    <DropdownMenuItem key={q} onClick={() => setQuality(q)}>
                      {q} {quality === q && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* PiP */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={togglePiP} className="text-white hover:bg-white/20">
                    <PictureInPicture2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Picture in Picture</p>
                </TooltipContent>
              </Tooltip>

              {/* Fullscreen */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
                    {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fullscreen (f)</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Title Overlay */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity',
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          )}
        >
          <h2 className="text-white font-medium truncate">{title}</h2>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default VideoPlayer;
