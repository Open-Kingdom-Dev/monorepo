/* eslint-disable @typescript-eslint/no-explicit-any, no-loop-func */
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import YouTubeDemo from './youtube-demo';
import { useDispatch } from 'react-redux';
import {
  baseApi,
  useYouTubeTwinControllerGetStatusQuery,
  useYouTubeTwinControllerStartMutation,
  useYouTubeTwinControllerStopMutation,
  useYouTubeTwinControllerResetMutation,
  useYoutubeSearchControllerActivateErrorModeMutation,
  useYoutubeSearchControllerDeactivateErrorModeMutation,
} from '@open-kingdom/shared-frontend-data-access-api-client';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('@open-kingdom/shared-frontend-data-access-api-client', () => ({
  baseApi: {
    useLazyYoutubeSearchControllerSearchQuery: jest.fn(),
  },
  useYouTubeTwinControllerGetStatusQuery: jest.fn(),
  useYouTubeTwinControllerStartMutation: jest.fn(),
  useYouTubeTwinControllerStopMutation: jest.fn(),
  useYouTubeTwinControllerResetMutation: jest.fn(),
  useYoutubeSearchControllerActivateErrorModeMutation: jest.fn(),
  useYoutubeSearchControllerDeactivateErrorModeMutation: jest.fn(),
}));

jest.mock('@open-kingdom/shared-frontend-data-access-notifications', () => ({
  showSuccessNotification: jest.fn((msg) => ({ type: 'SUCCESS', msg })),
  showErrorNotification: jest.fn((msg) => ({ type: 'ERROR', msg })),
}));

jest.mock('@open-kingdom/shared-frontend-data-access-logger', () => ({
  logError: jest.fn((msg) => ({ type: 'LOG_ERROR', msg })),
}));

