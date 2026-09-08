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

export function getAppleMusicMswHandlerConfigs(
  twinBaseUrl = 'http://localhost:9019'
): MswHandlerConfig[] {
  return [
    {
      url: 'https://js-cdn.music.apple.com/musickit/v3/musickit.js',
      proxyTo: `${twinBaseUrl}/musickit.js`,
      contentType: 'application/javascript',
      description: 'Apple MusicKit JS SDK shim',
    },
    {
      url: 'https://api.music.apple.com/v1/*',
      proxyTo: `${twinBaseUrl}/v1/*`,
      contentType: 'application/json',
      description: 'Apple Music REST API catalog redirects',
    },
  ];
}
