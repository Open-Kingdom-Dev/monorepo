const SCRIPT_ID = 'apple-music-twin-sdk';

// Track in-flight loads per twin URL so concurrent callers (rapid play clicks)
// share one script element instead of appending duplicates. A failed load is
// removed from the map so the next attempt retries cleanly.
const inFlight = new Map<string, Promise<void>>();

/**
 * Load the Apple Music twin's browser SDK shim (`/musickit.js`) exactly once.
 *
 * Resolves when `window.MusicKit` is already present, when the script's `load`
 * event fires, or when the shim dispatches `musickitloaded`. Rejects on script
 * `error` (e.g. the twin is down and the script 404s), removing the failed tag
 * so a later call can retry instead of resolving into a dead `window.MusicKit`.
 */
export function loadMusicKitScript(twinUrl: string): Promise<void> {
  const win = window as unknown as { MusicKit?: unknown };
  if (win.MusicKit) return Promise.resolve();

  const cached = inFlight.get(twinUrl);
  if (cached) return cached;

  const promise = new Promise<void>((resolve, reject) => {
    const onLoaded = () => {
      inFlight.delete(twinUrl);
      resolve();
    };
    const onError = () => {
      inFlight.delete(twinUrl);
      document.getElementById(SCRIPT_ID)?.remove();
      reject(
        new Error(`Failed to load MusicKit shim from ${twinUrl}/musickit.js`)
      );
    };

    const existing = document.getElementById(
      SCRIPT_ID
    ) as HTMLScriptElement | null;

    if (existing) {
      // A tag is already mid-load (window.MusicKit not yet set): hang the
      // promise off its events instead of resolving into an undefined SDK.
      existing.addEventListener('load', onLoaded, { once: true });
      existing.addEventListener('error', onError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `${twinUrl}/musickit.js`;
    script.addEventListener('load', onLoaded, { once: true });
    script.addEventListener('error', onError, { once: true });
    // The shim dispatches `musickitloaded` after defining window.MusicKit;
    // listen for it as a fallback so a resolve isn't missed between script
    // execution and the load event. Registered before append to avoid a race.
    document.addEventListener('musickitloaded', onLoaded, { once: true });
    document.body.appendChild(script);
  });

  inFlight.set(twinUrl, promise);
  return promise;
}
