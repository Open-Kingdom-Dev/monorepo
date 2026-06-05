import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import {
  showSuccessNotification,
  showErrorNotification,
} from '@open-kingdom/shared-frontend-data-access-notifications';
import axios from 'axios';

interface YoutubeSearchResultItem {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    channelTitle: string;
    liveBroadcastContent: string;
  };
}

interface TwinStatus {
  running: boolean;
  healthy: boolean;
  port: number;
  url?: string;
  errorMode: {
    active: boolean;
    type: string | null;
    description: string | null;
  };
}

interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'DELETE' | 'PLAY' | 'ERROR';
  url: string;
  status: number;
  statusText: string;
  response: any;
}

export default function YouTubeDemo() {
  const dispatch = useDispatch();

  // Twin Status State
  const [status, setStatus] = useState<TwinStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [startingTwin, setStartingTwin] = useState(false);
  const [stoppingTwin, setStoppingTwin] = useState(false);
  const [resettingTwin, setResettingTwin] = useState(false);

  // Search State
  const [query, setQuery] = useState('yoga');
  const [maxResults, setMaxResults] = useState(3);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<YoutubeSearchResultItem[]>(
    []
  );

  // Player State
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<number>(-1); // UNSTARTED (-1)
  const [playerError, setPlayerError] = useState<number | null>(null);
  const playerRef = useRef<any>(null);

  // Error simulation state
  const [activatingError, setActivatingError] = useState<string | null>(null);

  // API Log states
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Active selected log calculation
  const activeLog = apiLogs.find((l) => l.id === selectedLogId) || apiLogs[0];

  const handleCopyToClipboard = async () => {
    if (!activeLog) return;
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(activeLog.response, null, 2)
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // API Logger Helper
  async function logApiCall<T>(
    method: 'GET' | 'POST' | 'DELETE',
    url: string,
    executeRequest: () => Promise<T>
  ): Promise<T> {
    const timestamp = new Date().toLocaleTimeString();
    const id = Math.random().toString(36).substring(2, 9);
    try {
      const res: any = await executeRequest();
      const newEntry: ApiLogEntry = {
        id,
        timestamp,
        method,
        url,
        status: res.status ?? 200,
        statusText: res.statusText || 'OK',
        response: res.data,
      };
      setApiLogs((prev) => [newEntry, ...prev]);
      setSelectedLogId((prev) => prev ?? id);
      return res;
    } catch (err: any) {
      const errorEntry: ApiLogEntry = {
        id,
        timestamp,
        method,
        url,
        status: err.response?.status || 500,
        statusText: err.response?.statusText || 'Internal Server Error',
        response: err.response?.data || { error: err.message },
      };
      setApiLogs((prev) => [errorEntry, ...prev]);
      setSelectedLogId((prev) => prev ?? id);
      throw err;
    }
  }

  // Fetch Twin Status
  const fetchStatus = async () => {
    try {
      const response = await axios.get('/api/youtube-twin/status');
      setStatus(response.data);
    } catch (err) {
      console.error('Failed to fetch YouTube twin status', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Controls for Twin
  const handleStartTwin = async () => {
    setStartingTwin(true);
    try {
      const response = await logApiCall('POST', '/api/youtube-twin/start', () =>
        axios.post('/api/youtube-twin/start')
      );
      if (response.status === 200 || response.status === 201) {
        dispatch(showSuccessNotification('YouTube Twin started successfully'));
        await fetchStatus();
      } else {
        dispatch(showErrorNotification('Failed to start YouTube Twin'));
      }
    } catch (err) {
      dispatch(showErrorNotification('Network error starting YouTube Twin'));
    } finally {
      setStartingTwin(false);
    }
  };

  const handleStopTwin = async () => {
    setStoppingTwin(true);
    try {
      const response = await logApiCall('POST', '/api/youtube-twin/stop', () =>
        axios.post('/api/youtube-twin/stop')
      );
      if (response.status === 200 || response.status === 201) {
        dispatch(showSuccessNotification('YouTube Twin stopped cleanly'));
        setSearchResults([]);
        setCurrentVideoId(null);
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }
        await fetchStatus();
      } else {
        dispatch(showErrorNotification('Failed to stop YouTube Twin'));
      }
    } catch (err) {
      dispatch(showErrorNotification('Network error stopping YouTube Twin'));
    } finally {
      setStoppingTwin(false);
    }
  };

  const handleResetTwin = async () => {
    setResettingTwin(true);
    try {
      const response = await logApiCall('POST', '/api/youtube-twin/reset', () =>
        axios.post('/api/youtube-twin/reset')
      );
      if (response.status === 200 || response.status === 201) {
        dispatch(
          showSuccessNotification('YouTube Twin state reset successfully')
        );
        await fetchStatus();
      } else {
        dispatch(showErrorNotification('Failed to reset YouTube Twin'));
      }
    } catch (err) {
      dispatch(showErrorNotification('Network error resetting YouTube Twin'));
    } finally {
      setResettingTwin(false);
    }
  };

  // Search Action
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    try {
      const url = `/api/youtube/search?q=${encodeURIComponent(
        query
      )}&maxResults=${maxResults}`;
      const response = await logApiCall('GET', url, () => axios.get(url));
      setSearchResults(response.data.items || []);
      dispatch(
        showSuccessNotification(
          `Found ${response.data.items?.length || 0} videos`
        )
      );
    } catch (err: any) {
      const message = err.response?.data?.message || 'YouTube search failed';
      dispatch(showErrorNotification(message));
    } finally {
      setSearching(false);
    }
  };

  // Error simulation action
  const handleSetErrorMode = async (mode: string) => {
    setActivatingError(mode);
    try {
      if (mode === 'none') {
        const response = await logApiCall(
          'DELETE',
          '/api/youtube/error-mode',
          () => axios.delete('/api/youtube/error-mode')
        );
        if (response.status === 200 || response.status === 201) {
          dispatch(showSuccessNotification('Error simulation deactivated'));
          await fetchStatus();
        }
      } else {
        const response = await logApiCall(
          'POST',
          '/api/youtube/error-mode',
          () => axios.post('/api/youtube/error-mode', { type: mode })
        );
        if (response.status === 200 || response.status === 201) {
          dispatch(
            showSuccessNotification(`Simulated error mode set to: ${mode}`)
          );
          await fetchStatus();
        }
      }
    } catch (err) {
      dispatch(showErrorNotification('Failed to configure error mode'));
    } finally {
      setActivatingError(null);
    }
  };

  // Dynamic IFrame Loader
  const loadYoutubePlayerApi = (): Promise<void> => {
    return new Promise((resolve) => {
      const win = window as any;
      if (win.YT && win.YT.Player) {
        resolve();
        return;
      }

      const port = status?.port || 9016;
      let script = document.getElementById(
        'yt-twin-iframe-api'
      ) as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = 'yt-twin-iframe-api';
        script.src = `http://localhost:${port}/iframe_api`;
        document.body.appendChild(script);
      }

      win.onYouTubeIframeAPIReady = () => {
        resolve();
      };
    });
  };

  const getPlayerErrorDescription = (code: number) => {
    switch (code) {
      case 2:
        return 'The request contains an invalid parameter value.';
      case 5:
        return 'The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.';
      case 100:
        return 'The video requested was not found (removed or marked as private).';
      case 101:
      case 150:
        return 'The owner of the requested video does not allow it to be played in embedded players.';
      default:
        return 'An unknown player error occurred.';
    }
  };

  const playVideo = async (videoId: string) => {
    setCurrentVideoId(videoId);
    setPlayerError(null);
    setPlayerState(-1); // UNSTARTED

    // Log the playback start action
    const playLogId = Math.random().toString(36).substring(2, 9);
    const playLog: ApiLogEntry = {
      id: playLogId,
      timestamp: new Date().toLocaleTimeString(),
      method: 'PLAY',
      url: `youtube-player://play?v=${videoId}`,
      status: 200,
      statusText: 'OK',
      response: {
        event: 'onPlay',
        videoId: videoId,
        playerState: 'UNSTARTED',
        timestamp: new Date().toISOString(),
        message: `Initializing YouTube Player Shim with video ID ${videoId}`,
      },
    };
    setApiLogs((prev) => [playLog, ...prev]);
    setSelectedLogId(playLogId);

    try {
      await loadYoutubePlayerApi();

      if (playerRef.current) {
        playerRef.current.destroy();
      }

      const win = window as any;
      const YT = win.YT;

      playerRef.current = new YT.Player('youtube-player', {
        width: '100%',
        height: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
        },
        events: {
          onReady: () => {
            console.log('YouTube twin player cued and ready');
            // Log when player is ready
            const readyLogId = Math.random().toString(36).substring(2, 9);
            const readyLog: ApiLogEntry = {
              id: readyLogId,
              timestamp: new Date().toLocaleTimeString(),
              method: 'PLAY',
              url: `youtube-player://ready?v=${videoId}`,
              status: 200,
              statusText: 'READY',
              response: {
                event: 'onReady',
                videoId: videoId,
                playerState: 'CUED',
                timestamp: new Date().toISOString(),
                message: 'YouTube Twin Player Shim loaded and ready',
              },
            };
            setApiLogs((prev) => [readyLog, ...prev]);
          },
          onStateChange: (event: any) => {
            setPlayerState(event.data);
            // Optionally log state change
            const stateLabels: Record<number, string> = {
              [-1]: 'UNSTARTED',
              [0]: 'ENDED',
              [1]: 'PLAYING',
              [2]: 'PAUSED',
              [3]: 'BUFFERING',
              [5]: 'CUED',
            };
            const label = stateLabels[event.data] || 'UNKNOWN';
            const stateLogId = Math.random().toString(36).substring(2, 9);
            const stateLog: ApiLogEntry = {
              id: stateLogId,
              timestamp: new Date().toLocaleTimeString(),
              method: 'PLAY',
              url: `youtube-player://state-change?state=${event.data}`,
              status: 200,
              statusText: label,
              response: {
                event: 'onStateChange',
                stateCode: event.data,
                stateLabel: label,
                videoId: videoId,
                timestamp: new Date().toISOString(),
              },
            };
            setApiLogs((prev) => [stateLog, ...prev]);
          },
          onError: (event: any) => {
            setPlayerError(event.data);
            // Log the player error
            const errLogId = Math.random().toString(36).substring(2, 9);
            const errorDescription = getPlayerErrorDescription(event.data);
            const errLog: ApiLogEntry = {
              id: errLogId,
              timestamp: new Date().toLocaleTimeString(),
              method: 'ERROR',
              url: `youtube-player://error?code=${event.data}`,
              status: event.data,
              statusText: 'PLAYER_ERROR',
              response: {
                event: 'onError',
                errorCode: event.data,
                description: errorDescription,
                videoId: videoId,
                timestamp: new Date().toISOString(),
                suggestion:
                  'Simulated exception triggered. Verify your client error handling logic.',
              },
            };
            setApiLogs((prev) => [errLog, ...prev]);
            setSelectedLogId(errLogId);
          },
        },
      });
    } catch (e) {
      console.error('Failed to initialize YouTube Twin player shim:', e);
      dispatch(showErrorNotification('Failed to load YouTube Player Shim'));
    }
  };

  const getPlayerStateLabel = (state: number) => {
    switch (state) {
      case -1:
        return { label: 'UNSTARTED', color: 'bg-gray-100 text-gray-800' };
      case 0:
        return { label: 'ENDED', color: 'bg-emerald-100 text-emerald-800' };
      case 1:
        return {
          label: 'PLAYING',
          color: 'bg-green-100 text-green-800 animate-pulse',
        };
      case 2:
        return { label: 'PAUSED', color: 'bg-yellow-100 text-yellow-800' };
      case 3:
        return {
          label: 'BUFFERING',
          color: 'bg-blue-100 text-blue-800 animate-pulse',
        };
      case 5:
        return { label: 'CUED', color: 'bg-purple-100 text-purple-800' };
      default:
        return { label: 'UNKNOWN', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const activeTwin = status?.running ?? false;
  const errorActive = status?.errorMode?.active ?? false;
  const currentErrorType = status?.errorMode?.type || 'none';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Offline Alert */}
      {!activeTwin && (
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
                Outbound search requests and player shims are disabled. Start
                the Twin to test YouTube functionalities.
              </p>
            </div>
          </div>
          <button
            onClick={handleStartTwin}
            disabled={startingTwin}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold disabled:opacity-50 transition text-sm whitespace-nowrap"
          >
            {startingTwin ? 'Starting...' : 'Boot Twin'}
          </button>
        </div>
      )}

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
          {/* Search panel */}
          <div className="border rounded-xl bg-white shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              Search Mock Catalog
            </h2>
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search mock videos (e.g., yoga, music, space)..."
                disabled={!activeTwin || searching}
                className="flex-1 border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                required
              />
              <div className="flex items-center gap-2">
                <select
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                  disabled={!activeTwin || searching}
                  className="border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none bg-white disabled:bg-gray-50"
                >
                  <option value={1}>1 Result</option>
                  <option value={3}>3 Results</option>
                  <option value={5}>5 Results</option>
                  <option value={10}>10 Results</option>
                </select>
                <button
                  type="submit"
                  disabled={!activeTwin || searching}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {searching ? 'Searching...' : '🔍 Search'}
                </button>
              </div>
            </form>
          </div>

          {/* Results grid */}
          <div className="border rounded-xl bg-white shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-3">
              Search Results
            </h2>
            {searchResults.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm flex flex-col items-center justify-center space-y-2">
                <span className="text-3xl">📺</span>
                <span>
                  No video search results. Try searching for "yoga" or "space"
                  after launching the twin.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((item) => (
                  <div
                    key={item.id.videoId}
                    className={`border rounded-lg overflow-hidden flex flex-col bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-300 ${
                      currentVideoId === item.id.videoId
                        ? 'border-blue-500 ring-2 ring-blue-100'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="relative aspect-video bg-black flex-shrink-0">
                      <img
                        src={item.snippet.thumbnails.medium.url}
                        alt={item.snippet.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-25 hover:bg-opacity-40 transition duration-200">
                        <button
                          onClick={() => playVideo(item.id.videoId)}
                          className="p-3 bg-red-600 text-white rounded-full hover:scale-110 shadow-lg transition transform duration-200"
                        >
                          ▶️
                        </button>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h4
                          className="font-bold text-gray-900 line-clamp-1"
                          title={item.snippet.title}
                        >
                          {item.snippet.title}
                        </h4>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">
                          {item.snippet.channelTitle}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-2 mt-1.5">
                          {item.snippet.description}
                        </p>
                      </div>
                      <button
                        onClick={() => playVideo(item.id.videoId)}
                        className={`w-full py-1.5 rounded text-xs font-bold transition ${
                          currentVideoId === item.id.videoId
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                        }`}
                      >
                        {currentVideoId === item.id.videoId
                          ? 'Currently Loaded'
                          : 'Load in Player'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Status, Player, Fault Simulation */}
        <div className="space-y-6">
          {/* Twin Launcher Status */}
          <div className="border rounded-xl bg-white shadow-sm p-5 space-y-4">
            <div className="border-b pb-3 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-md">
                Twin Environment
              </h3>
              <span
                className={`px-2 py-0.5 text-xs font-extrabold rounded-full ${
                  activeTwin
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {activeTwin ? 'ACTIVE' : 'OFFLINE'}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-semibold text-gray-900">
                  {loadingStatus
                    ? 'Checking...'
                    : activeTwin
                    ? 'Running'
                    : 'Stopped'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Port:</span>
                <span className="font-mono text-xs font-semibold text-gray-900">
                  {status?.port || 9016}
                </span>
              </div>
              {status?.url && (
                <div className="flex justify-between">
                  <span>URL:</span>
                  <code className="text-xs bg-gray-100 px-1 rounded font-semibold text-gray-900 truncate max-w-[150px]">
                    {status.url}
                  </code>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={handleStartTwin}
                disabled={activeTwin || startingTwin}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {startingTwin ? 'Starting...' : 'Start'}
              </button>
              <button
                onClick={handleStopTwin}
                disabled={!activeTwin || stoppingTwin}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {stoppingTwin ? 'Stopping...' : 'Stop'}
              </button>
            </div>
            <button
              onClick={handleResetTwin}
              disabled={!activeTwin || resettingTwin}
              className="w-full py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-lg transition disabled:opacity-50"
            >
              {resettingTwin ? 'Resetting...' : '🔄 Reset Fixtures & Errors'}
            </button>
          </div>

          {/* Embedded YT Player */}
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
                  {currentVideoId
                    ? 'Player initializing...'
                    : 'No Video Loaded'}
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
                  <span className="text-gray-500 font-semibold">
                    Player State:
                  </span>
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

          {/* Fault Simulation Panel */}
          <div className="border rounded-xl bg-white shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-gray-900 border-b pb-2 text-md">
              Fault Simulation
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Inject API queries or media delivery exceptions into the YouTube
              twin. Active:
              <span
                className={`ml-1 font-bold ${
                  errorActive ? 'text-purple-600' : 'text-gray-700'
                }`}
              >
                {currentErrorType}
              </span>
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleSetErrorMode('none')}
                disabled={!activeTwin || activatingError !== null}
                className={`w-full py-2 px-3 text-left rounded-lg text-xs font-bold transition border ${
                  currentErrorType === 'none'
                    ? 'bg-green-50 border-green-300 text-green-800'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                }`}
              >
                🟢 Normal Pass-Through
              </button>

              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  API Errors
                </span>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => handleSetErrorMode('daily-limit-exceeded')}
                    disabled={!activeTwin || activatingError !== null}
                    className={`py-2 px-3 text-left rounded-lg text-xs font-bold transition border ${
                      currentErrorType === 'daily-limit-exceeded'
                        ? 'bg-purple-50 border-purple-300 text-purple-800'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                    }`}
                  >
                    🟣 403 Daily Limit Exceeded
                  </button>
                  <button
                    onClick={() => handleSetErrorMode('invalid-api-key')}
                    disabled={!activeTwin || activatingError !== null}
                    className={`py-2 px-3 text-left rounded-lg text-xs font-bold transition border ${
                      currentErrorType === 'invalid-api-key'
                        ? 'bg-purple-50 border-purple-300 text-purple-800'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                    }`}
                  >
                    🟣 400 Invalid API Key
                  </button>
                  <button
                    onClick={() => handleSetErrorMode('empty-results')}
                    disabled={!activeTwin || activatingError !== null}
                    className={`py-2 px-3 text-left rounded-lg text-xs font-bold transition border ${
                      currentErrorType === 'empty-results'
                        ? 'bg-purple-50 border-purple-300 text-purple-800'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                    }`}
                  >
                    🟣 200 Empty Search Results
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Player Errors (Shim)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[2, 5, 100, 101, 150].map((code) => {
                    const modeType = `player-error-${code}`;
                    return (
                      <button
                        key={code}
                        onClick={() => handleSetErrorMode(modeType)}
                        disabled={!activeTwin || activatingError !== null}
                        className={`py-2 px-2 text-center rounded-lg text-xs font-bold transition border ${
                          currentErrorType === modeType
                            ? 'bg-purple-50 border-purple-300 text-purple-800'
                            : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                        }`}
                      >
                        Error Code {code}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width API Inspector Card */}
      <div className="border rounded-xl bg-white shadow-sm overflow-hidden mt-8 border-gray-200">
        <div className="border-b px-6 py-4 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🛠️</span>
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                YouTube API Inspector
              </h3>
              <p className="text-xs text-gray-500">
                Live request and response logging for simulated YouTube API
                endpoints
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setApiLogs([]);
                setSelectedLogId(null);
              }}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 font-semibold transition bg-white shadow-sm"
            >
              Clear Console
            </button>
          </div>
        </div>

        {apiLogs.length === 0 ? (
          <div className="p-16 text-center text-gray-400 text-sm font-medium flex flex-col items-center justify-center space-y-2">
            <span className="text-3xl">📥</span>
            <span>
              No API actions recorded yet. Try booting the twin, searching, or
              triggering an error above!
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 min-h-[400px]">
            {/* Left panel: List of requests */}
            <div className="lg:col-span-1 overflow-y-auto max-h-[400px] divide-y divide-gray-100 bg-white">
              {apiLogs.map((log) => {
                const isSelected = activeLog?.id === log.id;
                const methodColors =
                  log.method === 'GET'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : log.method === 'POST'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : log.method === 'DELETE'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : log.method === 'PLAY'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-red-50 text-red-700 border-red-200'; // ERROR

                const statusColors =
                  log.status >= 200 &&
                  log.status < 300 &&
                  log.method !== 'ERROR'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : log.method === 'ERROR' || log.status >= 400
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200';

                return (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className={`w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors border-l-4 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/20'
                        : 'border-transparent'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${methodColors}`}
                        >
                          {log.method}
                        </span>
                        <code className="text-xs font-mono font-semibold text-gray-700 truncate block">
                          {log.url.split('?')[0]}
                        </code>
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium">
                        {log.timestamp}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${statusColors}`}
                    >
                      {log.status}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right panel: Active request details & Response JSON */}
            {activeLog && (
              <div className="lg:col-span-2 p-6 bg-slate-950 text-slate-200 font-mono text-xs flex flex-col h-[400px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-400 font-bold uppercase">
                        {activeLog.method}
                      </span>
                      <code className="text-slate-100 font-bold break-all">
                        {activeLog.url}
                      </code>
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      Response Status:{' '}
                      <span
                        className={
                          activeLog.status >= 200 &&
                          activeLog.status < 300 &&
                          activeLog.method !== 'ERROR'
                            ? 'text-green-400 font-bold'
                            : 'text-rose-400 font-bold'
                        }
                      >
                        {activeLog.status} {activeLog.statusText}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleCopyToClipboard}
                    className="ml-4 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 font-sans font-medium text-[11px] transition flex items-center gap-1.5 whitespace-nowrap shadow-sm"
                  >
                    {copied ? (
                      <>
                        <span className="text-green-400">✓</span> Copied
                      </>
                    ) : (
                      <>
                        <span>📋</span> Copy JSON
                      </>
                    )}
                  </button>
                </div>

                <div className="flex-1 overflow-auto mt-4 p-4 rounded-lg bg-slate-900/50 border border-slate-900">
                  <pre className="text-emerald-400 font-mono text-xs leading-relaxed whitespace-pre-wrap word-break-all">
                    {JSON.stringify(activeLog.response, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
