import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  showSuccessNotification,
  showErrorNotification,
} from '@open-kingdom/shared-frontend-data-access-notifications';
import { logError } from '@open-kingdom/shared-frontend-data-access-logger';
import {
  useAppleMusicTwinControllerGetStatusQuery,
  useAppleMusicTwinControllerStartMutation,
  useAppleMusicTwinControllerStopMutation,
  useAppleMusicTwinControllerResetMutation,
  useAppleMusicTwinControllerSetErrorModeMutation,
  useAppleMusicTwinControllerClearErrorModeMutation,
} from '@open-kingdom/shared-frontend-data-access-api-client';

export interface AppleMusicTrack {
  id: string;
  name: string;
  artistName: string;
  albumName: string;
  durationMs: number;
  artworkUrl: string | null;
}

export interface AppleMusicPlaylist {
  id: string;
  name: string;
  description: string | null;
  artworkUrl: string | null;
  trackCount: number;
  tracks: AppleMusicTrack[];
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

export default function useAppleMusicDemo() {
  const dispatch = useDispatch();

  // Status Polling from NestJS Backend Controller
  const {
    data: status,
    isLoading: loadingStatus,
    refetch: fetchStatus,
  } = useAppleMusicTwinControllerGetStatusQuery(undefined, {
    pollingInterval: 5000,
  });

  const [startTwin, { isLoading: startingTwin }] = useAppleMusicTwinControllerStartMutation();
  const [stopTwin, { isLoading: stoppingTwin }] = useAppleMusicTwinControllerStopMutation();
  const [resetTwin, { isLoading: resettingTwin }] = useAppleMusicTwinControllerResetMutation();
  const [setErrorMode, { isLoading: activatingError }] = useAppleMusicTwinControllerSetErrorModeMutation();
  const [clearErrorMode] = useAppleMusicTwinControllerClearErrorModeMutation();

  // Local State
  const [query, setQuery] = useState('Meditation');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ songs?: AppleMusicTrack[]; playlists?: AppleMusicPlaylist[] }>({});
  const [currentTrack, setCurrentTrack] = useState<AppleMusicTrack | null>(null);
  const [playbackState, setPlaybackState] = useState<number>(4); // Stopped (4)
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeLog = apiLogs.find((l) => l.id === selectedLogId) || apiLogs[0];
  const activeTwin = status?.running ?? false;
  const errorModeObj = status?.errorMode as { active?: boolean; mode?: string } | undefined;
  const errorActive = errorModeObj?.active ?? false;
  const currentErrorType = errorModeObj?.mode || 'none';

  // Local Logger Helper (equivalent to the one inside use-youtube-demo.ts)
  async function logApiCall<T>(
    method: 'GET' | 'POST' | 'DELETE',
    url: string,
    executeRequest: () => Promise<T>
  ): Promise<T> {
    const timestamp = new Date().toLocaleTimeString();
    const id = Math.random().toString(36).substring(2, 9);
    try {
      const res = await executeRequest();
      const resObj = res as any;
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
    } catch (error: any) {
      const errorEntry: ApiLogEntry = {
        id,
        timestamp,
        method,
        url,
        status: error.status || 500,
        statusText: 'Error',
        response: error.data || { error: error.message || 'Unknown error' },
      };
      setApiLogs((prev) => [errorEntry, ...prev]);
      setSelectedLogId((prev) => prev ?? id);
      throw error;
    }
  }

  // Controller Handlers
  const handleStartTwin = async () => {
    try {
      await logApiCall('POST', '/api/apple-music-twin/start', async () => {
        const data = await startTwin().unwrap();
        return { status: 200, statusText: 'OK', data };
      });
      dispatch(showSuccessNotification('Apple Music Twin started successfully'));
      fetchStatus();
    } catch (err: any) {
      dispatch(logError('Failed to start Apple Music Twin: ' + err.message));
      dispatch(showErrorNotification('Failed to start Apple Music Twin'));
    }
  };