describe('YouTube Twin Player Feature', () => {
  let mockDispatch: jest.Mock;
  let mockStartTwin: jest.Mock;
  let mockStopTwin: jest.Mock;
  let mockResetTwin: jest.Mock;
  let mockTriggerSearch: jest.Mock;
  let mockActivateErrorMode: jest.Mock;
  let mockDeactivateErrorMode: jest.Mock;
  let mockRefetchStatus: jest.Mock;
  let lastPlayerEvents: any = null;

  beforeEach(() => {
    mockDispatch = jest.fn();
    (useDispatch as any).mockReturnValue(mockDispatch);

    mockStartTwin = jest.fn().mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ success: true }),
    });
    (useYouTubeTwinControllerStartMutation as any).mockReturnValue([
      mockStartTwin,
      { isLoading: false },
    ]);

    mockStopTwin = jest.fn().mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ success: true }),
    });
    (useYouTubeTwinControllerStopMutation as any).mockReturnValue([
      mockStopTwin,
      { isLoading: false },
    ]);

    mockResetTwin = jest.fn().mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ success: true }),
    });
    (useYouTubeTwinControllerResetMutation as any).mockReturnValue([
      mockResetTwin,
      { isLoading: false },
    ]);

    mockTriggerSearch = jest.fn().mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({
        items: [
          {
            kind: 'youtube#searchResult',
            etag: 'etag-123',
            id: { kind: 'youtube#video', videoId: 'video-123' },
            snippet: {
              publishedAt: '2026-06-16T00:00:00.000Z',
              channelId: 'channel-123',
              title: 'Mock Yoga Video',
              description: 'A relaxing yoga session.',
              thumbnails: {
                medium: {
                  url: 'http://thumbnail-url/img.jpg',
                  width: 320,
                  height: 180,
                },
              },
              channelTitle: 'Yoga Channel',
            },
          },
        ],
      }),
    });
    (baseApi.useLazyYoutubeSearchControllerSearchQuery as any).mockReturnValue([
      mockTriggerSearch,
      { isFetching: false },
    ]);

    mockActivateErrorMode = jest.fn().mockReturnValue({
      unwrap: jest
        .fn()
        .mockResolvedValue({ active: true, type: 'daily-limit-exceeded' }),
    });
    (
      useYoutubeSearchControllerActivateErrorModeMutation as any
    ).mockReturnValue([mockActivateErrorMode, { isLoading: false }]);

    mockDeactivateErrorMode = jest.fn().mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ active: false, type: null }),
    });
    (
      useYoutubeSearchControllerDeactivateErrorModeMutation as any
    ).mockReturnValue([mockDeactivateErrorMode, { isLoading: false }]);

    mockRefetchStatus = jest.fn();
    (useYouTubeTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: true,
        healthy: true,
        port: 9016,
        url: 'http://localhost:9016',
        errorMode: { active: false, type: null },
      },
      isLoading: false,
      refetch: mockRefetchStatus,
    });

    // Mock YT Player global
    lastPlayerEvents = null;
    const mockPlayerConstructor = jest.fn().mockImplementation((id, config) => {
      lastPlayerEvents = config.events;
      return {
        destroy: jest.fn(),
      };
    });

    (window as any).YT = {
      Player: mockPlayerConstructor,
      PlayerState: {
        UNSTARTED: -1,
        ENDED: 0,
        PLAYING: 1,
        PAUSED: 2,
        BUFFERING: 3,
        CUED: 5,
      },
    } as any;

    // Default Clipboard Mock
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    delete (window as any).YT;
    jest.clearAllMocks();
  });

  it('should prompt the user to start the twin environment when the YouTube twin service is offline', () => {
    (useYouTubeTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: false,
        healthy: false,
        port: 9016,
        errorMode: { active: false },
      },
      isLoading: false,
      refetch: mockRefetchStatus,
    });

    render(<YouTubeDemo />);

    expect(screen.getByText('YouTube Twin Server is Offline')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Boot Twin' })).toBeTruthy();
  });

  it('should boot the twin environment and display a success notification when requested', async () => {
    (useYouTubeTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: false,
        healthy: false,
        port: 9016,
        errorMode: { active: false },
      },
      isLoading: false,
      refetch: mockRefetchStatus,
    });

    render(<YouTubeDemo />);

    const bootBtn = screen.getByRole('button', { name: 'Boot Twin' });
    await act(async () => {
      fireEvent.click(bootBtn);
    });

    expect(mockStartTwin).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SUCCESS',
          msg: 'YouTube Twin started successfully',
        })
      );
    });
    expect(mockRefetchStatus).toHaveBeenCalled();
  });

  it('should display an error notification if the twin environment fails to start', async () => {
    (useYouTubeTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: false,
        healthy: false,
        port: 9016,
        errorMode: { active: false },
      },
      isLoading: false,
      refetch: mockRefetchStatus,
    });

    mockStartTwin.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error('Docker timeout')),
    });

    render(<YouTubeDemo />);

    const bootBtn = screen.getByRole('button', { name: 'Boot Twin' });
    await act(async () => {
      fireEvent.click(bootBtn);
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'LOG_ERROR',
          msg: 'Failed to start YouTube Twin: Docker timeout',
        })
      );
    });
  });

  it('should shutdown the twin environment cleanly and clear transient client state', async () => {
    render(<YouTubeDemo />);

    const stopBtn = screen.getByRole('button', { name: 'Stop' });
    await act(async () => {
      fireEvent.click(stopBtn);
    });

    expect(mockStopTwin).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SUCCESS',
          msg: 'YouTube Twin stopped cleanly',
        })
      );
    });
  });

  it('should display an error notification if the twin environment fails to stop', async () => {
    mockStopTwin.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error('Process deadlock')),
    });

    render(<YouTubeDemo />);

    const stopBtn = screen.getByRole('button', { name: 'Stop' });
    await act(async () => {
      fireEvent.click(stopBtn);
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'LOG_ERROR',
          msg: 'Failed to stop YouTube Twin: Process deadlock',
        })
      );
    });
  });

  it('should reset twin fixtures and error modes back to baseline clean state', async () => {
    render(<YouTubeDemo />);

    const resetBtn = screen.getByRole('button', {
      name: /Reset Fixtures & Errors/i,
    });
    await act(async () => {
      fireEvent.click(resetBtn);
    });

    expect(mockResetTwin).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SUCCESS',
          msg: 'YouTube Twin state reset successfully',
        })
      );
    });
  });

  it('should display an error notification if resetting the twin environment fails', async () => {
    mockResetTwin.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error('Database lock')),
    });

    render(<YouTubeDemo />);

    const resetBtn = screen.getByRole('button', {
      name: /Reset Fixtures & Errors/i,
    });
    await act(async () => {
      fireEvent.click(resetBtn);
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'LOG_ERROR',
          msg: 'Failed to reset YouTube Twin: Database lock',
        })
      );
    });
  });

  it('should support searching mock catalog videos when the twin environment is active', async () => {
    render(<YouTubeDemo />);

    const searchInput = screen.getByPlaceholderText(/search mock videos/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'yoga' } });
    });

    const searchBtn = screen.getByRole('button', { name: '🔍 Search' });
    await act(async () => {
      fireEvent.click(searchBtn);
    });

    expect(mockTriggerSearch).toHaveBeenCalledWith({
      q: 'yoga',
      maxResults: 3,
    });
    await waitFor(() => {
      expect(screen.getByText('Mock Yoga Video')).toBeTruthy();
      expect(screen.getByText('Yoga Channel')).toBeTruthy();
    });
  });

  it('should display an error notification when mock catalog search query fails', async () => {
    mockTriggerSearch.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error('Simulated network fault')),
    });

    render(<YouTubeDemo />);

    const searchInput = screen.getByPlaceholderText(/search mock videos/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'space' } });
    });

    const searchBtn = screen.getByRole('button', { name: '🔍 Search' });
    await act(async () => {
      fireEvent.click(searchBtn);
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'LOG_ERROR',
          msg: 'YouTube search failed: Simulated network fault',
        })
      );
    });
  });

  it('should load and playback selected videos in the embedded player shim', async () => {
    render(<YouTubeDemo />);

    // Perform search first to get results
    const searchInput = screen.getByPlaceholderText(/search mock videos/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'yoga' } });
    });
    const searchBtn = screen.getByRole('button', { name: '🔍 Search' });
    await act(async () => {
      fireEvent.click(searchBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Mock Yoga Video')).toBeTruthy();
    });

    const loadBtn = screen.getByRole('button', { name: 'Load in Player' });
    await act(async () => {
      fireEvent.click(loadBtn);
    });

    await waitFor(() => {
      expect((window as any).YT.Player).toHaveBeenCalledWith(
        'youtube-player',
        expect.objectContaining({ videoId: 'video-123' })
      );
    });

    // Simulate ready event from YT player
    expect(lastPlayerEvents).toBeTruthy();
    if (lastPlayerEvents && lastPlayerEvents.onReady) {
      await act(async () => {
        lastPlayerEvents.onReady();
      });
    }

    // Simulate state changes to cover multiple codes (-1, 0, 1, 2, 3, 999, 5)
    const codes = [-1, 0, 1, 2, 3, 999, 5];
    for (const code of codes) {
      if (lastPlayerEvents && lastPlayerEvents.onStateChange) {
        await act(async () => {
          lastPlayerEvents.onStateChange({ data: code });
        });
      }
    }

    // Assert video details display player state
    await waitFor(() => {
      expect(screen.getByText('CUED')).toBeTruthy();
    });
  });

  it('should display player-level error indications when simulated player faults occur', async () => {
    render(<YouTubeDemo />);

    // Perform search first
    const searchInput = screen.getByPlaceholderText(/search mock videos/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'yoga' } });
    });
    const searchBtn = screen.getByRole('button', { name: '🔍 Search' });
    await act(async () => {
      fireEvent.click(searchBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Mock Yoga Video')).toBeTruthy();
    });

    const loadBtn = screen.getByRole('button', { name: 'Load in Player' });
    await act(async () => {
      fireEvent.click(loadBtn);
    });

    await waitFor(() => {
      expect(lastPlayerEvents).toBeTruthy();
    });

    // Test different error codes to cover error descriptions (2, 5, 100, 101, 150, 999)
    const errCodes = [2, 5, 100, 101, 150, 999];
    for (const code of errCodes) {
      if (lastPlayerEvents && lastPlayerEvents.onError) {
        await act(async () => {
          lastPlayerEvents.onError({ data: code });
        });
      }
    }

    await waitFor(() => {
      expect(screen.getByText('Player Error Code: 999')).toBeTruthy();
    });
  });

  it('should support injecting simulated API exceptions for application resilience testing', async () => {
    render(<YouTubeDemo />);

    const limitBtn = screen.getByRole('button', {
      name: /403 Daily Limit Exceeded/i,
    });
    await act(async () => {
      fireEvent.click(limitBtn);
    });

    expect(mockActivateErrorMode).toHaveBeenCalledWith({
      youtubeActivateErrorModeDto: { type: 'daily-limit-exceeded' },
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SUCCESS',
          msg: 'Simulated error mode set to: daily-limit-exceeded',
        })
      );
    });
  });

  it('should display an error notification if setting a simulated API error mode fails', async () => {
    mockActivateErrorMode.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error('Forbidden action')),
    });

    render(<YouTubeDemo />);

    const limitBtn = screen.getByRole('button', {
      name: /403 Daily Limit Exceeded/i,
    });
    await act(async () => {
      fireEvent.click(limitBtn);
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'LOG_ERROR',
          msg: 'Failed to configure error mode: Forbidden action',
        })
      );
    });
  });

  it('should clear simulated error mode and restore normal request flow when requested', async () => {
    (useYouTubeTwinControllerGetStatusQuery as any).mockReturnValue({
      data: {
        running: true,
        healthy: true,
        port: 9016,
        url: 'http://localhost:9016',
        errorMode: { active: true, type: 'daily-limit-exceeded' },
      },
      isLoading: false,
      refetch: mockRefetchStatus,
    });

    render(<YouTubeDemo />);

    const normalBtn = screen.getByRole('button', {
      name: /Normal Pass-Through/i,
    });
    await act(async () => {
      fireEvent.click(normalBtn);
    });

    expect(mockDeactivateErrorMode).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SUCCESS',
          msg: 'Error simulation deactivated',
        })
      );
    });
  });

  it('should display an error notification if player loading fails', async () => {
    // Make YT constructor fail on player instantiation
    (window as any).YT = {
      Player: jest.fn().mockImplementation(() => {
        throw new Error('Constructor exception');
      }),
      PlayerState: {
        UNSTARTED: -1,
        ENDED: 0,
        PLAYING: 1,
        PAUSED: 2,
        BUFFERING: 3,
        CUED: 5,
      },
    } as any;

    render(<YouTubeDemo />);

    // Perform search first
    const searchInput = screen.getByPlaceholderText(/search mock videos/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'yoga' } });
    });
    const searchBtn = screen.getByRole('button', { name: '🔍 Search' });
    await act(async () => {
      fireEvent.click(searchBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Mock Yoga Video')).toBeTruthy();
    });

    const loadBtn = screen.getByRole('button', { name: 'Load in Player' });
    await act(async () => {
      fireEvent.click(loadBtn);
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'LOG_ERROR',
          msg: expect.stringContaining('Failed to load YouTube Player Shim'),
        })
      );
    });
  });

  it('should support copying API inspector logs to the system clipboard', async () => {
    render(<YouTubeDemo />);

    // Force an API action to populate inspector logs
    const limitBtn = screen.getByRole('button', {
      name: /403 Daily Limit Exceeded/i,
    });
    await act(async () => {
      fireEvent.click(limitBtn);
    });

    // Copy JSON should be visible in API inspector
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Copy JSON/i })).toBeTruthy();
    });

    const copyBtn = screen.getByRole('button', { name: /Copy JSON/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText(/Copied/)).toBeTruthy();
    });
  });

  it('should log an error if writing to the system clipboard fails', async () => {
    // Make Clipboard write fail
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn().mockRejectedValue(new Error('Permission denied')),
      },
      configurable: true,
      writable: true,
    });

    render(<YouTubeDemo />);

    // Force an API action
    const limitBtn = screen.getByRole('button', {
      name: /403 Daily Limit Exceeded/i,
    });
    await act(async () => {
      fireEvent.click(limitBtn);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Copy JSON/i })).toBeTruthy();
    });

    const copyBtn = screen.getByRole('button', { name: /Copy JSON/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'LOG_ERROR',
          msg: 'Failed to copy API logs to clipboard',
        })
      );
    });
  });

  it('should destroy an existing player instance when loading a new video', async () => {
    render(<YouTubeDemo />);

    // Perform search
    const searchInput = screen.getByPlaceholderText(/search mock videos/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'yoga' } });
    });
    const searchBtn = screen.getByRole('button', { name: '🔍 Search' });
    await act(async () => {
      fireEvent.click(searchBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Mock Yoga Video')).toBeTruthy();
    });

    // Load first time
    const loadBtn = screen.getByRole('button', { name: 'Load in Player' });
    await act(async () => {
      fireEvent.click(loadBtn);
    });

    await waitFor(() => {
      expect((window as any).YT.Player).toHaveBeenCalledTimes(1);
    });

    // Load second time to trigger destroying the old player
    await act(async () => {
      fireEvent.click(loadBtn);
    });

    await waitFor(() => {
      expect((window as any).YT.Player).toHaveBeenCalledTimes(2);
    });
  });

  it('should destroy an active player instance when the digital twin environment is stopped', async () => {
    render(<YouTubeDemo />);

    // Perform search
    const searchInput = screen.getByPlaceholderText(/search mock videos/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'yoga' } });
    });
    const searchBtn = screen.getByRole('button', { name: '🔍 Search' });
    await act(async () => {
      fireEvent.click(searchBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Mock Yoga Video')).toBeTruthy();
    });

    // Load in player
    const loadBtn = screen.getByRole('button', { name: 'Load in Player' });
    await act(async () => {
      fireEvent.click(loadBtn);
    });

    await waitFor(() => {
      expect((window as any).YT.Player).toHaveBeenCalled();
    });

    // Click stop twin button
    const stopBtn = screen.getByRole('button', { name: 'Stop' });
    await act(async () => {
      fireEvent.click(stopBtn);
    });

    expect(mockStopTwin).toHaveBeenCalled();
  });

  it('should load YouTube player shim via dynamic iframe script if not already present', async () => {
    // Break the global window YT player API loader to trigger script loading
    delete (window as any).YT;

    render(<YouTubeDemo />);

    // Perform search
    const searchInput = screen.getByPlaceholderText(/search mock videos/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'yoga' } });
    });
    const searchBtn = screen.getByRole('button', { name: '🔍 Search' });
    await act(async () => {
      fireEvent.click(searchBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Mock Yoga Video')).toBeTruthy();
    });

    const loadBtn = screen.getByRole('button', { name: 'Load in Player' });
    await act(async () => {
      fireEvent.click(loadBtn);
    });

    // Verify script element was appended to body
    const script = document.getElementById('yt-twin-iframe-api');
    expect(script).toBeTruthy();

    // Verify script has the correct emulator url source
    expect(script?.getAttribute('src')).toBe(
      'http://localhost:9016/iframe_api'
    );

    // Manually trigger ready callback to resolve promise
    const mockPlayerConstructor = jest.fn().mockImplementation((id, config) => {
      lastPlayerEvents = config.events;
      return { destroy: jest.fn() };
    });
    (window as any).YT = {
      Player: mockPlayerConstructor,
      PlayerState: {
        UNSTARTED: -1,
        ENDED: 0,
        PLAYING: 1,
        PAUSED: 2,
        BUFFERING: 3,
        CUED: 5,
      },
    } as any;

    await act(async () => {
      (window as any).onYouTubeIframeAPIReady();
    });

    await waitFor(() => {
      expect(mockPlayerConstructor).toHaveBeenCalled();
    });
  });
});
