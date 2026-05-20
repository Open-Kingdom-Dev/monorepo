import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import {
  GcsErrorModeManager,
  GcsErrorModeConfig,
} from '@open-kingdom/shared-backend-integration-test-doubles';
import { ErrorModeStateDto } from './gcs-error-mode.dto.js';

export interface FileMetadata {
  name: string;
  bucket: string;
  size?: number;
  contentType?: string;
  updated?: Date;
}

export interface UploadFileRequest {
  bucket: string;
  fileName: string;
  content: Buffer;
  contentType?: string;
}

export const GCS_STORAGE_CLIENT = 'GCS_STORAGE_CLIENT';

export function createGcsStorageClient(): Storage {
  let emulatorUrl = process.env.GCS_EMULATOR_URL;

  // STORAGE_EMULATOR_HOST is natively read by the SDK and used as-is
  // (without appending /storage/v1), which causes 404s with fake-gcs-server.
  // If set, convert it to apiEndpoint format and remove it so the SDK
  // doesn't pick it up and override our apiEndpoint.
  if (!emulatorUrl && process.env.STORAGE_EMULATOR_HOST) {
    const host = process.env.STORAGE_EMULATOR_HOST.replace(/\/+$/, '');
    // Strip /storage/v1 if present — the SDK appends this automatically
    emulatorUrl = host.replace(/\/storage\/v1$/, '');
    delete process.env.STORAGE_EMULATOR_HOST;
    process.env.GCS_EMULATOR_URL = emulatorUrl;
  }

  // Strip any trailing /storage/v1 — the SDK appends it internally
  if (emulatorUrl) {
    emulatorUrl = emulatorUrl.replace(/\/storage\/v1$/, '');
    return new Storage({
      apiEndpoint: emulatorUrl,
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'emulator-project',
      credentials: {
        client_email: 'emulator@emulator.iam',
        private_key: 'unused',
      },
    });
  }
  return new Storage();
}

@Injectable()
export class GcsStorageService {
  private readonly logger = new Logger(GcsStorageService.name);

  constructor(
    @Inject(GCS_STORAGE_CLIENT) private readonly storage: Storage,
    private readonly errorModeManager: GcsErrorModeManager
  ) {}

  private get isEmulatorMode(): boolean {
    return !!(
      process.env.GCS_EMULATOR_URL || process.env.STORAGE_EMULATOR_HOST
    );
  }

  private requireEmulator(): string {
    const url =
      process.env.GCS_EMULATOR_URL || process.env.STORAGE_EMULATOR_HOST;
    if (!url) {
      throw new BadRequestException(
        'GCS emulator is not running. Start the twin first.'
      );
    }
    return url;
  }

