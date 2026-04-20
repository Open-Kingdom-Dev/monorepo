import Docker from 'dockerode';
import { createGcsConfig, GcsTwinConfig } from '../shared/config.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * GCS twin lifecycle manager.
 *
 * Starts/stops a fake‑gcs‑server Docker container, seeds buckets,
 * and sets the STORAGE_EMULATOR_HOST environment variable.
 */
export class GcsTwin {
  private readonly config: GcsTwinConfig;
  private readonly docker: Docker;
  private container: Docker.Container | null = null;
  private readonly containerName: string;

  /**
   * Create a new GCS twin.
   *
   * @param overrides Optional configuration overrides (merged with defaults and env vars).
   * @param docker Optional Docker instance (for testing).
   */
  constructor(overrides?: Partial<GcsTwinConfig>, docker?: Docker) {
    this.config = createGcsConfig(overrides);
    this.docker = docker ?? new Docker();
    this.containerName = `itd-gcs-twin-${this.config.port}`;
  }

  /**
   * Start the Docker container and seed initial data.
   *
   * @throws {Error} If the container fails to start or seed.
   */
  async start(): Promise<void> {
    console.log(`Starting GCS twin on port ${this.config.port}...`);
    await this.ensureImageExists();
    await this.ensureContainerRemoved();
    await this.createContainer();
    await this.startContainer();
    await this.waitForHealthy();
    await this.seedBuckets();
    // Set environment variable for Google Cloud Storage SDK
    process.env.STORAGE_EMULATOR_HOST = this.config.externalUrl;
    console.log(`GCS twin ready at ${this.config.externalUrl}`);
  }

  /**
   * Stop and remove the Docker container.
   */
  async stop(): Promise<void> {
    if (!this.container) {
      return;
    }
    console.log(`Stopping GCS twin (${this.containerName})...`);
    try {
      await this.container.stop();
      await this.container.remove();
    } catch (err) {
      // Container might already be stopped/removed
      console.warn('Error stopping container:', err);
    }
    this.container = null;
    // Unset environment variable
    delete process.env.STORAGE_EMULATOR_HOST;
    console.log('GCS twin stopped');
  }

  /**
   * Reset all data to initial seed state (delete everything, re‑seed).
   */
  async reset(): Promise<void> {
    console.log('Resetting GCS twin to seed state...');
    // Delete all buckets (which deletes all objects)
    for (const bucket of this.config.buckets) {
      try {
        await fetch(`${this.config.externalUrl}/storage/v1/b/${bucket.name}`, {
          method: 'DELETE',
        });
      } catch (_err) {
        // Bucket may not exist; ignore
      }
    }
    // Re‑create buckets and seed
    await this.seedBuckets();
    console.log('GCS twin reset complete');
  }

  /**
   * Get the emulator host URL for SDK configuration.
   */
  getEmulatorHost(): string {
    return this.config.externalUrl;
  }

