import useYoutubeDemo from './use-youtube-demo';
import { YoutubeOfflineBanner } from '../components/youtube-demo/youtube-offline-banner';
import { YoutubeSearchPanel } from '../components/youtube-demo/youtube-search-panel';
import { YoutubeSearchResults } from '../components/youtube-demo/youtube-search-results';
import { YoutubeTwinStatus } from '../components/youtube-demo/youtube-twin-status';
import { YoutubePlayerShim } from '../components/youtube-demo/youtube-player-shim';
import { YoutubeFaultSimulation } from '../components/youtube-demo/youtube-fault-simulation';
import { YoutubeApiInspector } from '../components/youtube-demo/youtube-api-inspector';

export default function YouTubeDemo() {
  const {
    status,
    activeTwin,
    loadingStatus,
    startingTwin,
    stoppingTwin,
    resettingTwin,
    searching,
    activatingError,
    currentErrorType,
    errorActive,
    query,
    setQuery,
    maxResults,
    setMaxResults,
    searchResults,
    currentVideoId,
    playerState,
    playerError,
    apiLogs,
    setApiLogs,
    selectedLogId,
    setSelectedLogId,
    copied,
    activeLog,
    handleCopyToClipboard,
    handleStartTwin,
    handleStopTwin,
    handleResetTwin,
    handleSearch,
    handleSetErrorMode,
    playVideo,
    getPlayerStateLabel,
  } = useYoutubeDemo();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Offline Alert */}
      <YoutubeOfflineBanner
        activeTwin={activeTwin}
        startingTwin={startingTwin}
        onStartTwin={handleStartTwin}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          YouTube Digital Twin
        </h1>
        <p className="text-gray-500 mt-1 text-base">
          Verify and test mock YouTube queries, dynamic HTML5 video shim
          playback, and simulated edge-case exception handling.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Work Area: Search & Results */}
        <div className="lg:col-span-2 space-y-6">
          <YoutubeSearchPanel
            activeTwin={activeTwin}
            searching={searching}
            query={query}
            onQueryChange={setQuery}
            maxResults={maxResults}
            onMaxResultsChange={setMaxResults}
            onSearch={handleSearch}
          />

          <YoutubeSearchResults
            searchResults={searchResults}
            currentVideoId={currentVideoId}
            onPlayVideo={playVideo}
          />
        </div>

        {/* Sidebar: Status, Player, Fault Simulation */}
        <div className="space-y-6">
          <YoutubeTwinStatus
            activeTwin={activeTwin}
            loadingStatus={loadingStatus}
            statusPort={status?.port}
            statusUrl={status?.url}
            startingTwin={startingTwin}
            stoppingTwin={stoppingTwin}
            resettingTwin={resettingTwin}
            onStartTwin={handleStartTwin}
            onStopTwin={handleStopTwin}
            onResetTwin={handleResetTwin}
          />

          <YoutubePlayerShim
            currentVideoId={currentVideoId}
            playerState={playerState}
            playerError={playerError}
            getPlayerStateLabel={getPlayerStateLabel}
          />

          <YoutubeFaultSimulation
            activeTwin={activeTwin}
            activatingError={activatingError}
            currentErrorType={currentErrorType}
            errorActive={errorActive}
            onSetErrorMode={handleSetErrorMode}
          />
        </div>
      </div>

      {/* Full-Width API Inspector Card */}
      <YoutubeApiInspector
        apiLogs={apiLogs}
        activeLog={activeLog}
        selectedLogId={selectedLogId}
        onSelectLogId={setSelectedLogId}
        onClearConsole={() => {
          setApiLogs([]);
          setSelectedLogId(null);
        }}
        onCopyToClipboard={handleCopyToClipboard}
        copied={copied}
      />
    </div>
  );
}
