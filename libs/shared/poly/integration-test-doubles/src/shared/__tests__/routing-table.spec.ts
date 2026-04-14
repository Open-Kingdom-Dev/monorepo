import { routingTable, getRoutingEntry } from '../routing-table.js';
import { DEFAULT_PORTS } from '../constants.js';

describe('routing-table', () => {
  describe('routingTable', () => {
    it('maps storage.googleapis.com to GCS twin port', () => {
      expect(routingTable['storage.googleapis.com']).toEqual({
        host: 'localhost',
        port: DEFAULT_PORTS.GCS,
      });
    });

    it('maps gmail.googleapis.com to GMAIL twin port', () => {
      expect(routingTable['gmail.googleapis.com']).toEqual({
        host: 'localhost',
        port: DEFAULT_PORTS.GMAIL,
      });
    });

    it('maps oauth2.googleapis.com to GOOGLE_AUTH twin port', () => {
      expect(routingTable['oauth2.googleapis.com']).toEqual({
        host: 'localhost',
        port: DEFAULT_PORTS.GOOGLE_AUTH,
      });
    });

    it('maps youtube.googleapis.com to YOUTUBE twin port', () => {
      expect(routingTable['youtube.googleapis.com']).toEqual({
        host: 'localhost',
        port: DEFAULT_PORTS.YOUTUBE,
      });
    });

    it('maps calendar.googleapis.com to GOOGLE_CALENDAR twin port', () => {
      expect(routingTable['calendar.googleapis.com']).toEqual({
        host: 'localhost',
        port: DEFAULT_PORTS.GOOGLE_CALENDAR,
      });
    });

    it('maps api.spotify.com to SPOTIFY twin port', () => {
      expect(routingTable['api.spotify.com']).toEqual({
        host: 'localhost',
        port: DEFAULT_PORTS.SPOTIFY,
      });
    });

    it('contains only the expected hostnames', () => {
      const expectedHosts = [
        'storage.googleapis.com',
        'gmail.googleapis.com',
        'oauth2.googleapis.com',
        'youtube.googleapis.com',
        'calendar.googleapis.com',
        'api.spotify.com',
      ];
      expect(Object.keys(routingTable).sort()).toEqual(expectedHosts.sort());
    });
  });

  describe('getRoutingEntry', () => {
    it('returns the entry for a known hostname', () => {
      expect(getRoutingEntry('storage.googleapis.com')).toEqual({
        host: 'localhost',
        port: DEFAULT_PORTS.GCS,
      });
    });

    it('returns undefined for an unknown hostname', () => {
      expect(getRoutingEntry('unknown.host.com')).toBeUndefined();
    });
  });
});
