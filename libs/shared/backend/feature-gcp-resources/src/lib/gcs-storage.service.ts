import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import axios from 'axios';

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
export class GcsStorageService {
  private readonly logger = new Logger(GcsStorageService.name);

  private get emulatorHost(): string | null {
    return process.env.STORAGE_EMULATOR_HOST || null;
  }

  private requireEmulator(): string {
    const host = this.emulatorHost;
    if (!host) {
      throw new BadRequestException(
        'GCS emulator is not running. Start the twin first.'
      );
    }
    return host;
  }

  /**
   * Ensure a bucket exists, creating it if necessary.
   */
  private async ensureBucket(host: string, bucketName: string): Promise<void> {
    try {
      const checkRes = await axios.get(`${host}/storage/v1/b/${bucketName}`, {
        validateStatus: () => true,
      });
      if (checkRes.status === 200) return;

      await axios.post(
        `${host}/storage/v1/b`,
        { name: bucketName },
        { validateStatus: (s) => s === 200 || s === 409 }
      );
      this.logger.log(`Created bucket ${bucketName}`);
    } catch (error) {
      this.logger.warn(
        `Bucket ensure failed for ${bucketName}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Upload a file to the emulator.
   */
  async uploadFile(request: UploadFileRequest): Promise<FileMetadata> {
    const { bucket: bucketName, fileName, content, contentType } = request;

    if (!bucketName?.trim())
      throw new BadRequestException('Bucket name is required');
    if (!fileName?.trim())
      throw new BadRequestException('File name is required');
    if (!content || content.length === 0)
      throw new BadRequestException('File content cannot be empty');

    const host = this.requireEmulator();
    await this.ensureBucket(host, bucketName);

    try {
      await axios.post(`${host}/upload/storage/v1/b/${bucketName}/o`, content, {
        params: { uploadType: 'media', name: fileName },
        headers: { 'Content-Type': contentType || 'application/octet-stream' },
      });

      const metaRes = await axios.get(
        `${host}/storage/v1/b/${bucketName}/o/${encodeURIComponent(fileName)}`
      );

      const meta = metaRes.data;
      this.logger.log(`Uploaded ${fileName} to bucket ${bucketName}`);

      return {
        name: meta.name,
        bucket: bucketName,
        size: meta.size ? Number(meta.size) : content.length,
        contentType: meta.contentType,
        updated: meta.updated ? new Date(meta.updated) : undefined,
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
   * Returns an empty array if the emulator is not running or the bucket doesn't exist.
   */
  async listFiles(
    bucketName: string,
    prefix?: string
  ): Promise<FileMetadata[]> {
    if (!bucketName?.trim())
      throw new BadRequestException('Bucket name is required');

    const host = this.emulatorHost;
    if (!host) return [];

    try {
      const checkRes = await axios.get(`${host}/storage/v1/b/${bucketName}`, {
        validateStatus: () => true,
      });
      if (checkRes.status !== 200) return [];

      const res = await axios.get(`${host}/storage/v1/b/${bucketName}/o`, {
        params: prefix ? { prefix } : undefined,
      });

      const items = res.data?.items || [];
      return items.map((item: any) => ({
        name: item.name,
        bucket: bucketName,
        size: item.size ? Number(item.size) : undefined,
        contentType: item.contentType,
        updated: item.updated ? new Date(item.updated) : undefined,
      }));
    } catch (error) {
      this.logger.error(`Failed to list files in ${bucketName}:`, error);
      throw new BadRequestException(
        `List failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Download a file from the emulator.
   */
  async downloadFile(bucketName: string, fileName: string): Promise<Buffer> {
    if (!bucketName?.trim())
      throw new BadRequestException('Bucket name is required');
    if (!fileName?.trim())
      throw new BadRequestException('File name is required');

    const host = this.requireEmulator();

    try {
      const res = await axios.get(
        `${host}/download/storage/v1/b/${bucketName}/o/${encodeURIComponent(
          fileName
        )}`,
        { params: { alt: 'media' }, responseType: 'arraybuffer' }
      );
      return Buffer.from(res.data);
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
   * Generate a download URL for a file.
   * In emulator mode, returns a direct emulator URL.
   */
  async generateDownloadUrl(
    bucketName: string,
    fileName: string
  ): Promise<{ url: string; expiresAt: Date }> {
    if (!bucketName?.trim())
      throw new BadRequestException('Bucket name is required');
    if (!fileName?.trim())
      throw new BadRequestException('File name is required');

    const host = this.requireEmulator();
    const url = `${host}/download/storage/v1/b/${bucketName}/o/${encodeURIComponent(
      fileName
    )}?alt=media`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    this.logger.log(`Generated download URL for ${bucketName}/${fileName}`);
    return { url, expiresAt };
  }

  /**
   * Delete a file from the emulator.
   */
  async deleteFile(bucketName: string, fileName: string): Promise<void> {
    if (!bucketName?.trim())
      throw new BadRequestException('Bucket name is required');
    if (!fileName?.trim())
      throw new BadRequestException('File name is required');

    const host = this.requireEmulator();

    try {
      await axios.delete(
        `${host}/storage/v1/b/${bucketName}/o/${encodeURIComponent(fileName)}`
      );
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