  const handleStopTwin = async () => {
    try {
      await logApiCall('POST', '/api/apple-music-twin/stop', async () => {
        const data = await stopTwin().unwrap();
        return { status: 200, statusText: 'OK', data };
      });
      dispatch(showSuccessNotification('Apple Music Twin stopped cleanly'));
      setSearchResults({});
      setCurrentTrack(null);
      fetchStatus();
    } catch (err: any) {
      dispatch(logError('Failed to stop Apple Music Twin: ' + err.message));
      dispatch(showErrorNotification('Failed to stop Apple Music Twin'));
    }
  };

  const handleResetTwin = async () => {
    try {
      await logApiCall('POST', '/api/apple-music-twin/reset', async () => {
        const data = await resetTwin().unwrap();
        return { status: 200, statusText: 'OK', data };
      });
      dispatch(showSuccessNotification('Apple Music Twin state reset successfully'));
      fetchStatus();
    } catch (err: any) {
      dispatch(logError('Failed to reset Apple Music Twin: ' + err.message));
      dispatch(showErrorNotification('Failed to reset Apple Music Twin'));
    }
  };

  // Search Action
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    const twinUrl = status?.url || 'http://localhost:9019';
    const fetchUrl = `${twinUrl}/v1/catalog/us/search?term=${encodeURIComponent(query)}&types=songs,playlists`;

