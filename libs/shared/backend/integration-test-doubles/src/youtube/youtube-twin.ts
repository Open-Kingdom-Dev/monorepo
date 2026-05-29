import http from 'node:http';
import path from 'node:path';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { createYoutubeConfig, YoutubeTwinConfig } from './youtube-twin.config.js';
import {
  VideoFixture,
  videoFixtures,
  searchFixtures,
} from './search-fixtures.js';
import { formatSearchResponse } from './search-response.js';
import { generatePlayerShim } from './player-shim.js';
import { YoutubeErrorModeManager } from './youtube-error-mode.js';


export class YoutubeTwin {
  private readonly config: YoutubeTwinConfig;
  private server: http.Server | null = null;
  private currentFixtures: VideoFixture[] = [];
  private readonly errorModeManager = new YoutubeErrorModeManager();

  constructor(overrides?: Partial<YoutubeTwinConfig>) {
    this.config = createYoutubeConfig(overrides);
    this.currentFixtures = [...videoFixtures];
  }

  async start(): Promise<void> {
    if (this.server) return; // Already started

    const app = express();
    app.use(cors());
    app.use(express.json());

    // Serve static test assets (sample video and thumbnails)
    const assetsDir = path.resolve(this.config.thumbnailDir, '..');
    app.use('/test-assets', express.static(assetsDir));

    // YouTube Data API — Search
    app.get('/youtube/v3/search', (req: Request, res: Response) => {
      const errorResult = this.errorModeManager.matchSearchRequest();
      if (errorResult) {
        return res.status(errorResult.status).json(errorResult.body);
      }

      const { q = '', maxResults = '10', key } = req.query as Record<string, string>;

      if (!key) {
        return res.status(400).json({
          error: {
            code: 400,
            message: 'API key not valid. Please pass a valid API key.',
            errors: [
              {
                domain: 'usageLimits',
                reason: 'keyInvalid',
                message: 'API key not valid.',
              },
            ],
          },
        });
      }

      const limit = Number.parseInt(maxResults, 10);
      const results = searchFixtures(q, Number.isNaN(limit) ? 10 : limit, this.currentFixtures);
      const response = formatSearchResponse(results, this.config.externalUrl, results.length) as any;

      const playerErrorCode = this.errorModeManager.getPlayerErrorCode();
      if (playerErrorCode !== null) {
        response.__twinErrorMode = { playerError: playerErrorCode };
      }

      return res.json(response);
    });

    // Test control: override fixtures at runtime
    app.put('/test/youtube/fixtures', (req: Request, res: Response) => {
      this.currentFixtures = req.body?.fixtures ?? [...videoFixtures];
      res.json({ success: true, count: this.currentFixtures.length });
    });

    // Health check endpoint
    app.get('/test/youtube/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok' });
    });

    // Reset endpoint
    app.post('/test/youtube/reset', async (_req: Request, res: Response) => {
      await this.reset();
      res.json({ success: true });
    });

    // Error mode control endpoints
    app.post('/test/youtube/error-mode', (req: Request, res: Response) => {
      const { mode } = req.body;
      if (!mode) {
        return res.status(400).json({ error: 'Missing "mode" field' });
      }
      this.errorModeManager.setMode({ type: mode });
      return res.json({ success: true, mode });
    });

    app.delete('/test/youtube/error-mode', (_req: Request, res: Response) => {
      this.errorModeManager.clearMode();
      return res.json({ success: true, mode: null });
    });

    app.get('/test/youtube/error-mode', (_req: Request, res: Response) => {
      const mode = this.errorModeManager.getMode();
      return res.json({ active: mode !== null, mode: mode?.type ?? null });
    });

    // Serve YouTube IFrame Player API Shim JS
    const shimJs = generatePlayerShim(this.config.externalUrl);

    app.get('/iframe_api', (_req: Request, res: Response) => {
      res.type('application/javascript').send(shimJs);
    });

    app.get('/shim/youtube-player.js', (_req: Request, res: Response) => {
      res.type('application/javascript').send(shimJs);
    });

    return new Promise<void>((resolve, reject) => {
      this.server = app.listen(this.config.port, () => {
        console.log(`[YoutubeTwin] Express server listening on port ${this.config.port}`);
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
        console.log('[YoutubeTwin] Express server stopped');
        resolve();
      });
    });
  }

  async reset(): Promise<void> {
    this.errorModeManager.reset();
    this.currentFixtures = [...videoFixtures];
  }

  async isHealthy(): Promise<boolean> {
    try {
      const res = await fetch(`${this.config.externalUrl}/test/youtube/health`, {
        headers: { Connection: 'close' },
      });
      await res.text(); // Consume body to release socket
      return res.ok;
    } catch {
      return false;
    }
  }

  getEmulatorHost(): string {
    return this.config.externalUrl;
  }
}
