import {
  Injectable,
  BadRequestException,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

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

@Injectable()
export class GcsStorageService implements OnModuleDestroy {
  private readonly logger = new Logger(GcsStorageService.name);
  private _storage?: Storage;

  private get storage(): Storage {
    if (!this._storage) {
      this._storage = new Storage();
      this.logger.log(
        `Storage client initialized with STORAGE_EMULATOR_HOST=${process.env.STORAGE_EMULATOR_HOST}`
      );
    }
    return this._storage;
  }

  async onModuleDestroy() {
    // Storage client doesn't need explicit close, but we can clean up if needed
    this._storage = undefined;
  }

  /**
   * Upload a file to GCS.
   */
  async uploadFile(request: UploadFileRequest): Promise<FileMetadata> {
    const { bucket: bucketName, fileName, content, contentType } = request;

    if (!bucketName?.trim()) {
      throw new BadRequestException('Bucket name is required');
    }
    if (!fileName?.trim()) {
      throw new BadRequestException('File name is required');
    }
    if (!content || content.length === 0) {
      throw new BadRequestException('File content cannot be empty');
    }

    try {
      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(fileName);

      await file.save(content, {
        contentType: contentType || 'application/octet-stream',
      });

      const [metadata] = await file.getMetadata();

      this.logger.log(`Uploaded ${fileName} to bucket ${bucketName}`);

      return {
        name: fileName,
        bucket: bucketName,
        size: Number(metadata.size),
        contentType: metadata.contentType,
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

  /**
   * List files in a bucket.
   */
  async listFiles(bucketName: string, prefix?: string): Promise<FileMetadata[]> {
    if (!bucketName?.trim()) {
      throw new BadRequestException('Bucket name is required');
    }

    try {
      const bucket = this.storage.bucket(bucketName);
      const [files] = await bucket.getFiles({ prefix });

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
        `List failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Download a file from GCS.
   */
  async downloadFile(
    bucketName: string,
    fileName: string
  ): Promise<Buffer> {
    if (!bucketName?.trim()) {
      throw new BadRequestException('Bucket name is required');
    }
    if (!fileName?.trim()) {
      throw new BadRequestException('File name is required');
    }

    try {
      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(fileName);

      const [buffer] = await file.download();
      return Buffer.from(buffer);
    } catch (error) {
      this.logger.error(`Failed to download ${fileName}:`, error);
      throw new BadRequestException(
        `Download failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Delete a file from GCS.
   */
  async deleteFile(bucketName: string, fileName: string): Promise<void> {
    if (!bucketName?.trim()) {
      throw new BadRequestException('Bucket name is required');
    }
    if (!fileName?.trim()) {
      throw new BadRequestException('File name is required');
    }

    try {
      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(fileName);

      await file.delete();
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