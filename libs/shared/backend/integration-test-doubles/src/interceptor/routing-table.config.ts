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
];
