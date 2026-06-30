/* eslint-disable jsx-a11y/accessible-emoji */
interface YoutubePlayerShimProps {
  currentVideoId: string | null;
  playerState: number;
  playerError: number | null;
  getPlayerStateLabel: (state: number) => { label: string; color: string };
}

export function YoutubePlayerShim({
  currentVideoId,
  playerState,
  playerError,
  getPlayerStateLabel,
}: YoutubePlayerShimProps) {
  return (
    <div className="border rounded-xl bg-white shadow-sm p-5 space-y-4">
      <h3 className="font-bold text-gray-900 border-b pb-2 text-md">
        Embedded Player Shim
      </h3>
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
        <div
          id="youtube-player"
          className="w-full h-full flex items-center justify-center text-center p-4"
        >
          <span className="text-sm text-gray-500 font-medium">
            {currentVideoId ? 'Player initializing...' : 'No Video Loaded'}
          </span>
        </div>
      </div>
      {/* Player details */}
      {currentVideoId && (
        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-semibold">Video ID:</span>
            <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-900">
              {currentVideoId}
            </code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-semibold">Player State:</span>
            <span
              className={`px-2 py-0.5 rounded font-bold ${
                getPlayerStateLabel(playerState).color
              }`}
            >
              {getPlayerStateLabel(playerState).label}
            </span>
          </div>
          {playerError !== null && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-800 rounded font-semibold flex items-center gap-2 animate-bounce">
              <span>⚠️</span>
              <span>Player Error Code: {playerError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
