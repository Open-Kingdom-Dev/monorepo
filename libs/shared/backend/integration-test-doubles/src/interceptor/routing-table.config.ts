import { RoutingEntry } from './routing-table.js';
import { DEFAULT_PORTS } from '../shared/constants.js';

export const defaultRoutingEntries: RoutingEntry[] = [
  // Gmail twin
  {
    hostname: 'gmail.googleapis.com',
    target: `http://localhost:${DEFAULT_PORTS.GMAIL}`,
  },
  {
    hostname: 'oauth2.googleapis.com',
    target: `http://localhost:${DEFAULT_PORTS.GMAIL}`,
  },
  // YouTube twin — Data API
  {
    hostname: 'www.googleapis.com',
    target: `http://localhost:${DEFAULT_PORTS.YOUTUBE}`,
    pathPrefix: '/youtube/',
  },
  // YouTube twin — IFrame API (browser CDN)
  {
    hostname: 'www.youtube.com',
    target: `http://localhost:${DEFAULT_PORTS.YOUTUBE}`,
  },
  // Apple Music twin — Catalog API
  {
    hostname: 'api.music.apple.com',
    target: `http://localhost:${DEFAULT_PORTS.APPLE_MUSIC}`,
  },
  // Apple Music twin — Web SDK (browser CDN)
  {
    hostname: 'js-cdn.music.apple.com',
    target: `http://localhost:${DEFAULT_PORTS.APPLE_MUSIC}`,
  },
];
