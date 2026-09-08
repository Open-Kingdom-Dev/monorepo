import { loadMusicKitScript } from './music-kit-loader';

const TWIN_URL = 'http://localhost:9019';

describe('loadMusicKitScript', () => {
  const originalMusicKit = (window as any).MusicKit;

  beforeEach(() => {
    delete (window as any).MusicKit;
    // Fresh DOM + module state per test: clear any injected script tag.
    document.getElementById('apple-music-twin-sdk')?.remove();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    if (originalMusicKit === undefined) {
      delete (window as any).MusicKit;
    } else {
      (window as any).MusicKit = originalMusicKit;
    }
    document.getElementById('apple-music-twin-sdk')?.remove();
  });

  it('resolves immediately when window.MusicKit is already defined', async () => {
    (window as any).MusicKit = { getInstance: () => null };

    await expect(loadMusicKitScript(TWIN_URL)).resolves.toBeUndefined();
    // No script tag should be injected when the SDK is already present.
    expect(document.getElementById('apple-music-twin-sdk')).toBeNull();
  });

  it('injects the shim script and resolves on load', async () => {
    const promise = loadMusicKitScript(TWIN_URL);

    const script = document.getElementById(
      'apple-music-twin-sdk'
    ) as HTMLScriptElement | null;
    expect(script).not.toBeNull();
    expect(script?.src).toBe(`${TWIN_URL}/musickit.js`);
    // The tag must be attached before we simulate the load completing.
    expect(document.body.contains(script)).toBe(true);

    // Simulate the shim announcing itself, as the twin's musickit.js does.
    document.dispatchEvent(new Event('musickitloaded'));
    await expect(promise).resolves.toBeUndefined();
  });

  it('rejects on script error, removes the tag, and retries on the next call', async () => {
    const first = loadMusicKitScript(TWIN_URL);

    const script = document.getElementById(
      'apple-music-twin-sdk'
    ) as HTMLScriptElement;
    // Simulate the twin being down: the script 404s and fires error.
    script.dispatchEvent(new Event('error'));

    await expect(first).rejects.toThrow(/Failed to load MusicKit shim/);
    // The failed tag must be removed so a later call can retry.
    expect(document.getElementById('apple-music-twin-sdk')).toBeNull();

    const second = loadMusicKitScript(TWIN_URL);
    const retriedScript = document.getElementById(
      'apple-music-twin-sdk'
    ) as HTMLScriptElement;
    expect(retriedScript).not.toBeNull();
    // Completing the retried load resolves cleanly.
    document.dispatchEvent(new Event('musickitloaded'));
    await expect(second).resolves.toBeUndefined();
  });

  it('shares one in-flight script between concurrent callers', () => {
    const p1 = loadMusicKitScript(TWIN_URL);
    const p2 = loadMusicKitScript(TWIN_URL);

    // Only one tag should exist even though two callers asked to load.
    const scripts = Array.from(document.querySelectorAll('script')).filter(
      (s) => s.id === 'apple-music-twin-sdk'
    );
    expect(scripts).toHaveLength(1);

    // Cleanup: settle the shared promise.
    document.dispatchEvent(new Event('musickitloaded'));
    return Promise.all([p1, p2]);
  });
});
