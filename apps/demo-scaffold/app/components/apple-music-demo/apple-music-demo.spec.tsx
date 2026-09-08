import { render, screen, fireEvent } from '@testing-library/react';
import { AppleMusicOfflineBanner } from './apple-music-offline-banner';
import { AppleMusicSearchPanel } from './apple-music-search-panel';
import { AppleMusicSearchResults } from './apple-music-search-results';
import { AppleMusicPlayerShim } from './apple-music-player-shim';
import { AppleMusicFaultSimulation } from './apple-music-fault-simulation';
import { AppleMusicTwinStatus } from './apple-music-twin-status';
import { AppleMusicApiInspector } from './apple-music-api-inspector';
import type { AppleMusicDemoHook } from './use-apple-music-demo';

const baseMockDemo = (
  overrides: Partial<AppleMusicDemoHook> = {}
): AppleMusicDemoHook => ({
  status: undefined,
  activeTwin: false,
  loadingStatus: false,
  startingTwin: false,
  stoppingTwin: false,
  resettingTwin: false,
  searching: false,
  activatingError: false,
  currentErrorType: 'none',
  errorActive: false,
  query: '',
  setQuery: jest.fn(),
  searchResults: {},
  currentTrack: null,
  playbackState: 4,
  apiLogs: [],
  setApiLogs: jest.fn(),
  selectedLogId: null,
  setSelectedLogId: jest.fn(),
  copied: false,
  setCopied: jest.fn(),
  activeLog: undefined,
  handleCopyToClipboard: jest.fn(),
  handleStartTwin: jest.fn(),
  handleStopTwin: jest.fn(),
  handleResetTwin: jest.fn(),
  handleSearch: jest.fn(),
  handleSetErrorMode: jest.fn(),
  playTrack: jest.fn(),
  pauseTrack: jest.fn(),
  resumeTrack: jest.fn(),
  stopTrack: jest.fn(),
  skipToNext: jest.fn(),
  skipToPrevious: jest.fn(),
  progress: 0,
  duration: 0,
  volume: 0.8,
  setVolumeLevel: jest.fn(),
  ...overrides,
});

