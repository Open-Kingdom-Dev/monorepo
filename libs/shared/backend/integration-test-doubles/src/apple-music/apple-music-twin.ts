import http from 'node:http';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { createAppleMusicConfig, AppleMusicTwinConfig } from './apple-music-twin.config.js';
import { trackFixtures, playlistFixtures, AppleMusicTrackFixture, AppleMusicPlaylistFixture } from './catalog-fixtures.js';
import { formatSearchResponse, formatTrackResource, formatPlaylistResource } from './catalog-response.js';
import { generatePlayerShim } from './player-shim.js';
import { AppleMusicErrorModeManager } from './apple-music-error-mode.js';

export class AppleMusicTwin {
  private readonly config: AppleMusicTwinConfig;
  private server: http.Server | null = null;
  private currentTracks: AppleMusicTrackFixture[] = [];
  private currentPlaylists: AppleMusicPlaylistFixture[] = [];
  private readonly errorModeManager = new AppleMusicErrorModeManager();

  // Stateful sessions
  private deviceSession = {
    developerToken: 'mock-developer-token-jwt',
    musicUserToken: 'mock-music-user-token',
    storefront: 'us',
    mutExpires: '2027-01-01T00:00:00Z',
    authStatus: 'authorized' as 'authorized' | 'expiring-soon' | 'expired',
  };

  private currentPlayback: unknown = null;

  constructor(overrides?: Partial<AppleMusicTwinConfig>) {
    this.config = createAppleMusicConfig(overrides);
    this.currentTracks = [...trackFixtures];
    this.currentPlaylists = [...playlistFixtures];
  }

