interface YoutubeOfflineBannerProps {
  activeTwin: boolean;
  startingTwin: boolean;
  onStartTwin: () => void;
}

export function YoutubeOfflineBanner({
  activeTwin,
  startingTwin,
  onStartTwin,
}: YoutubeOfflineBannerProps) {
  if (activeTwin) return null;

  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-4 shadow-sm transition-all duration-300">
      <div className="flex items-center gap-3">
        <span role="img" aria-label="Warning" className="text-2xl">
          ⚠️
        </span>
        <div>
          <p className="font-semibold text-amber-900">
            YouTube Twin Server is Offline
          </p>
          <p className="text-sm text-amber-700">
            Outbound search requests and player shims are disabled. Start the
            Twin to test YouTube functionalities.
          </p>
        </div>
      </div>
      <button
        onClick={onStartTwin}
        disabled={startingTwin}
        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold disabled:opacity-50 transition text-sm whitespace-nowrap"
      >
        {startingTwin ? 'Starting...' : 'Boot Twin'}
      </button>
    </div>
  );
}
