import { DEFAULT_PORTS } from './constants.js';

/**
 * Routing entry mapping a remote host to a local twin.
 */
export interface RoutingEntry {
  /** Local host where the twin is running (default 'localhost') */
  host: string;
  /** Local port where the twin is listening */
  port: number;
}

/**
 * Shared routing table for network interception.
 *
 * Maps remote hostnames to local twin endpoints. The interception layer
 * should redirect requests matching these hostnames to the corresponding
 * local twin.
 *
 * This table is a planning artifact; its values must match the actual
 * ports each twin uses (see DEFAULT_PORTS).
 */
export const routingTable: Record<string, RoutingEntry> = {
  // Google Cloud Storage
  'storage.googleapis.com': {
    host: 'localhost',
    port: DEFAULT_PORTS.GCS,
  },
  // Gmail / Google Workspace Email (future twin)
  'gmail.googleapis.com': {
    host: 'localhost',
    port: DEFAULT_PORTS.GMAIL,
  },
  // Google Auth (future twin)
  'oauth2.googleapis.com': {
    host: 'localhost',
    port: DEFAULT_PORTS.GOOGLE_AUTH,
  },
  // YouTube (future twin)
  'youtube.googleapis.com': {
    host: 'localhost',
    port: DEFAULT_PORTS.YOUTUBE,
  },
  // Google Calendar (future twin)
  'calendar.googleapis.com': {
    host: 'localhost',
    port: DEFAULT_PORTS.GOOGLE_CALENDAR,
  },
  // Spotify (future twin)
  'api.spotify.com': {
    host: 'localhost',
    port: DEFAULT_PORTS.SPOTIFY,
  },
};

/**
 * Helper to get a routing entry for a given hostname.
 * Returns undefined if the hostname is not in the table.
 */
export function getRoutingEntry(hostname: string): RoutingEntry | undefined {
  return routingTable[hostname];
}