  async start(): Promise<void> {
    if (this.server) return;

    const app = express();
    app.use(cors());
    app.use(express.json());

    // Middleware to apply simulated errors
    app.use((req, res, next) => {
      const errorResult = this.errorModeManager.matchRequest(req.path);
      if (errorResult) {
        res.status(errorResult.status).json(errorResult.body);
        return;
      }
      next();
    });

    // Browser-side script shim
    const shimJs = generatePlayerShim(this.config.externalUrl);
    app.get('/musickit.js', (_req: Request, res: Response) => {
      res.type('application/javascript').send(shimJs);
    });

    // --- Apple Music Catalog API ---

    // Search
    app.get('/v1/catalog/:storefront/search', (req: Request, res: Response) => {
      const { term = '', types = 'songs' } = req.query as Record<string, string>;
      const requestedTypes = types.split(',');

      const matchesTerm = (val: string) => val.toLowerCase().includes(term.toLowerCase());

      const matchedTracks = requestedTypes.includes('songs')
        ? this.currentTracks.filter((t) => matchesTerm(t.name) || matchesTerm(t.artistName))
        : [];

      const matchedPlaylists = requestedTypes.includes('playlists')
        ? this.currentPlaylists.filter((p) => matchesTerm(p.name))
        : [];

      const response = formatSearchResponse(matchedTracks, matchedPlaylists, this.currentTracks);
      res.json(response);
    });

    // Get Single Song
    app.get('/v1/catalog/:storefront/songs/:id', (req: Request, res: Response) => {
      const { id } = req.params;
      const track = this.currentTracks.find((t) => t.id === id);
      if (!track) {
        res.status(404).json({
          errors: [{ title: 'Resource Not Found', detail: `Song with ID ${id} not found.` }],
        });
        return;
      }
      res.json({ data: [formatTrackResource(track)] });
    });

    // Get Single Playlist
    app.get('/v1/catalog/:storefront/playlists/:id', (req: Request, res: Response) => {
      const { id } = req.params;
      const playlist = this.currentPlaylists.find((p) => p.id === id);
      if (!playlist) {
        res.status(404).json({
          errors: [{ title: 'Resource Not Found', detail: `Playlist with ID ${id} not found.` }],
        });
        return;
      }
      res.json({ data: [formatPlaylistResource(playlist, this.currentTracks)] });
    });

    // Get Playlist Tracks
    app.get('/v1/catalog/:storefront/playlists/:id/tracks', (req: Request, res: Response) => {
      const { id } = req.params;
      const playlist = this.currentPlaylists.find((p) => p.id === id);
      if (!playlist) {
        res.status(404).json({
          errors: [{ title: 'Resource Not Found', detail: `Playlist with ID ${id} not found.` }],
        });
        return;
      }
      const playlistTracks = playlist.trackIds
        .map((tid) => this.currentTracks.find((t) => t.id === tid))
        .filter((t): t is AppleMusicTrackFixture => !!t);

      res.json({ data: playlistTracks.map((t) => formatTrackResource(t)) });
    });

    // --- Custom Auth / Playback endpoints ---

    // Developer Token
    app.get('/v1/developer-token', (_req: Request, res: Response) => {
      res.json({ developerToken: this.deviceSession.developerToken });
    });

    // Device Session
    app.get('/v1/device-session', (_req: Request, res: Response) => {
      res.json(this.deviceSession);
    });

    // Connect User Apple Music
    app.post('/v1/connect', (req: Request, res: Response) => {
      const { musicUserToken, storefront, mutExpires } = req.body || {};
      if (!musicUserToken) {
        res.status(400).json({ error: 'Missing musicUserToken' });
        return;
      }
      this.deviceSession.musicUserToken = musicUserToken;
      this.deviceSession.storefront = storefront || 'us';
      this.deviceSession.mutExpires = mutExpires || '2027-01-01T00:00:00Z';
      this.deviceSession.authStatus = 'authorized';
      res.json({ success: true });
    });

    // Auth Status GET
    app.get('/v1/auth-status', (_req: Request, res: Response) => {
      res.json({ status: this.deviceSession.authStatus });
    });

    // Auth Status POST
    app.post('/v1/auth-status', (req: Request, res: Response) => {
      const { status } = req.body || {};
      if (status) {
        this.deviceSession.authStatus = status;
      }
      res.json({ success: true });
    });

    // Playback Telemetry Report
    app.post('/v1/playback', (req: Request, res: Response) => {
      this.currentPlayback = req.body;
      console.log('[AppleMusicTwin] Playback telemetry received:', this.currentPlayback);
      res.json({ success: true });
    });

    // --- Test Control Endpoints ---

    // Health
    app.get('/test/apple-music/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok' });
    });

    // Reset
    app.post('/test/apple-music/reset', async (_req: Request, res: Response) => {
      await this.reset();
      res.json({ success: true });
    });

    // Runtime fixtures override
    app.put('/test/apple-music/fixtures', (req: Request, res: Response) => {
      const { tracks, playlists } = req.body || {};
      if (tracks) this.currentTracks = tracks;
      if (playlists) this.currentPlaylists = playlists;
      res.json({
        success: true,
        trackCount: this.currentTracks.length,
        playlistCount: this.currentPlaylists.length,
      });
    });

    // Error control
    app.post('/test/apple-music/error-mode', (req: Request, res: Response) => {
      const { mode } = req.body || {};
      if (!mode) {
        res.status(400).json({ error: 'Missing "mode" field' });
        return;
      }
      this.errorModeManager.setMode({ type: mode });
      res.json({ success: true, mode });
    });

    app.delete('/test/apple-music/error-mode', (_req: Request, res: Response) => {
      this.errorModeManager.clearMode();
      res.json({ success: true, mode: null });
    });

    app.get('/test/apple-music/error-mode', (_req: Request, res: Response) => {
      const mode = this.errorModeManager.getMode();
      res.json({ active: mode !== null, mode: mode?.type ?? null });
    });

    return new Promise<void>((resolve, reject) => {
      this.server = app.listen(this.config.port, () => {
        console.log(`[AppleMusicTwin] Express server listening on port ${this.config.port}`);
        resolve();
      });
      this.server.on('error', reject);
    });
  }

  async stop(): Promise<void> {
    const server = this.server;
    if (!server) return;
    return new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) return reject(err);
        this.server = null;
        console.log('[AppleMusicTwin] Express server stopped');
        resolve();
      });
    });
  }

  async reset(): Promise<void> {
    this.errorModeManager.reset();
    this.currentTracks = [...trackFixtures];
    this.currentPlaylists = [...playlistFixtures];
    this.deviceSession = {
      developerToken: 'mock-developer-token-jwt',
      musicUserToken: 'mock-music-user-token',
      storefront: 'us',
      mutExpires: '2027-01-01T00:00:00Z',
      authStatus: 'authorized',
    };
    this.currentPlayback = null;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const res = await fetch(`${this.config.externalUrl}/test/apple-music/health`, {
        headers: { Connection: 'close' },
      });
      await res.text();
      return res.ok;
    } catch {
      return false;
    }
  }

  getEmulatorHost(): string {
    return this.config.externalUrl;
  }
}
