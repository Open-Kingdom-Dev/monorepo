/**
 * @jest-environment jsdom
 */
import fetch from 'node-fetch';
import { generatePlayerShim } from '../player-shim.js';
import { YoutubeTwin } from '../youtube-twin.js';

// Polyfill fetch in JSDOM environment using node-fetch
if (typeof window !== 'undefined') {
  window.fetch = fetch as any;
}
if (typeof global !== 'undefined') {
  (global as any).fetch = fetch;
}

describe('generatePlayerShim', () => {
  it('should replace base URL placeholder', () => {
    const twinUrl = 'http://localhost:9019';
    const code = generatePlayerShim(twinUrl);

    expect(code).toContain('window.YT =');
    expect(code).toContain('PlayerState =');
    expect(code).toContain(twinUrl);
    expect(code).not.toContain('__TWIN_BASE_URL__');
  });
});

describe('Player Shim Browser DOM Behavior (JSDOM)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    jest.useFakeTimers();
    container = document.createElement('div');
    container.id = 'player-container';
    document.body.appendChild(container);

    // Clear globals
    delete (window as any).YT;
    delete (window as any).onYouTubeIframeAPIReady;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.useRealTimers();
  });

  it('should define YT namespace and trigger onYouTubeIframeAPIReady', () => {
    const apiReadySpy = jest.fn();
    (window as any).onYouTubeIframeAPIReady = apiReadySpy;

    const code = generatePlayerShim('http://localhost:9019');
    // Evaluate the shim in JSDOM context
    const fn = new Function(code);
    fn();

    expect((window as any).YT).toBeDefined();
    expect((window as any).YT.PlayerState.PLAYING).toBe(1);

    // Fast-forward global api-ready timeout
    jest.advanceTimersByTime(1);
    expect(apiReadySpy).toHaveBeenCalled();
  });

  it('should construct video and mount elements into container', () => {
    const code = generatePlayerShim('http://localhost:9019');
    const fn = new Function(code);
    fn();

    const onReadySpy = jest.fn();
    const player = new (window as any).YT.Player('player-container', {
      videoId: 'test-vid-003',
      width: 600,
      height: 400,
      events: {
        onReady: onReadySpy,
      },
    });

    expect(player).toBeDefined();

    // Verify container inner elements
    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    expect(video?.src).toBe('http://localhost:9019/test-assets/sample.mp4');
    expect(video?.width).toBe(600);
    expect(video?.height).toBe(400);

    const overlay = container.querySelector('div');
    expect(overlay).toBeTruthy();

    // Trigger onReady
    jest.advanceTimersByTime(100);
    expect(onReadySpy).toHaveBeenCalledWith(
      expect.objectContaining({ target: player })
    );
  });

  it('should delegate playback, volume, and destroy methods', () => {
    const code = generatePlayerShim('http://localhost:9019');
    const fn = new Function(code);
    fn();

    const player = new (window as any).YT.Player(container, {
      videoId: 'test-vid-003',
    });

    const videoElement = container.querySelector('video') as HTMLVideoElement;
    expect(videoElement).toBeTruthy();

    // Mock HTML5 video methods since JSDOM might not implement full playback controls
    const playSpy = jest
      .spyOn(videoElement, 'play')
      .mockResolvedValue(undefined);
    const pauseSpy = jest
      .spyOn(videoElement, 'pause')
      .mockImplementation(() => {});

    // Playback
    player.playVideo();
    expect(playSpy).toHaveBeenCalled();

    player.pauseVideo();
    expect(pauseSpy).toHaveBeenCalled();

    player.stopVideo();
    expect(pauseSpy).toHaveBeenCalledTimes(2);
    expect(videoElement.currentTime).toBe(0);

    player.seekTo(15);
    expect(videoElement.currentTime).toBe(15);

    // Volume
    player.setVolume(60);
    expect(player.getVolume()).toBe(60);
    expect(videoElement.volume).toBe(0.6);

    // Muting
    player.mute();
    expect(player.isMuted()).toBe(true);
    expect(videoElement.muted).toBe(true);

    player.unMute();
    expect(player.isMuted()).toBe(false);
    expect(videoElement.muted).toBe(false);

    // State queries
    expect(player.getVideoUrl()).toContain('test-vid-003');
    expect(player.getVideoData().video_id).toBe('test-vid-003');
    expect(player.getPlayerState()).toBe(-1); // UNSTARTED

    // Cleanup
    player.destroy();
    expect(container.innerHTML).toBe('');
  });

  it('should trigger onError if search response returns __twinErrorMode', async () => {
    jest.useRealTimers();
    const mockSearchResponse = {
      __twinErrorMode: { playerError: 100 },
    };
    const fetchSpy = jest.spyOn(window, 'fetch').mockResolvedValue({
      json: async () => mockSearchResponse,
    } as any);

    const code = generatePlayerShim('http://localhost:9019');
    const fn = new Function(code);
    fn();

    const onErrorSpy = jest.fn();
    const player = new (window as any).YT.Player(container, {
      videoId: 'error-vid',
      events: {
        onError: onErrorSpy,
      },
    });

    expect(player).toBeDefined();

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(onErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ data: 100 })
    );
    fetchSpy.mockRestore();
  });

  it('should trigger onError via polling fallback if search fetch fails and error-mode endpoint has player-error', async () => {
    jest.useRealTimers();
    const fetchSpy = jest
      .spyOn(window, 'fetch')
      .mockImplementation((url: any) => {
        if (url.includes('/youtube/v3/search')) {
          return Promise.reject(new Error('Search Failed'));
        }
        if (url.includes('/test/youtube/error-mode')) {
          return Promise.resolve({
            json: async () => ({ active: true, mode: 'player-error-150' }),
          } as any);
        }
        return Promise.reject(new Error('Unknown url'));
      });

    const code = generatePlayerShim('http://localhost:9019');
    const fn = new Function(code);
    fn();

    const onErrorSpy = jest.fn();
    const player = new (window as any).YT.Player(container, {
      videoId: 'fail-vid',
      events: {
        onError: onErrorSpy,
      },
    });

    expect(player).toBeDefined();

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(onErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ data: 150 })
    );
    fetchSpy.mockRestore();
  });
});

describe('Player Shim Express Route Serving', () => {
  let twin: YoutubeTwin;
  const TEST_PORT = 9019;
  const TEST_URL = `http://localhost:${TEST_PORT}`;

  beforeAll(async () => {
    twin = new YoutubeTwin({ port: TEST_PORT });
    await twin.start();
  });

  afterAll(async () => {
    await twin.stop();
  });

  it('should serve shim JS at /iframe_api', async () => {
    const response = await fetch(`${TEST_URL}/iframe_api`, {
      headers: { Connection: 'close' },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain(
      'application/javascript'
    );

    const body = await response.text();
    expect(body).toContain('window.YT =');
    expect(body).toContain(TEST_URL);
  });

  it('should serve shim JS at /shim/youtube-player.js', async () => {
    const response = await fetch(`${TEST_URL}/shim/youtube-player.js`, {
      headers: { Connection: 'close' },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain(
      'application/javascript'
    );

    const body = await response.text();
    expect(body).toContain('window.YT =');
  });
});
