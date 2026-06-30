import { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import {
  showSuccessNotification,
  showErrorNotification,
} from '@open-kingdom/shared-frontend-data-access-notifications';
import { logError } from '@open-kingdom/shared-frontend-data-access-logger';
import {
  baseApi,
  useYouTubeTwinControllerGetStatusQuery,
  useYouTubeTwinControllerStartMutation,
  useYouTubeTwinControllerStopMutation,
  useYouTubeTwinControllerResetMutation,
  useYoutubeSearchControllerActivateErrorModeMutation,
  useYoutubeSearchControllerDeactivateErrorModeMutation,
  YoutubeErrorModeType,
} from '@open-kingdom/shared-frontend-data-access-api-client';

export interface YoutubeSearchResultItem {
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

export interface YouTubePlayerInstance {
  destroy(): void;
}

export interface YouTubeTwinWindow extends Window {
  YT?: {
    Player: new (
      elementId: string,
      options: {
        width: string;
        height: string;
        videoId: string;
        playerVars?: Record<string, unknown>;
        events?: {
          onReady?: () => void;
          onStateChange?: (event: { data: number }) => void;
          onError?: (event: { data: number }) => void;
        };
      }
    ) => YouTubePlayerInstance;
  };
  onYouTubeIframeAPIReady?: () => void;
}

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'DELETE' | 'PLAY' | 'ERROR';
  url: string;
  status: number;
  statusText: string;
  response: unknown;
}

export default function useYoutubeDemo() {
  const dispatch = useDispatch();

  // RTK Query Status polling
  const {
    data: status,
    isLoading: loadingStatus,
    refetch: fetchStatus,
  } = useYouTubeTwinControllerGetStatusQuery(undefined, {
    pollingInterval: 5000,
  });

  const [startTwin, { isLoading: startingTwin }] =
    useYouTubeTwinControllerStartMutation();
  const [stopTwin, { isLoading: stoppingTwin }] =
    useYouTubeTwinControllerStopMutation();
  const [resetTwin, { isLoading: resettingTwin }] =
    useYouTubeTwinControllerResetMutation();

  const [triggerSearch, { isFetching: searching }] = (
    baseApi as unknown as {
      useLazyYoutubeSearchControllerSearchQuery: () => [
        (args: { q: string; maxResults?: number }) => {
          unwrap: () => Promise<{ items: YoutubeSearchResultItem[] }>;
        },
        { isFetching: boolean }
      ];
    }
  ).useLazyYoutubeSearchControllerSearchQuery();

  const [activateErrorMode, { isLoading: activatingError }] =
    useYoutubeSearchControllerActivateErrorModeMutation();
  const [deactivateErrorMode] =
    useYoutubeSearchControllerDeactivateErrorModeMutation();

  // Search State
  const [query, setQuery] = useState('yoga');
  const [maxResults, setMaxResults] = useState(3);
  const [searchResults, setSearchResults] = useState<YoutubeSearchResultItem[]>(
    []
  );

  // Player State
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<number>(-1);
  const [playerError, setPlayerError] = useState<number | null>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);

  // API Log states
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeLog = apiLogs.find((l) => l.id === selectedLogId) || apiLogs[0];

  const handleCopyToClipboard = async () => {
    if (!activeLog) return;
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(activeLog.response, null, 2)
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      dispatch(logError('Failed to copy API logs to clipboard'));
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
      const res = await executeRequest();
      const resObj = res as {
        status?: number;
        statusText?: string;
        data?: unknown;
      };
      const newEntry: ApiLogEntry = {
        id,
        timestamp,
        method,
        url,
        status: resObj.status ?? 200,
        statusText: resObj.statusText || 'OK',
        response: resObj.data,
      };
      setApiLogs((prev) => [newEntry, ...prev]);
      setSelectedLogId((prev) => prev ?? id);
      return res;
    } catch (error) {
      const err = error as {
        response?: { status?: number; statusText?: string; data?: unknown };
        status?: number;
        data?: unknown;
        message?: string;
      };
      const errorEntry: ApiLogEntry = {
        id,
        timestamp,
        method,
        url,
        status: err.response?.status || err.status || 500,
        statusText: err.response?.statusText || 'Error',
        response: err.response?.data ||
          err.data || { error: err.message || 'Unknown error' },
      };
      setApiLogs((prev) => [errorEntry, ...prev]);
      setSelectedLogId((prev) => prev ?? id);
      throw err;
    }
  }

  // Controls for Twin
  const handleStartTwin = async () => {
    try {
      await logApiCall('POST', '/api/youtube-twin/start', async () => {
        const data = await startTwin().unwrap();
        return {
          status: 200,
          statusText: 'OK',
          data,
        };
      });
      dispatch(showSuccessNotification('YouTube Twin started successfully'));
      fetchStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      dispatch(logError('Failed to start YouTube Twin: ' + message));
      dispatch(showErrorNotification('Failed to start YouTube Twin'));
    }
  };

  const handleStopTwin = async () => {
    try {
      await logApiCall('POST', '/api/youtube-twin/stop', async () => {
        const data = await stopTwin().unwrap();
        return {
          status: 200,
          statusText: 'OK',
          data,
        };
      });
      dispatch(showSuccessNotification('YouTube Twin stopped cleanly'));
      setSearchResults([]);
      setCurrentVideoId(null);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      fetchStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      dispatch(logError('Failed to stop YouTube Twin: ' + message));
      dispatch(showErrorNotification('Failed to stop YouTube Twin'));
    }
  };

  const handleResetTwin = async () => {
    try {
      await logApiCall('POST', '/api/youtube-twin/reset', async () => {
        const data = await resetTwin().unwrap();
        return {
          status: 200,
          statusText: 'OK',
          data,
        };
      });
      dispatch(
        showSuccessNotification('YouTube Twin state reset successfully')
      );
      fetchStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      dispatch(logError('Failed to reset YouTube Twin: ' + message));
      dispatch(showErrorNotification('Failed to reset YouTube Twin'));
    }
  };

  // Search Action
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      const url = `/api/youtube/search?q=${encodeURIComponent(
        query
      )}&maxResults=${maxResults}`;
      const response = await logApiCall('GET', url, async () => {
        const data = await triggerSearch({ q: query, maxResults }).unwrap();
        return {
          status: 200,
          statusText: 'OK',
          data,
        };
      });
      setSearchResults(response.data.items || []);
      dispatch(
        showSuccessNotification(
          `Found ${response.data.items?.length || 0} videos`
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      dispatch(logError('YouTube search failed: ' + message));
      dispatch(showErrorNotification('YouTube search failed'));
    }
  };

  // Error simulation action
  const handleSetErrorMode = async (mode: string) => {
    try {
      if (mode === 'none') {
        await logApiCall('DELETE', '/api/youtube/error-mode', async () => {
          const data = await deactivateErrorMode().unwrap();
          return {
            status: 200,
            statusText: 'OK',
            data,
          };
        });
        dispatch(showSuccessNotification('Error simulation deactivated'));
      } else {
        await logApiCall('POST', '/api/youtube/error-mode', async () => {
          const data = await activateErrorMode({
            youtubeActivateErrorModeDto: { type: mode as YoutubeErrorModeType },
          }).unwrap();
          return {
            status: 200,
            statusText: 'OK',
            data,
          };
        });
        dispatch(
          showSuccessNotification(`Simulated error mode set to: ${mode}`)
        );
      }
      fetchStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      dispatch(logError('Failed to configure error mode: ' + message));
      dispatch(showErrorNotification('Failed to configure error mode'));
    }
  };

  // Dynamic IFrame Loader
  const loadYoutubePlayerApi = (): Promise<void> => {
    return new Promise((resolve) => {
      const win = window as unknown as YouTubeTwinWindow;
      if (win.YT && win.YT.Player) {
        resolve();
        return;
      }

      const port = status?.port || 9016;
      const baseUrl = status?.url || `http://localhost:${port}`;
      let script = document.getElementById(
        'yt-twin-iframe-api'
      ) as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = 'yt-twin-iframe-api';
        script.src = `${baseUrl}/iframe_api`;
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

      const win = window as unknown as YouTubeTwinWindow;
      const YT = win.YT;
      if (!YT) {
        throw new Error('YouTube API is not loaded');
      }

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
          onStateChange: (event: { data: number }) => {
            setPlayerState(event.data);
            const stateLabels: Record<number, string> = {
              [-1]: 'UNSTARTED',
              0: 'ENDED',
              1: 'PLAYING',
              2: 'PAUSED',
              3: 'BUFFERING',
              5: 'CUED',
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
          onError: (event: { data: number }) => {
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
      const message = e instanceof Error ? e.message : String(e);
      dispatch(logError('Failed to load YouTube Player Shim: ' + message));
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

  return {
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
    setSearchResults,
    currentVideoId,
    setCurrentVideoId,
    playerState,
    setPlayerState,
    playerError,
    setPlayerError,
    playerRef,
    apiLogs,
    setApiLogs,
    selectedLogId,
    setSelectedLogId,
    copied,
    setCopied,
    activeLog,
    handleCopyToClipboard,
    handleStartTwin,
    handleStopTwin,
    handleResetTwin,
    handleSearch,
    handleSetErrorMode,
    playVideo,
    getPlayerStateLabel,
  };
}