describe('AppleMusicOfflineBanner', () => {
  it('renders offline banner when twin is not active', () => {
    render(
      <AppleMusicOfflineBanner demo={baseMockDemo({ activeTwin: false })} />
    );
    expect(screen.getByText('Apple Music Twin Offline')).toBeTruthy();
    expect(screen.getByText('Start Twin Service')).toBeTruthy();
  });

  it('renders nothing when twin is active', () => {
    const { container } = render(
      <AppleMusicOfflineBanner demo={baseMockDemo({ activeTwin: true })} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows Starting... when startingTwin is true', () => {
    render(
      <AppleMusicOfflineBanner
        demo={baseMockDemo({ activeTwin: false, startingTwin: true })}
      />
    );
    expect(screen.getByText('Starting...')).toBeTruthy();
  });

  it('calls handleStartTwin on button click', () => {
    const handleStartTwin = jest.fn();
    render(
      <AppleMusicOfflineBanner
        demo={baseMockDemo({ activeTwin: false, handleStartTwin })}
      />
    );
    fireEvent.click(screen.getByText('Start Twin Service'));
    expect(handleStartTwin).toHaveBeenCalled();
  });
});

describe('AppleMusicSearchPanel', () => {
  it('renders search form', () => {
    render(<AppleMusicSearchPanel demo={baseMockDemo({ activeTwin: true })} />);
    expect(screen.getByText('Catalog Explorer')).toBeTruthy();
    expect(
      screen.getByPlaceholderText('Search songs or playlists...')
    ).toBeTruthy();
    expect(screen.getByText('Search')).toBeTruthy();
  });

  it('disables inputs when twin is not active', () => {
    render(
      <AppleMusicSearchPanel demo={baseMockDemo({ activeTwin: false })} />
    );
    expect(
      screen.getByPlaceholderText('Search songs or playlists...')
    ).toBeDisabled();
    expect(screen.getByText('Search')).toBeDisabled();
  });

  it('shows Searching... when searching', () => {
    render(
      <AppleMusicSearchPanel
        demo={baseMockDemo({ activeTwin: true, searching: true })}
      />
    );
    expect(screen.getByText('Searching...')).toBeTruthy();
  });

  it('calls setQuery on input change', () => {
    const setQuery = jest.fn();
    render(
      <AppleMusicSearchPanel
        demo={baseMockDemo({ activeTwin: true, setQuery })}
      />
    );
    fireEvent.change(
      screen.getByPlaceholderText('Search songs or playlists...'),
      {
        target: { value: 'test' },
      }
    );
    expect(setQuery).toHaveBeenCalledWith('test');
  });

  it('calls handleSearch on form submit', () => {
    const handleSearch = jest.fn();
    render(
      <AppleMusicSearchPanel
        demo={baseMockDemo({ activeTwin: true, handleSearch })}
      />
    );
    fireEvent.submit(screen.getByText('Catalog Explorer').closest('form')!);
    expect(handleSearch).toHaveBeenCalled();
  });
});

describe('AppleMusicSearchResults', () => {
  const mockSong = {
    id: 'song-1',
    name: 'Test Song',
    artistName: 'Test Artist',
    albumName: 'Test Album',
    durationMs: 200000,
    artworkUrl: null,
  };

  const mockPlaylist = {
    id: 'pl-1',
    name: 'Test Playlist',
    description: 'A test playlist',
    artworkUrl: null,
    trackCount: 10,
    tracks: [],
  };

  it('renders empty state when no results', () => {
    render(<AppleMusicSearchResults demo={baseMockDemo()} />);
    expect(
      screen.getByText(
        /No results. Run a search query to explore catalog fixtures/i
      )
    ).toBeTruthy();
  });

  it('renders songs when available', () => {
    const playTrack = jest.fn();
    render(
      <AppleMusicSearchResults
        demo={baseMockDemo({
          searchResults: { songs: [mockSong], playlists: [] },
          playTrack,
        })}
      />
    );
    expect(screen.getByText('Test Song')).toBeTruthy();
    expect(screen.getByText(/Test Artist.*Test Album/)).toBeTruthy();
    expect(screen.getByText('Play')).toBeTruthy();
  });

  it('renders playlists when available', () => {
    render(
      <AppleMusicSearchResults
        demo={baseMockDemo({
          searchResults: { songs: [], playlists: [mockPlaylist] },
        })}
      />
    );
    expect(screen.getByText('Test Playlist')).toBeTruthy();
    expect(screen.getByText('10 Songs')).toBeTruthy();
    expect(screen.getByText('A test playlist')).toBeTruthy();
  });

  it('shows playing state for current track', () => {
    render(
      <AppleMusicSearchResults
        demo={baseMockDemo({
          searchResults: { songs: [mockSong], playlists: [] },
          currentTrack: mockSong,
        })}
      />
    );
    expect(screen.getByText('Playing')).toBeTruthy();
  });

  it('calls playTrack when play button is clicked', () => {
    const playTrack = jest.fn();
    render(
      <AppleMusicSearchResults
        demo={baseMockDemo({
          searchResults: { songs: [mockSong], playlists: [] },
          playTrack,
        })}
      />
    );
    fireEvent.click(screen.getByText('Play'));
    expect(playTrack).toHaveBeenCalledWith(mockSong);
  });
});

describe('AppleMusicPlayerShim', () => {
  it('renders empty state when no track is loaded', () => {
    render(<AppleMusicPlayerShim demo={baseMockDemo()} />);
    expect(screen.getByText('No Song Loaded')).toBeTruthy();
    expect(screen.getByText('Choose a Song')).toBeTruthy();
    expect(screen.getByText('Apple Music Simulator')).toBeTruthy();
  });

  it('renders track info when a track is loaded', () => {
    const track = {
      id: 'track-1',
      name: 'My Song',
      artistName: 'My Artist',
      albumName: 'My Album',
      durationMs: 180000,
      artworkUrl: null,
    };
    render(
      <AppleMusicPlayerShim
        demo={baseMockDemo({ currentTrack: track, playbackState: 4 })}
      />
    );
    expect(screen.getByText('My Song')).toBeTruthy();
    expect(screen.getByText('My Artist')).toBeTruthy();
    expect(screen.getByText('My Album')).toBeTruthy();
  });

  it('renders playing state and pause button', () => {
    const track = {
      id: 'track-1',
      name: 'My Song',
      artistName: 'My Artist',
      albumName: 'My Album',
      durationMs: 180000,
      artworkUrl: null,
    };
    const pauseTrack = jest.fn();
    render(
      <AppleMusicPlayerShim
        demo={baseMockDemo({
          currentTrack: track,
          playbackState: 2,
          pauseTrack,
        })}
      />
    );
    const pauseBtn = screen.getByTitle('Pause');
    expect(pauseBtn).toBeTruthy();
    fireEvent.click(pauseBtn);
    expect(pauseTrack).toHaveBeenCalled();
  });

  it('renders play button when paused', () => {
    const track = {
      id: 'track-1',
      name: 'My Song',
      artistName: 'My Artist',
      albumName: 'My Album',
      durationMs: 180000,
      artworkUrl: null,
    };
    const resumeTrack = jest.fn();
    render(
      <AppleMusicPlayerShim
        demo={baseMockDemo({
          currentTrack: track,
          playbackState: 3,
          resumeTrack,
        })}
      />
    );
    const playBtn = screen.getByTitle('Play');
    expect(playBtn).toBeTruthy();
    fireEvent.click(playBtn);
    expect(resumeTrack).toHaveBeenCalled();
  });

  it('calls stopTrack on stop button click', () => {
    const track = {
      id: 'track-1',
      name: 'My Song',
      artistName: 'My Artist',
      albumName: 'My Album',
      durationMs: 180000,
      artworkUrl: null,
    };
    const stopTrack = jest.fn();
    render(
      <AppleMusicPlayerShim
        demo={baseMockDemo({
          currentTrack: track,
          playbackState: 2,
          stopTrack,
        })}
      />
    );
    fireEvent.click(screen.getByTitle('Stop'));
    expect(stopTrack).toHaveBeenCalled();
  });

  it('calls skipToNext on next button click', () => {
    const track = {
      id: 'track-1',
      name: 'My Song',
      artistName: 'My Artist',
      albumName: 'My Album',
      durationMs: 180000,
      artworkUrl: null,
    };
    const skipToNext = jest.fn();
    render(
      <AppleMusicPlayerShim
        demo={baseMockDemo({
          currentTrack: track,
          playbackState: 2,
          skipToNext,
        })}
      />
    );
    fireEvent.click(screen.getByTitle('Next'));
    expect(skipToNext).toHaveBeenCalled();
  });

  it('calls skipToPrevious on previous button click', () => {
    const track = {
      id: 'track-1',
      name: 'My Song',
      artistName: 'My Artist',
      albumName: 'My Album',
      durationMs: 180000,
      artworkUrl: null,
    };
    const skipToPrevious = jest.fn();
    render(
      <AppleMusicPlayerShim
        demo={baseMockDemo({
          currentTrack: track,
          playbackState: 2,
          skipToPrevious,
        })}
      />
    );
    fireEvent.click(screen.getByTitle('Previous'));
    expect(skipToPrevious).toHaveBeenCalled();
  });

  it('formats time correctly', () => {
    const track = {
      id: 'track-1',
      name: 'My Song',
      artistName: 'My Artist',
      albumName: 'My Album',
      durationMs: 200000,
      artworkUrl: null,
    };
    render(
      <AppleMusicPlayerShim
        demo={baseMockDemo({
          currentTrack: track,
          playbackState: 2,
          progress: 65,
          duration: 200,
        })}
      />
    );
    expect(screen.getByText('1:05')).toBeTruthy();
    expect(screen.getByText('3:20')).toBeTruthy();
  });

  it('toggles volume mute on mute button click', () => {
    const setVolumeLevel = jest.fn();
    render(
      <AppleMusicPlayerShim
        demo={baseMockDemo({ currentTrack: null, volume: 0.8, setVolumeLevel })}
      />
    );
    fireEvent.click(screen.getByTitle('Mute'));
    expect(setVolumeLevel).toHaveBeenCalledWith(0);
  });

  it('unmutes when volume is 0', () => {
    const setVolumeLevel = jest.fn();
    render(
      <AppleMusicPlayerShim
        demo={baseMockDemo({ currentTrack: null, volume: 0, setVolumeLevel })}
      />
    );
    fireEvent.click(screen.getByTitle('Unmute'));
    expect(setVolumeLevel).toHaveBeenCalledWith(0.8);
  });

  it('disables next/previous when no track', () => {
    render(
      <AppleMusicPlayerShim demo={baseMockDemo({ currentTrack: null })} />
    );
    expect(screen.getByTitle('Previous')).toBeDisabled();
    expect(screen.getByTitle('Next')).toBeDisabled();
  });

  it('shows codec info when track is loaded', () => {
    const track = {
      id: 'track-1',
      name: 'My Song',
      artistName: 'My Artist',
      albumName: 'My Album',
      durationMs: 180000,
      artworkUrl: null,
    };
    render(
      <AppleMusicPlayerShim
        demo={baseMockDemo({ currentTrack: track, playbackState: 2 })}
      />
    );
    expect(screen.getByText(/CODEC: AAC 256kbps/)).toBeTruthy();
    expect(screen.getByText('LOSSLESS')).toBeTruthy();
  });
});

describe('AppleMusicFaultSimulation', () => {
  it('renders fault simulation panel', () => {
    render(
      <AppleMusicFaultSimulation demo={baseMockDemo({ activeTwin: true })} />
    );
    expect(screen.getByText('Fault Simulation')).toBeTruthy();
    expect(screen.getByText('Inject Simulated Error:')).toBeTruthy();
  });

  it('disables select when twin is not active', () => {
    render(
      <AppleMusicFaultSimulation demo={baseMockDemo({ activeTwin: false })} />
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('calls handleSetErrorMode on select change', () => {
    const handleSetErrorMode = jest.fn();
    render(
      <AppleMusicFaultSimulation
        demo={baseMockDemo({ activeTwin: true, handleSetErrorMode })}
      />
    );
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'rate-limited' },
    });
    expect(handleSetErrorMode).toHaveBeenCalledWith('rate-limited');
  });

  it('shows error active warning when errorActive is true', () => {
    render(
      <AppleMusicFaultSimulation
        demo={baseMockDemo({
          activeTwin: true,
          errorActive: true,
          currentErrorType: 'rate-limited',
        })}
      />
    );
    expect(screen.getByText(/Simulated mode active/i)).toBeTruthy();
  });
});

describe('AppleMusicTwinStatus', () => {
  it('renders loading state', () => {
    render(
      <AppleMusicTwinStatus demo={baseMockDemo({ loadingStatus: true })} />
    );
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('renders start button when twin is not active', () => {
    const handleStartTwin = jest.fn();
    render(
      <AppleMusicTwinStatus
        demo={baseMockDemo({ activeTwin: false, handleStartTwin })}
      />
    );
    const startBtn = screen.getByText('Start Twin Service');
    expect(startBtn).toBeTruthy();
    fireEvent.click(startBtn);
    expect(handleStartTwin).toHaveBeenCalled();
  });

  it('renders stop button when twin is active', () => {
    const handleStopTwin = jest.fn();
    render(
      <AppleMusicTwinStatus
        demo={baseMockDemo({ activeTwin: true, handleStopTwin })}
      />
    );
    const stopBtn = screen.getByText('Stop Twin Service');
    expect(stopBtn).toBeTruthy();
    fireEvent.click(stopBtn);
    expect(handleStopTwin).toHaveBeenCalled();
  });

  it('shows Starting... when startingTwin', () => {
    render(
      <AppleMusicTwinStatus
        demo={baseMockDemo({ activeTwin: false, startingTwin: true })}
      />
    );
    expect(screen.getByText('Starting...')).toBeTruthy();
  });

  it('shows Stopping... when stoppingTwin', () => {
    render(
      <AppleMusicTwinStatus
        demo={baseMockDemo({ activeTwin: true, stoppingTwin: true })}
      />
    );
    expect(screen.getByText('Stopping...')).toBeTruthy();
  });

  it('shows Resetting... when resettingTwin', () => {
    render(
      <AppleMusicTwinStatus
        demo={baseMockDemo({ activeTwin: true, resettingTwin: true })}
      />
    );
    expect(screen.getByText('Resetting...')).toBeTruthy();
  });

  it('renders service port and URL', () => {
    render(
      <AppleMusicTwinStatus
        demo={baseMockDemo({
          status: {
            running: true,
            port: 9019,
            url: 'http://localhost:9019',
            healthy: true,
            realGmailConfigured: false,
            errorMode: { active: false },
          } as any,
        })}
      />
    );
    expect(screen.getByText('9019')).toBeTruthy();
  });
});

describe('AppleMusicApiInspector', () => {
  it('renders empty state', () => {
    render(<AppleMusicApiInspector demo={baseMockDemo()} />);
    expect(screen.getByText('Apple Music API Console')).toBeTruthy();
    expect(screen.getByText('No requests logged yet.')).toBeTruthy();
  });

  it('renders log entries', () => {
    const logs = [
      {
        id: 'log-1',
        timestamp: '12:00:00',
        method: 'GET' as const,
        url: '/api/test',
        status: 200,
        statusText: 'OK',
        response: { data: 'test' },
      },
    ];
    render(
      <AppleMusicApiInspector
        demo={baseMockDemo({
          apiLogs: logs,
          selectedLogId: 'log-1',
          activeLog: logs[0],
        })}
      />
    );
    expect(screen.getByText('12:00:00')).toBeTruthy();
    expect(screen.getByText('200')).toBeTruthy();
    expect(screen.getByText('/api/test')).toBeTruthy();
    expect(screen.getByText('Copy JSON')).toBeTruthy();
  });

  it('renders error status in red', () => {
    const logs = [
      {
        id: 'log-1',
        timestamp: '12:00:00',
        method: 'GET' as const,
        url: '/api/test',
        status: 500,
        statusText: 'Error',
        response: { error: 'fail' },
      },
    ];
    render(
      <AppleMusicApiInspector
        demo={baseMockDemo({
          apiLogs: logs,
          selectedLogId: 'log-1',
          activeLog: logs[0],
        })}
      />
    );
    const statusEl = screen.getByText('500');
    expect(statusEl.className).toContain('text-red-600');
  });

  it('calls setSelectedLogId on log entry click', () => {
    const setSelectedLogId = jest.fn();
    const logs = [
      {
        id: 'log-1',
        timestamp: '12:00:00',
        method: 'GET' as const,
        url: '/api/test',
        status: 200,
        statusText: 'OK',
        response: { data: 'test' },
      },
    ];
    render(
      <AppleMusicApiInspector
        demo={baseMockDemo({ apiLogs: logs, setSelectedLogId })}
      />
    );
    fireEvent.click(screen.getByText('12:00:00'));
    expect(setSelectedLogId).toHaveBeenCalledWith('log-1');
  });

  it('calls handleCopyToClipboard on Copy JSON click', () => {
    const handleCopyToClipboard = jest.fn();
    const logs = [
      {
        id: 'log-1',
        timestamp: '12:00:00',
        method: 'GET' as const,
        url: '/api/test',
        status: 200,
        statusText: 'OK',
        response: { data: 'test' },
      },
    ];
    render(
      <AppleMusicApiInspector
        demo={baseMockDemo({
          apiLogs: logs,
          selectedLogId: 'log-1',
          activeLog: logs[0],
          handleCopyToClipboard,
        })}
      />
    );
    fireEvent.click(screen.getByText('Copy JSON'));
    expect(handleCopyToClipboard).toHaveBeenCalled();
  });

  it('shows Copied! text when copied is true', () => {
    const logs = [
      {
        id: 'log-1',
        timestamp: '12:00:00',
        method: 'GET' as const,
        url: '/api/test',
        status: 200,
        statusText: 'OK',
        response: { data: 'test' },
      },
    ];
    render(
      <AppleMusicApiInspector
        demo={baseMockDemo({
          apiLogs: logs,
          selectedLogId: 'log-1',
          activeLog: logs[0],
          copied: true,
        })}
      />
    );
    expect(screen.getByText('Copied!')).toBeTruthy();
  });

  it('calls clear console button', () => {
    const setApiLogs = jest.fn();
    const setSelectedLogId = jest.fn();
    const logs = [
      {
        id: 'log-1',
        timestamp: '12:00:00',
        method: 'GET' as const,
        url: '/api/test',
        status: 200,
        statusText: 'OK',
        response: { data: 'test' },
      },
    ];
    render(
      <AppleMusicApiInspector
        demo={baseMockDemo({
          apiLogs: logs,
          setApiLogs,
          setSelectedLogId,
        })}
      />
    );
    fireEvent.click(screen.getByText('Clear Console'));
    expect(setApiLogs).toHaveBeenCalledWith([]);
    expect(setSelectedLogId).toHaveBeenCalledWith(null);
  });
});
