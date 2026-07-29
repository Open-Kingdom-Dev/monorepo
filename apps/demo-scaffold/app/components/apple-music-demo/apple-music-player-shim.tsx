import { useEffect, useState } from 'react';
import { Play, Pause, Square, SkipForward, SkipBack, Volume2, Share2, ListMusic } from 'lucide-react';
import { FaMusic } from 'react-icons/fa';
import { AppleMusicDemoHook } from './use-apple-music-demo';

export function AppleMusicPlayerShim({ demo }: { demo: AppleMusicDemoHook }) {
  const { currentTrack, playbackState, pauseTrack, resumeTrack, stopTrack } = demo;
  const [progress, setProgress] = useState(0); // in seconds

  const durationSec = currentTrack ? Math.round(currentTrack.durationMs / 1000) : 0;

  // Track progress simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playbackState === 2) { // PLAYING
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= durationSec) {
            stopTrack(); // stop if reached end
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (playbackState === 4) { // STOPPED
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [playbackState, durationSec, stopTrack]);

  // Reset progress when track changes
  useEffect(() => {
    setProgress(0);
  }, [currentTrack]);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const percent = durationSec > 0 ? (progress / durationSec) * 100 : 0;

  return (
    <div className="border border-white/20 rounded-2xl bg-white/70 backdrop-blur-md shadow-2xl p-6 space-y-6 transition-all duration-300 relative overflow-hidden select-none">
      {/* Background glass gradient glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-400/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-400/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex justify-between items-center border-b border-gray-100/50 pb-3">
        <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">Now Playing</span>
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
              {playbackState === 2 && (
                <div className="absolute inset-0 rounded-2xl bg-red-500/20 blur-xl scale-105 animate-pulse transition" />
              )}
              {currentTrack.artworkUrl ? (
                <img
                  src={currentTrack.artworkUrl.replace('{w}', '300').replace('{h}', '300')}
                  alt={currentTrack.name}
                  className={`w-36 h-36 rounded-2xl shadow-xl border border-white/40 object-cover relative z-10 transition-transform duration-500 ${
                    playbackState === 2 ? 'scale-105' : 'scale-100'
                  }`}
                />
              ) : (
                <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white text-5xl font-light shadow-xl relative z-10">
                  <FaMusic className="h-12 w-12" />
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
        <div className="relative w-full h-1 bg-gray-200/80 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-gray-400 px-0.5">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(durationSec)}</span>
        </div>
      </div>

      {/* Main Control Panel */}
      <div className="flex flex-col items-center space-y-4">
        {/* Buttons */}
        <div className="flex items-center gap-6">
          <button className="text-gray-400 hover:text-gray-600 active:scale-95 transition">
            <SkipBack className="h-5 w-5 fill-current" />
          </button>

          {playbackState === 2 ? (
            <button
              onClick={pauseTrack}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3 shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95 transition"
            >
              <Pause className="h-6 w-6 fill-current" />
            </button>
          ) : (
            <button
              onClick={currentTrack ? resumeTrack : undefined}
              disabled={!currentTrack}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3 shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:shadow-none disabled:bg-gray-300"
            >
              <Play className="h-6 w-6 fill-current ml-0.5" />
            </button>
          )}

          <button
            onClick={stopTrack}
            disabled={playbackState === 4}
            className="text-gray-400 hover:text-gray-600 active:scale-95 transition disabled:opacity-50"
          >
            <Square className="h-5 w-5 fill-current" />
          </button>

          <button className="text-gray-400 hover:text-gray-600 active:scale-95 transition">
            <SkipForward className="h-5 w-5 fill-current" />
          </button>
        </div>

        {/* Volume HUD */}
        <div className="flex items-center gap-2 w-full max-w-xs px-4 text-gray-400">
          <Volume2 className="h-3.5 w-3.5" />
          <div className="relative flex-1 h-1 bg-gray-200/80 rounded-full">
            <div className="absolute top-0 left-0 w-2/3 h-full bg-gray-400 rounded-full" />
          </div>
        </div>
      </div>

      {/* Meta tags */}
      {currentTrack && (
        <div className="pt-2 border-t border-gray-100/50 flex justify-between items-center text-[10px] text-gray-400 font-mono">
          <span>CODEC: AAC 256kbps</span>
          <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold">LOSSLESS</span>
        </div>
      )}
    </div>
  );
}
