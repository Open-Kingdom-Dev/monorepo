import { useState, useEffect, useRef } from 'react';
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
  audioUrl?: string | null;
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

  const [startTwin, { isLoading: startingTwin }] =
    useAppleMusicTwinControllerStartMutation();
  const [stopTwin, { isLoading: stoppingTwin }] =
    useAppleMusicTwinControllerStopMutation();
  const [resetTwin, { isLoading: resettingTwin }] =
    useAppleMusicTwinControllerResetMutation();
  const [setErrorMode, { isLoading: activatingError }] =
    useAppleMusicTwinControllerSetErrorModeMutation();
  const [clearErrorMode] = useAppleMusicTwinControllerClearErrorModeMutation();

  // Local State
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    songs?: AppleMusicTrack[];
    playlists?: AppleMusicPlaylist[];
  }>({});
  const [currentTrack, setCurrentTrack] = useState<AppleMusicTrack | null>(
    null
  );
  const [playbackState, setPlaybackState] = useState<number>(4); // Stopped (4)
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8); // 0..1

  // Track if MusicKit listeners have already been registered to avoid stacking
  const listenersRegistered = useRef(false);
  // Track the queue of tracks for skip functionality
  const currentQueueRef = useRef<AppleMusicTrack[]>([]);
  const currentIndexRef = useRef<number>(-1);

  const activeLog = apiLogs.find((l) => l.id === selectedLogId) || apiLogs[0];
  const activeTwin = status?.running ?? false;
  const errorModeObj = status?.errorMode as
    | { active?: boolean; mode?: string }
    | undefined;
  const errorActive = errorModeObj?.active ?? false;
  const currentErrorType = errorModeObj?.mode || 'none';
  const twinUrl = status?.url || 'http://localhost:9019';

  // --- Bug 6: Load all songs on initial mount when twin becomes active ---
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (activeTwin && !initialLoadDone.current) {
      initialLoadDone.current = true;
      loadAllSongs();
    }
    if (!activeTwin) {
      initialLoadDone.current = false;
    }
  }, [activeTwin]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAllSongs = async () => {
    setSearching(true);
    const fetchUrl = `${twinUrl}/v1/catalog/us/search?term=&types=songs,playlists`;
    try {
      const res = await fetch(fetchUrl);
      const data = await res.json();
      const songs = mapSongs(data.results?.songs?.data || []);
      const playlists = mapPlaylists(data.results?.playlists?.data || []);
      setSearchResults({ songs, playlists });
    } catch {
      // silently fail on initial load — user can search manually
    } finally {
      setSearching(false);
    }
  };

  // Helpers to map raw API results
  const mapSongs = (rawSongs: any[]): AppleMusicTrack[] =>
    rawSongs.map((s: any) => ({
      id: s.id,
      name: s.attributes.name,
      artistName: s.attributes.artistName,
      albumName: s.attributes.albumName,
      durationMs: s.attributes.durationInMillis,
      artworkUrl: s.attributes.artwork?.url || null,
      audioUrl: s.attributes.audioUrl || null,
    }));

  const mapPlaylists = (rawPlaylists: any[]): AppleMusicPlaylist[] =>
    rawPlaylists.map((p: any) => ({
      id: p.id,
      name: p.attributes.name,
      description: p.attributes.description?.standard || null,
      artworkUrl: p.attributes.artwork?.url || null,
      trackCount: p.attributes.trackCount,
      tracks: (p.relationships?.tracks?.data || []).map((t: any) => ({
        id: t.id,
        name: t.attributes.name,
        artistName: t.attributes.artistName,
        albumName: t.attributes.albumName,
        durationMs: t.attributes.durationInMillis,
        artworkUrl: t.attributes.artwork?.url || null,
        audioUrl: t.attributes.audioUrl || null,
      })),
    }));

  // Local Logger Helper
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
      dispatch(
        showSuccessNotification('Apple Music Twin started successfully')
      );
      fetchStatus();
    } catch (err: any) {
      dispatch(logError('Failed to start Apple Music Twin: ' + err.message));
      dispatch(showErrorNotification('Failed to start Apple Music Twin'));
    }
  };

  const handleStopTwin = async () => {
    try {
      // Stop browser audio FIRST — the <audio> element lives in the DOM and keeps
      // playing even after the Express twin server is shut down.
      const win = window as any;
      const instance = win.MusicKit?.getInstance();
      if (instance) {
        instance._audio?.pause();
        instance._audio && (instance._audio.currentTime = 0);
        instance._audio && (instance._audio.src = '');
        instance.playbackState = 4; // stopped
        instance._trigger?.('playbackStateDidChange');
      }
      setCurrentTrack(null);
      setProgress(0);
      setDuration(0);
      listenersRegistered.current = false; // allow fresh listener registration next play

      await logApiCall('POST', '/api/apple-music-twin/stop', async () => {
        const data = await stopTwin().unwrap();
        return { status: 200, statusText: 'OK', data };
      });
      dispatch(showSuccessNotification('Apple Music Twin stopped cleanly'));
      setSearchResults({});
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
      dispatch(
        showSuccessNotification('Apple Music Twin state reset successfully')
      );
      fetchStatus();
    } catch (err: any) {
      dispatch(logError('Failed to reset Apple Music Twin: ' + err.message));
      dispatch(showErrorNotification('Failed to reset Apple Music Twin'));
    }
  };

  // Search Action
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    setSearching(true);
    const term = query.trim();
    const fetchUrl = `${twinUrl}/v1/catalog/us/search?term=${encodeURIComponent(
      term
    )}&types=songs,playlists`;

    try {
      const response = await logApiCall('GET', fetchUrl, async () => {
        const res = await fetch(fetchUrl);
        const data = await res.json();
        if (!res.ok) throw { status: res.status, data };
        return { status: res.status, statusText: res.statusText, data };
      });

      const songs = mapSongs(response.data.results?.songs?.data || []);
      const playlists = mapPlaylists(
        response.data.results?.playlists?.data || []
      );
      setSearchResults({ songs, playlists });
    } catch (err: any) {
      dispatch(
        showErrorNotification(
          'Search failed: ' + (err.data?.errors?.[0]?.detail || 'Server error')
        )
      );
    } finally {
      setSearching(false);
    }
  };

  // Error simulation action
  const handleSetErrorMode = async (mode: string) => {
    try {
      if (mode === 'none') {
        await logApiCall(
          'DELETE',
          '/api/apple-music-twin/error-mode',
          async () => {
            const data = await clearErrorMode().unwrap();
            return { status: 200, statusText: 'OK', data };
          }
        );
      } else {
        await logApiCall(
          'POST',
          '/api/apple-music-twin/error-mode',
          async () => {
            const data = await setErrorMode({
              appleMusicErrorModeStateDto: { mode },
            }).unwrap();
            return { status: 200, statusText: 'OK', data };
          }
        );
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
      if (win.MusicKit) {
        resolve();
        return;
      }

      let script = document.getElementById(
        'apple-music-twin-sdk'
      ) as HTMLScriptElement;
      if (!script) {
        document.addEventListener('musickitloaded', () => resolve(), {
          once: true,
        });
        script = document.createElement('script');
        script.id = 'apple-music-twin-sdk';
        script.src = `${twinUrl}/musickit.js`;
        document.body.appendChild(script);
      } else {
        resolve();
      }
    });
  };

  // Get or create a configured MusicKit instance with all listeners attached once
  const getMusicKitInstance = async () => {
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

    // --- Bug 2/3 fix: Register listeners only once ---
    if (!listenersRegistered.current) {
      listenersRegistered.current = true;

      instance.addEventListener('playbackStateDidChange', () => {
        setPlaybackState(instance.playbackState);
        if (instance.playbackState === 4) {
          // Stopped
          setProgress(0);
        }
      });

      instance.addEventListener('nowPlayingItemDidChange', () => {
        // When the shim resolves the nowPlayingItem after a fetch, sync track to React state
        if (instance.nowPlayingItem) {
          const attrs = instance.nowPlayingItem.attributes;
          if (attrs) {
            setCurrentTrack((prev) => {
              if (prev?.id === instance.nowPlayingItem.id) return prev;
              return {
                id: instance.nowPlayingItem.id,
                name: attrs.name || '',
                artistName: attrs.artistName || '',
                albumName: attrs.albumName || '',
                durationMs: attrs.durationInMillis || 0,
                artworkUrl: attrs.artwork?.url || null,
                audioUrl: attrs.audioUrl || null,
              };
            });
          }
        }
      });

      instance.addEventListener('playbackTimeDidChange', () => {
        setProgress(instance.currentPlaybackTime || 0);
      });

      // Bug 2 fix: Use real durationchange from HTML5 audio, not mock durationMs
      instance.addEventListener('playbackDurationDidChange', () => {
        if (
          instance.currentPlaybackDuration &&
          instance.currentPlaybackDuration > 0
        ) {
          setDuration(instance.currentPlaybackDuration);
        }
      });
    }

    // Bug 4 fix: Sync volume to audio element on every call
    if (instance._audio) {
      instance._audio.volume = volume;
    }

    return instance;
  };

  // Internal: play a track object directly using its audioUrl in the queue
  const _playTrackInternal = async (
    track: AppleMusicTrack,
    queueTracks: AppleMusicTrack[],
    index: number
  ) => {
    setCurrentTrack(track);
    setProgress(0);
    // Set mock duration immediately so UI isn't blank; real duration will overwrite via durationchange
    setDuration(track.durationMs / 1000);

    currentQueueRef.current = queueTracks;
    currentIndexRef.current = index;

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
      const instance = await getMusicKitInstance();

      // Bug 1 fix: Pass the full track with attributes (including audioUrl) directly
      // so _updateNowPlaying doesn't need to fetch — audio src is set immediately
      await instance.setQueue({
        songs: [track.id],
        // inject attributes pre-loaded so shim skips the catalog fetch
        _preloadedAttributes: {
          [track.id]: {
            name: track.name,
            artistName: track.artistName,
            albumName: track.albumName,
            durationInMillis: track.durationMs,
            audioUrl: track.audioUrl,
            artwork: track.artworkUrl ? { url: track.artworkUrl } : null,
          },
        },
      });
      await instance.play();
    } catch (err: any) {
      dispatch(showErrorNotification('Failed to play track via MusicKit SDK'));
    }
  };

  // Public: play from a search result list (builds the queue from all results)
  const playTrack = async (track: AppleMusicTrack) => {
    const queue = searchResults.songs || [];
    const index = queue.findIndex((t) => t.id === track.id);
    await _playTrackInternal(
      track,
      queue.length > 0 ? queue : [track],
      index >= 0 ? index : 0
    );
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
            response: {
              event: 'onPause',
              message: 'Playback paused via MusicKit SDK',
            },
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
            response: {
              event: 'onResume',
              message: 'Playback resumed via MusicKit SDK',
            },
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
            response: {
              event: 'onStop',
              message: 'Playback stopped via MusicKit SDK',
            },
          },
          ...prev,
        ]);
        setSelectedLogId(stopLogId);
      }
    } catch (err: any) {
      dispatch(showErrorNotification('Failed to stop playback'));
    }
  };

  // Bug 5 fix: Next / Previous with actual queue traversal
  const skipToNext = async () => {
    const queue = currentQueueRef.current;
    if (queue.length === 0) return;
    const nextIndex = (currentIndexRef.current + 1) % queue.length;
    await _playTrackInternal(queue[nextIndex], queue, nextIndex);
  };

  const skipToPrevious = async () => {
    const queue = currentQueueRef.current;
    if (queue.length === 0) return;
    const prevIndex =
      (currentIndexRef.current - 1 + queue.length) % queue.length;
    await _playTrackInternal(queue[prevIndex], queue, prevIndex);
  };

  // Bug 4 fix: Volume setter — applies to live audio element immediately
  const setVolumeLevel = (level: number) => {
    const clamped = Math.max(0, Math.min(1, level));
    setVolume(clamped);
    const win = window as any;
    const instance = win.MusicKit?.getInstance();
    if (instance?._audio) {
      instance._audio.volume = clamped;
    }
  };

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
    skipToNext,
    skipToPrevious,
    progress,
    duration,
    volume,
    setVolumeLevel,
  };
}

export type AppleMusicDemoHook = ReturnType<typeof useAppleMusicDemo>;