  private async ensureBucket(bucketName: string): Promise<void> {
    const bucket = this.storage.bucket(bucketName);
    const [exists] = await bucket.exists();
    if (!exists) {
      try {
        await this.storage.createBucket(bucketName);
        this.logger.log(`Created bucket ${bucketName}`);
      } catch (error: any) {
        if (error?.code !== 409) {
          this.logger.warn(
            `Bucket creation failed for ${bucketName}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }
    }
  }

  /**
   * Delete and recreate buckets, clearing all objects.
   * Uses the official GCS SDK (routes to emulator when configured).
   */
  async resetBuckets(bucketNames: string[]): Promise<void> {
    for (const name of bucketNames) {
      try {
        await this.storage.bucket(name).delete();
        this.logger.log(`Deleted bucket ${name}`);
      } catch (error: any) {
        if (error?.code !== 404) {
          this.logger.warn(
            `Failed to delete bucket ${name}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }
    }
    for (const name of bucketNames) {
      await this.ensureBucket(name);
    }
  }

  // --- Error mode delegation ---

  setErrorMode(dto: {
    type: string;
    bucketName?: string;
    failEveryN?: number;
  }): ErrorModeStateDto {
    let config: GcsErrorModeConfig;

    switch (dto.type) {
      case 'bucket-not-found':
        config = {
          type: 'bucket-not-found',
          bucketName: dto.bucketName ?? 'app-assets',
        };
        break;
      case 'quota-exceeded':
        config = { type: 'quota-exceeded' };
        break;
      case 'permission-denied':
        config = { type: 'permission-denied' };
        break;
      case 'intermittent-failure':
        config = { type: 'intermittent-failure', every: dto.failEveryN ?? 2 };
        break;
      default:
        throw new BadRequestException(`Unknown error mode type: ${dto.type}`);
    }

    this.errorModeManager.setMode(config);
    this.logger.log(`Error mode activated: ${dto.type}`);
    return this.getErrorModeState();
  }

  clearErrorMode(): ErrorModeStateDto {
    this.errorModeManager.clearMode();
    this.logger.log('Error mode deactivated');
    return this.getErrorModeState();
  }

  getErrorModeState(): ErrorModeStateDto {
    const mode = this.errorModeManager.getMode();
    if (!mode) {
      return { active: false, type: null, description: null };
    }
    return {
      active: true,
      type: mode.type,
      description: this.describeMode(mode),
    };
  }

  resetErrorMode(): void {
    this.errorModeManager.reset();
    this.logger.log('Error mode cleared');
  }

  private describeMode(mode: GcsErrorModeConfig): string {
    switch (mode.type) {
      case 'bucket-not-found':
        return `Returns 404 for bucket "${mode.bucketName}". All other buckets work normally.`;
      case 'quota-exceeded':
        return 'Returns 403 on all upload (POST) operations. Reads and deletes still work.';
      case 'permission-denied':
        return 'Returns 403 on all GCS data operations. No bucket or object access allowed.';
      case 'intermittent-failure':
        return `Returns 500 every ${
          mode.every ?? 2
        }nd request (deterministic counter). Other requests succeed normally.`;
    }
  }

  async uploadFile(request: UploadFileRequest): Promise<FileMetadata> {
    const { bucket: bucketName, fileName, content, contentType } = request;

    if (!bucketName?.trim())
      throw new BadRequestException('Bucket name is required');
    if (!fileName?.trim())
      throw new BadRequestException('File name is required');
    if (!content || content.length === 0)
      throw new BadRequestException('File content cannot be empty');

    if (!this.isEmulatorMode && !process.env.GOOGLE_CLOUD_PROJECT) {
      throw new BadRequestException(
        'GCS is not configured. Start the twin or set GOOGLE_CLOUD_PROJECT.'
      );
    }

    await this.ensureBucket(bucketName);

    try {
      const file = this.storage.bucket(bucketName).file(fileName);
      await file.save(content, {
        metadata: contentType ? { contentType } : undefined,
        resumable: false,
      });

      const [metadata] = await file.getMetadata();
      this.logger.log(`Uploaded ${fileName} to bucket ${bucketName}`);

      return {
        name: metadata.name || fileName,
        bucket: bucketName,
        size: metadata.size ? Number(metadata.size) : content.length,
        contentType: metadata.contentType || contentType,
        updated: metadata.updated ? new Date(metadata.updated) : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to upload ${fileName}:`, error);
      throw new BadRequestException(
        `Upload failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async listFiles(
    bucketName: string,
    prefix?: string
  ): Promise<FileMetadata[]> {
    if (!bucketName?.trim())
      throw new BadRequestException('Bucket name is required');

    if (!this.isEmulatorMode && !process.env.GOOGLE_CLOUD_PROJECT) {
      return [];
    }

    try {
      const bucket = this.storage.bucket(bucketName);
      const [exists] = await bucket.exists();
      if (!exists) return [];

      const [files] = await bucket.getFiles(prefix ? { prefix } : undefined);

      return files.map((file) => ({
        name: file.name,
        bucket: bucketName,
        size: file.metadata?.size ? Number(file.metadata.size) : undefined,
        contentType: file.metadata?.contentType,
        updated: file.metadata?.updated
          ? new Date(file.metadata.updated)
          : undefined,
      }));
    } catch (error) {
      this.logger.error(`Failed to list files in ${bucketName}:`, error);
      throw new BadRequestException(
        `List failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async downloadFile(bucketName: string, fileName: string): Promise<Buffer> {
    if (!bucketName?.trim())
      throw new BadRequestException('Bucket name is required');
    if (!fileName?.trim())
      throw new BadRequestException('File name is required');

    if (!this.isEmulatorMode && !process.env.GOOGLE_CLOUD_PROJECT) {
      throw new BadRequestException(
        'GCS is not configured. Start the twin or set GOOGLE_CLOUD_PROJECT.'
      );
    }

    try {
      const [content] = await this.storage
        .bucket(bucketName)
        .file(fileName)
        .download();
      return content;
    } catch (error) {
      this.logger.error(`Failed to download ${fileName}:`, error);
      throw new BadRequestException(
        `Download failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async generateDownloadUrl(
    bucketName: string,
    fileName: string
  ): Promise<{ url: string; expiresAt: Date }> {
    if (!bucketName?.trim())
      throw new BadRequestException('Bucket name is required');
    if (!fileName?.trim())
      throw new BadRequestException('File name is required');

    const expiresInMs = 15 * 60 * 1000;
    const expiresAt = new Date(Date.now() + expiresInMs);

    if (this.isEmulatorMode) {
      const emulatorUrl = this.requireEmulator();
      const host = emulatorUrl.replace(/\/storage\/v1$/, '');
      const url = `${host}/download/storage/v1/b/${bucketName}/o/${encodeURIComponent(
        fileName
      )}?alt=media`;
      this.logger.log(
        `Generated emulator download URL for ${bucketName}/${fileName}`
      );
      return { url, expiresAt };
    }

    try {
      const [url] = await this.storage
        .bucket(bucketName)
        .file(fileName)
        .getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: expiresAt,
        });

      this.logger.log(
        `Generated signed download URL for ${bucketName}/${fileName}`
      );
      return { url, expiresAt };
    } catch (error) {
      this.logger.error(
        `Failed to generate download URL for ${fileName}:`,
        error
      );
      throw new BadRequestException(
        `Failed to generate download URL: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async deleteFile(bucketName: string, fileName: string): Promise<void> {
    if (!bucketName?.trim())
      throw new BadRequestException('Bucket name is required');
    if (!fileName?.trim())
      throw new BadRequestException('File name is required');

    if (!this.isEmulatorMode && !process.env.GOOGLE_CLOUD_PROJECT) {
      throw new BadRequestException(
        'GCS is not configured. Start the twin or set GOOGLE_CLOUD_PROJECT.'
      );
    }

    try {
      await this.storage.bucket(bucketName).file(fileName).delete();
      this.logger.log(`Deleted ${fileName} from bucket ${bucketName}`);
    } catch (error) {
      this.logger.error(`Failed to delete ${fileName}:`, error);
      throw new BadRequestException(
        `Delete failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