    try {
      const response = await logApiCall('GET', fetchUrl, async () => {
        const res = await fetch(fetchUrl);
        const data = await res.json();
        if (!res.ok) throw { status: res.status, data };
        return { status: res.status, statusText: res.statusText, data };
      });

      const songs = response.data.results?.songs?.data?.map((s: any) => ({
        id: s.id,
        name: s.attributes.name,
        artistName: s.attributes.artistName,
        albumName: s.attributes.albumName,
        durationMs: s.attributes.durationInMillis,
        artworkUrl: s.attributes.artwork?.url || null,
      })) || [];

      const playlists = response.data.results?.playlists?.data?.map((p: any) => ({
        id: p.id,
        name: p.attributes.name,
        description: p.attributes.description?.standard || null,
        artworkUrl: p.attributes.artwork?.url || null,
        trackCount: p.attributes.trackCount,
        tracks: p.relationships?.tracks?.data?.map((t: any) => ({
          id: t.id,
          name: t.attributes.name,
          artistName: t.attributes.artistName,
          albumName: t.attributes.albumName,
          durationMs: t.attributes.durationInMillis,
          artworkUrl: t.attributes.artwork?.url || null,
        })) || [],
      })) || [];

      setSearchResults({ songs, playlists });
    } catch (err: any) {
      dispatch(showErrorNotification('Search failed: ' + (err.data?.errors?.[0]?.detail || 'Server error')));
    } finally {
      setSearching(false);
    }
  };

  // Error simulation action
  const handleSetErrorMode = async (mode: string) => {
    try {
      if (mode === 'none') {
        await logApiCall('DELETE', '/api/apple-music-twin/error-mode', async () => {
          const data = await clearErrorMode().unwrap();
          return { status: 200, statusText: 'OK', data };
        });
      } else {
        await logApiCall('POST', '/api/apple-music-twin/error-mode', async () => {
          const data = await setErrorMode({ appleMusicErrorModeStateDto: { mode } }).unwrap();
          return { status: 200, statusText: 'OK', data };
        });
      }
      fetchStatus();
    } catch (err: any) {
      dispatch(showErrorNotification('Failed to configure error mode'));
    }
  };

  // Load browser shim musickit.js script
  const loadMusicKitApi = (): Promise<void> => {
    return new Promise((resolve) => {
      const win = window as any;
      if (win.MusicKit && win.MusicKit.getInstance()) {
        resolve();
        return;
      }

      const twinUrl = status?.url || 'http://localhost:9019';
      let script = document.getElementById('apple-music-twin-sdk') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = 'apple-music-twin-sdk';
        script.src = `${twinUrl}/musickit.js`;
        document.body.appendChild(script);
      }

      document.addEventListener('musickitloaded', () => {
        resolve();
      });
    });
  };

  const playTrack = async (track: AppleMusicTrack) => {
    setCurrentTrack(track);
    const playLogId = Math.random().toString(36).substring(2, 9);
    setApiLogs((prev) => [
      {
        id: playLogId,
        timestamp: new Date().toLocaleTimeString(),
        method: 'PLAY',
        url: `musickit-player://play?trackId=${track.id}`,
        status: 200,
        statusText: 'OK',
        response: { event: 'onPlay', track },
      },
      ...prev,
    ]);
    setSelectedLogId(playLogId);

    try {
      await loadMusicKitApi();
      const win = window as any;
      const musicKit = win.MusicKit;
      let instance = musicKit.getInstance();

      if (!instance) {
        instance = await musicKit.configure({
          developerToken: 'mock-developer-token-jwt',
          app: { name: 'Demo Scaffold', version: '1.0' },
        });
      }

      instance.addEventListener('playbackStateDidChange', () => {
        setPlaybackState(instance.playbackState);
      });

      instance.addEventListener('nowPlayingItemDidChange', () => {
        console.log('[MusicKit Shim] nowPlayingItem changed');
      });

      await instance.setQueue({ song: track.id });
      await instance.play();
    } catch (err: any) {
      dispatch(showErrorNotification('Failed to play track via MusicKit SDK'));
    }
  };

  const pauseTrack = async () => {
    try {
      const win = window as any;
      const instance = win.MusicKit?.getInstance();
      if (instance) {
        await instance.pause();
        const pauseLogId = Math.random().toString(36).substring(2, 9);
        setApiLogs((prev) => [
          {
            id: pauseLogId,
            timestamp: new Date().toLocaleTimeString(),
            method: 'PLAY',
            url: 'musickit-player://pause',
            status: 200,
            statusText: 'OK',
            response: { event: 'onPause', message: 'Playback paused via MusicKit SDK' },
          },
          ...prev,
        ]);
        setSelectedLogId(pauseLogId);
      }
    } catch (err: any) {
      dispatch(showErrorNotification('Failed to pause playback'));
    }
  };

  const resumeTrack = async () => {
    try {
      const win = window as any;
      const instance = win.MusicKit?.getInstance();
      if (instance) {
        await instance.play();
        const resumeLogId = Math.random().toString(36).substring(2, 9);
        setApiLogs((prev) => [
          {
            id: resumeLogId,
            timestamp: new Date().toLocaleTimeString(),
            method: 'PLAY',
            url: 'musickit-player://resume',
            status: 200,
            statusText: 'OK',
            response: { event: 'onResume', message: 'Playback resumed via MusicKit SDK' },
          },
          ...prev,
        ]);
        setSelectedLogId(resumeLogId);
      }
    } catch (err: any) {
      dispatch(showErrorNotification('Failed to resume playback'));
    }
  };

  const stopTrack = async () => {
    try {
      const win = window as any;
      const instance = win.MusicKit?.getInstance();
      if (instance) {
        await instance.stop();
        const stopLogId = Math.random().toString(36).substring(2, 9);
        setApiLogs((prev) => [
          {
            id: stopLogId,
            timestamp: new Date().toLocaleTimeString(),
            method: 'PLAY',
            url: 'musickit-player://stop',
            status: 200,
            statusText: 'OK',
            response: { event: 'onStop', message: 'Playback stopped via MusicKit SDK' },
          },
          ...prev,
        ]);
        setSelectedLogId(stopLogId);
      }
    } catch (err: any) {
      dispatch(showErrorNotification('Failed to stop playback'));
    }
  };

  const handleCopyToClipboard = async () => {
    if (!activeLog) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(activeLog.response, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      dispatch(logError('Failed to copy API logs to clipboard'));
    }
  };

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
    searchResults,
    currentTrack,
    playbackState,
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
    playTrack,
    pauseTrack,
    resumeTrack,
    stopTrack,
  };
}

export type AppleMusicDemoHook = ReturnType<typeof useAppleMusicDemo>;
