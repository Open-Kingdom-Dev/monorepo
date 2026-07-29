import { FaExclamationCircle } from 'react-icons/fa';
import { AppleMusicDemoHook } from './use-apple-music-demo';

interface AppleMusicOfflineBannerProps {
  demo: AppleMusicDemoHook;
}

export function AppleMusicOfflineBanner({
  demo,
}: AppleMusicOfflineBannerProps) {
  const { activeTwin, startingTwin, handleStartTwin } = demo;

  if (activeTwin) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-red-200 bg-red-50 text-red-800 rounded-xl">
      <div className="flex items-center gap-3">
        <FaExclamationCircle className="h-5 w-5 text-red-600 shrink-0" />
        <div>
          <h4 className="font-bold text-sm">Apple Music Twin Offline</h4>
          <p className="text-xs text-red-700 mt-0.5">
            The Express simulator server is stopped. Please start the service to
            enable search and playback shims.
          </p>
        </div>
      </div>
      <button
        onClick={handleStartTwin}
        disabled={startingTwin}
        className="whitespace-nowrap bg-red-600 hover:bg-red-700 text-white font-semibold py-1.5 px-4 rounded-lg text-xs transition"
      >
        {startingTwin ? 'Starting...' : 'Start Twin Service'}
      </button>
    </div>
  );
}
