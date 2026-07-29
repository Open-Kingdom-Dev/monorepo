import { FaApple } from 'react-icons/fa';
import useAppleMusicDemo from '../components/apple-music-demo/use-apple-music-demo';
import { AppleMusicOfflineBanner } from '../components/apple-music-demo/apple-music-offline-banner';
import { AppleMusicSearchPanel } from '../components/apple-music-demo/apple-music-search-panel';
import { AppleMusicSearchResults } from '../components/apple-music-demo/apple-music-search-results';
import { AppleMusicTwinStatus } from '../components/apple-music-demo/apple-music-twin-status';
import { AppleMusicPlayerShim } from '../components/apple-music-demo/apple-music-player-shim';
import { AppleMusicFaultSimulation } from '../components/apple-music-demo/apple-music-fault-simulation';
import { AppleMusicApiInspector } from '../components/apple-music-demo/apple-music-api-inspector';

export default function AppleMusicDemo() {
  const demo = useAppleMusicDemo();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5F6] via-white to-[#FAFBFC] relative overflow-hidden">
      {/* Background Ambient Spheres for Apple Music Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-red-400/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] rounded-full bg-pink-400/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] rounded-full bg-rose-300/10 blur-[130px] pointer-events-none" />

      <div className="p-6 max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Offline Warning Banner */}
        <AppleMusicOfflineBanner demo={demo} />

        {/* Apple Music styled Header */}
        <div className="space-y-2 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500 rounded-xl shadow-lg shadow-red-500/25 text-white">
              <FaApple className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight select-none">
              Music<span className="text-red-500 font-light">Kit</span> Twin
            </h1>
          </div>
          <p className="text-gray-500 max-w-2xl text-sm font-medium leading-relaxed">
            Verify mock catalog lookups, simulate edge-case exceptions, and test the custom browser-side MusicKit JS SDK emulator inside a premium, interactive playback workspace.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <AppleMusicSearchPanel demo={demo} />
            <AppleMusicSearchResults demo={demo} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <AppleMusicTwinStatus demo={demo} />
            <AppleMusicPlayerShim demo={demo} />
            <AppleMusicFaultSimulation demo={demo} />
          </div>
        </div>

        {/* API debugger inspector console */}
        <AppleMusicApiInspector demo={demo} />
      </div>
    </div>
  );
}