  /**
   * Check if the twin is running and healthy.
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.externalUrl}/storage/v1/b`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // --- internal helpers ---

  private async ensureContainerRemoved(): Promise<void> {
    try {
      const existing = this.docker.getContainer(this.containerName);
      const info = await existing.inspect().catch(() => null);
      if (info) {
        console.log(`Removing existing container ${this.containerName}...`);
        await existing.stop().catch(() => {
          /* ignore */
        });
        await existing.remove().catch(() => {
          /* ignore */
        });
      }
    } catch (_err) {
      // No existing container
    }
  }

  private async ensureImageExists(): Promise<void> {
    const imageName = 'fsouza/fake-gcs-server';
    const images = await this.docker.listImages({
      filters: JSON.stringify({ reference: [imageName] }),
    });

    if (images.length === 0) {
      console.log(`Image ${imageName} not found. Pulling...`);
      await this.pullImage(imageName);
    }
  }

  private async pullImage(imageName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.docker.pull(imageName, {}, (err, stream) => {
        if (err || !stream)
          return reject(
            err ?? new Error('No stream returned from docker.pull')
          );
        this.docker.modem.followProgress(
          stream,
          (err: Error | null, output: any) =>
            err ? reject(err) : resolve(output),
          (event: any) => {
            if (
              event.status === 'Downloading' ||
              event.status === 'Extracting'
            ) {
              // Optionally log progress here
            }
          }
        );
      });
    });
  }

  private async createContainer(): Promise<void> {
    const container = await this.docker.createContainer({
      Image: 'fsouza/fake-gcs-server',
      name: this.containerName,
      HostConfig: {
        PortBindings: {
          '4443/tcp': [{ HostPort: `${this.config.port}` }],
        },
      },
      ExposedPorts: {
        '4443/tcp': {},
      },
      Cmd: [
        '-scheme',
        'http',
        '-port',
        '4443',
        '-external-url',
        this.config.externalUrl,
      ],
    });
    this.container = container;
  }

  private async startContainer(): Promise<void> {
    if (!this.container) {
      throw new Error('Container not created');
    }
    await this.container.start();
  }

  private async waitForHealthy(): Promise<void> {
    const maxAttempts = 30;
    const intervalMs = 500;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (await this.isHealthy()) {
        // Small delay after health check passes — the container may report
        // healthy before all HTTP methods are ready (common with fake-gcs-server).
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error(
      `GCS twin did not become healthy within ${
        (maxAttempts * intervalMs) / 1000
      }s`
    );
  }

  /**
   * Internal: create buckets and upload seed files.
   * Errors are logged but not thrown — the twin remains functional without seeds.
   */
  private async seedBuckets(): Promise<void> {
    console.log('Seeding buckets...');
    for (const bucket of this.config.buckets) {
      try {
        // Create bucket (with timeout)
        const createRes = await this.fetchWithTimeout(
          `${this.config.externalUrl}/storage/v1/b`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: bucket.name }),
          },
          10_000
        );
        if (!createRes.ok && createRes.status !== 409) {
          console.warn(
            `Warning: failed to create bucket ${bucket.name}: ${createRes.status} ${createRes.statusText}`
          );
          continue;
        }

        // Upload seed files if any
        if (bucket.seedFiles && bucket.seedFiles.length > 0) {
          for (const seedFile of bucket.seedFiles) {
            try {
              const filePath = path.resolve(this.config.seedDataDir, seedFile);
              const content = await fs.readFile(filePath);
              const contentType = this.guessContentType(seedFile);
              const uploadRes = await this.fetchWithTimeout(
                `${this.config.externalUrl}/upload/storage/v1/b/${
                  bucket.name
                }/o?uploadType=media&name=${encodeURIComponent(seedFile)}`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': contentType,
                  },
                  body: content,
                },
                10_000
              );
              if (!uploadRes.ok) {
                console.warn(
                  `Warning: failed to upload ${seedFile} to ${bucket.name}: ${uploadRes.status} ${uploadRes.statusText}`
                );
              } else {
                console.log(`  Uploaded ${seedFile} to ${bucket.name}`);
              }
            } catch (err) {
              console.warn(
                `Warning: failed to upload ${seedFile} to ${bucket.name}: ${
                  err instanceof Error ? err.message : String(err)
                }`
              );
            }
          }
        }
      } catch (err) {
        console.warn(
          `Warning: failed to seed bucket ${bucket.name}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }
    console.log('Bucket seeding complete');
  }

  /**
   * Fetch with a timeout. Aborts the request if it exceeds the given duration.
   */
  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeoutMs: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (err) {
      if (controller.signal.aborted) {
        throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  private guessContentType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.gif':
        return 'image/gif';
      case '.txt':
        return 'text/plain';
      case '.json':
        return 'application/json';
      default:
        return 'application/octet-stream';
    }
  }
}
