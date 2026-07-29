import { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Share2,
  ListMusic,
} from 'lucide-react';
import { FaMusic } from 'react-icons/fa';
import { AppleMusicDemoHook } from './use-apple-music-demo';

export function AppleMusicPlayerShim({ demo }: { demo: AppleMusicDemoHook }) {
  const {
    currentTrack,
    playbackState,
    pauseTrack,
    resumeTrack,
    stopTrack,
    skipToNext,
    skipToPrevious,
    progress,
    duration,
    volume,
    setVolumeLevel,
  } = demo;

  const [isDraggingVolume, setIsDraggingVolume] = useState(false);

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const percent = duration > 0 ? Math.min((progress / duration) * 100, 100) : 0;

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newVolume = Math.max(0, Math.min(1, x / rect.width));
    setVolumeLevel(newVolume);
  };

  const isPlaying = playbackState === 2;
  const isStopped = playbackState === 4;
  const isLoading = playbackState === 1 || playbackState === 7; // loading or waiting

  return (
    <div className="border border-white/20 rounded-2xl bg-white/70 backdrop-blur-md shadow-2xl p-6 space-y-6 transition-all duration-300 relative overflow-hidden select-none">
      {/* Background glass gradient glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-400/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-400/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex justify-between items-center border-b border-gray-100/50 pb-3">
        <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">
          Now Playing
        </span>
        <div className="flex gap-2 text-gray-400">
          <Share2 className="h-4 w-4 hover:text-red-500 cursor-pointer transition" />
          <ListMusic className="h-4 w-4 hover:text-red-500 cursor-pointer transition" />
        </div>
      </div>

      {/* Album Artwork & Meta */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative group">
          {currentTrack ? (
            <div className="relative">
              {/* Outer glow during playback */}
              {isPlaying && (
                <div className="absolute inset-0 rounded-2xl bg-red-500/20 blur-xl scale-105 animate-pulse transition" />
              )}
              {currentTrack.artworkUrl ? (
                <img
                  src={currentTrack.artworkUrl
                    .replace('{w}', '300')
                    .replace('{h}', '300')}
                  alt={currentTrack.name}
                  className={`w-36 h-36 rounded-2xl shadow-xl border border-white/40 object-cover relative z-10 transition-transform duration-500 ${
                    isPlaying ? 'scale-105' : 'scale-100'
                  }`}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white text-5xl font-light shadow-xl relative z-10">
                  <FaMusic className="h-12 w-12" />
                </div>
              )}
              {/* Loading spinner overlay */}
              {isLoading && (
                <div className="absolute inset-0 rounded-2xl bg-black/20 flex items-center justify-center z-20">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="w-36 h-36 rounded-2xl bg-gray-100 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-xs gap-1">
              <FaMusic className="h-8 w-8 text-gray-300" />
              <span className="font-medium">No Song Loaded</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h4 className="font-extrabold text-gray-900 text-md line-clamp-1 px-2">
            {currentTrack ? currentTrack.name : 'Choose a Song'}
          </h4>
          <p className="text-xs font-semibold text-red-500 line-clamp-1">
            {currentTrack ? currentTrack.artistName : 'Apple Music Simulator'}
          </p>
          <p className="text-[10px] text-gray-400 font-medium line-clamp-1">
            {currentTrack ? currentTrack.albumName : 'Catalog Fixtures'}
          </p>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="space-y-1">
        <div className="relative w-full h-1.5 bg-gray-200/80 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full transition-all duration-150"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-gray-400 px-0.5">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Control Panel */}
      <div className="flex flex-col items-center space-y-4">
        {/* Buttons */}
        <div className="flex items-center gap-6">
          {/* Bug 5 fix: Previous button wired */}
          <button
            onClick={skipToPrevious}
            disabled={!currentTrack}
            className="text-gray-400 hover:text-gray-700 active:scale-95 transition disabled:opacity-30"
            title="Previous"
          >
            <SkipBack className="h-5 w-5 fill-current" />
          </button>

          {isPlaying ? (
            <button
              onClick={pauseTrack}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3 shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95 transition"
              title="Pause"
            >
              <Pause className="h-6 w-6 fill-current" />
            </button>
          ) : (
            <button
              onClick={currentTrack ? resumeTrack : undefined}
              disabled={!currentTrack || isLoading}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3 shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:shadow-none disabled:bg-gray-300"
              title="Play"
            >
              {isLoading ? (
                <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="h-6 w-6 fill-current ml-0.5" />
              )}
            </button>
          )}

          <button
            onClick={stopTrack}
            disabled={isStopped}
            className="text-gray-400 hover:text-gray-600 active:scale-95 transition disabled:opacity-30"
            title="Stop"
          >
            <Square className="h-5 w-5 fill-current" />
          </button>

          {/* Bug 5 fix: Next button wired */}
          <button
            onClick={skipToNext}
            disabled={!currentTrack}
            className="text-gray-400 hover:text-gray-700 active:scale-95 transition disabled:opacity-30"
            title="Next"
          >
            <SkipForward className="h-5 w-5 fill-current" />
          </button>
        </div>

        {/* Bug 4 fix: Real interactive volume bar */}
        <div className="flex items-center gap-2 w-full max-w-xs px-4 text-gray-400">
          <button
            onClick={() => setVolumeLevel(volume > 0 ? 0 : 0.8)}
            className="hover:text-gray-600 transition flex-shrink-0"
            title={volume === 0 ? 'Unmute' : 'Mute'}
          >
            {volume === 0 ? (
              <VolumeX className="h-3.5 w-3.5" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
          </button>
          <div
            className="relative flex-1 h-2 bg-gray-200/80 rounded-full cursor-pointer"
            onClick={handleVolumeClick}
            onMouseMove={(e) => {
              if (isDraggingVolume) {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                setVolumeLevel(Math.max(0, Math.min(1, x / rect.width)));
              }
            }}
            onMouseDown={() => setIsDraggingVolume(true)}
            onMouseUp={() => setIsDraggingVolume(false)}
            onMouseLeave={() => setIsDraggingVolume(false)}
            title={`Volume: ${Math.round(volume * 100)}%`}
          >
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-400 to-pink-400 rounded-full transition-all duration-75"
              style={{ width: `${volume * 100}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full shadow-md border border-white transition-all duration-75"
              style={{ left: `calc(${volume * 100}% - 6px)` }}
            />
          </div>
          <span className="text-[10px] font-mono w-6 text-right">
            {Math.round(volume * 100)}
          </span>
        </div>
      </div>

      {/* Meta tags */}
      {currentTrack && (
        <div className="pt-2 border-t border-gray-100/50 flex justify-between items-center text-[10px] text-gray-400 font-mono">
          <span>CODEC: AAC 256kbps</span>
          <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold">
            LOSSLESS
          </span>
        </div>
      )}
    </div>
  );
}
