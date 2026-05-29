/**
 * MSW handler configuration for YouTube Twin browser-side interception.
 *
 * Consumers install these handlers in their MSW worker setup.
 * The handler factory does NOT import MSW — it returns plain objects
 * that consumers use with their own MSW installation.
 *
 * Usage in consuming app:
 *
 * ```typescript
 * import { http, HttpResponse } from 'msw';
 * import { getYoutubeMswHandlerConfigs } from '@open-kingdom/shared-backend-integration-test-doubles';
 *
 * const configs = getYoutubeMswHandlerConfigs('http://localhost:9016');
 *
 * const handlers = configs.map(config =>
 *   http.get(config.url, async () => {
 *     const response = await fetch(config.proxyTo);
 *     const body = await response.text();
 *     return new HttpResponse(body, {
 *       headers: { 'Content-Type': config.contentType },
 *     });
 *   })
 * );
 *
 * worker.start({ handlers });
 * ```
 */

export interface MswHandlerConfig {
  /** The original URL to intercept */
  url: string;
  /** The local twin URL to proxy to */
  proxyTo: string;
  /** Content-Type header for the response */
  contentType: string;
  /** Description for debugging */
  description: string;
}

export function getYoutubeMswHandlerConfigs(
  twinBaseUrl = 'http://localhost:9016'
): MswHandlerConfig[] {
  return [
    {
      url: 'https://www.youtube.com/iframe_api',
      proxyTo: `${twinBaseUrl}/iframe_api`,
      contentType: 'application/javascript',
      description: 'YouTube IFrame Player API shim',
    },
    {
      url: 'https://www.youtube.com/s/player/*/www-widgetapi.vflset/www-widgetapi.js',
      proxyTo: `${twinBaseUrl}/shim/youtube-player.js`,
      contentType: 'application/javascript',
      description: 'YouTube widget API (secondary load)',
    },
  ];
}
