/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import {
  GcsStorageService,
  GCS_STORAGE_CLIENT,
} from './gcs-storage.service.js';
import { GcsErrorModeManager } from '@open-kingdom/shared-backend-integration-test-doubles';

describe('GcsStorageService', () => {
  let service: GcsStorageService;
  const originalEnv = process.env;

  const mockFile = {
    save: jest.fn(),
    getMetadata: jest.fn(),
    download: jest.fn(),
    delete: jest.fn(),
    getSignedUrl: jest.fn(),
  };

  const mockBucket = {
    exists: jest.fn(),
    file: jest.fn(),
    getFiles: jest.fn(),
  };

  const mockStorage = {
    bucket: jest.fn(),
    createBucket: jest.fn(),
  };

  beforeEach(async () => {
    process.env = {
      ...originalEnv,
      GCS_EMULATOR_URL: 'http://localhost:9013',
    };
    jest.clearAllMocks();

    mockStorage.bucket.mockReturnValue(mockBucket);
    mockStorage.createBucket.mockResolvedValue([mockBucket]);
    mockBucket.exists.mockResolvedValue([true]);
    mockBucket.file.mockReturnValue(mockFile);
    mockBucket.getFiles.mockResolvedValue([[]]);
    mockFile.save.mockResolvedValue(undefined);
    mockFile.getMetadata.mockResolvedValue([
      {
        name: 'test.txt',
        size: '5',
        contentType: 'text/plain',
        updated: '2024-01-01T00:00:00.000Z',
      },
    ]);
    mockFile.download.mockResolvedValue([Buffer.from('test content')]);
    mockFile.delete.mockResolvedValue(undefined);
    mockFile.getSignedUrl.mockResolvedValue([
      'https://storage.googleapis.com/app-assets/test.txt?X-Goog-Signature=abc123',
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GcsStorageService,
        {
          provide: GCS_STORAGE_CLIENT,
          useValue: mockStorage,
        },
        {
          provide: GcsErrorModeManager,
          useValue: {
            getMode: jest.fn().mockReturnValue(null),
            setMode: jest.fn(),
            clearMode: jest.fn(),
            reset: jest.fn(),
            matchRequest: jest.fn().mockReturnValue(null),
          },
        },
      ],
    }).compile();

    service = module.get<GcsStorageService>(GcsStorageService);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload a file', async () => {
      const result = await service.uploadFile({
        bucket: 'app-assets',
        fileName: 'test.txt',
        content: Buffer.from('hello'),
        contentType: 'text/plain',
      });

      expect(result.name).toBe('test.txt');
      expect(result.bucket).toBe('app-assets');
      expect(result.size).toBe(5);
      expect(mockFile.save).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          metadata: { contentType: 'text/plain' },
          resumable: false,
        })
      );
      expect(mockFile.getMetadata).toHaveBeenCalled();
    });

    it('should create bucket if it does not exist', async () => {
      mockBucket.exists.mockResolvedValueOnce([false]);

      await service.uploadFile({
        bucket: 'new-bucket',
        fileName: 'test.txt',
        content: Buffer.from('hello'),
        contentType: 'text/plain',
      });

      expect(mockStorage.createBucket).toHaveBeenCalledWith('new-bucket');
    });

    it('should skip bucket creation when bucket already exists', async () => {
      mockBucket.exists.mockResolvedValueOnce([true]);

      await service.uploadFile({
        bucket: 'app-assets',
        fileName: 'test.txt',
        content: Buffer.from('hello'),
        contentType: 'text/plain',
      });

      expect(mockStorage.createBucket).not.toHaveBeenCalled();
    });

    it('should ignore 409 conflict when creating bucket', async () => {
      mockBucket.exists.mockResolvedValueOnce([false]);
      const conflictError = new Error('Conflict') as any;
      conflictError.code = 409;
      mockStorage.createBucket.mockRejectedValueOnce(conflictError);

      const result = await service.uploadFile({
        bucket: 'app-assets',
        fileName: 'test.txt',
        content: Buffer.from('hello'),
        contentType: 'text/plain',
      });

      expect(result.name).toBe('test.txt');
    });

    it('should throw for empty bucket name', async () => {
      await expect(
        service.uploadFile({
          bucket: '',
          fileName: 'test.txt',
          content: Buffer.from('x'),
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for empty fileName', async () => {
      await expect(
        service.uploadFile({
          bucket: 'app-assets',
          fileName: '',
          content: Buffer.from('x'),
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for empty content', async () => {
      await expect(
        service.uploadFile({
          bucket: 'app-assets',
          fileName: 'test.txt',
          content: Buffer.alloc(0),
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when SDK upload fails', async () => {
      mockFile.save.mockRejectedValueOnce(new Error('Upload error'));

      await expect(
        service.uploadFile({
          bucket: 'app-assets',
          fileName: 'test.txt',
          content: Buffer.from('hello'),
          contentType: 'text/plain',
        })
      ).rejects.toThrow('Upload failed: Upload error');
    });
  });

  describe('listFiles', () => {
    it('should list files', async () => {
      const mockFiles = [
        {
          name: 'test.txt',
          metadata: {
            size: '123',
            contentType: 'text/plain',
            updated: '2024-01-01T00:00:00.000Z',
          },
        },
      ];
      mockBucket.getFiles.mockResolvedValueOnce([mockFiles]);

      const files = await service.listFiles('app-assets');
      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('test.txt');
      expect(files[0].size).toBe(123);
      expect(files[0].contentType).toBe('text/plain');
    });

    it('should return empty array when bucket does not exist', async () => {
      mockBucket.exists.mockResolvedValueOnce([false]);

      const files = await service.listFiles('nonexistent');
      expect(files).toHaveLength(0);
    });

    it('should pass prefix filter to getFiles', async () => {
      mockBucket.getFiles.mockResolvedValueOnce([[]]);

      await service.listFiles('app-assets', 'images/');

      expect(mockBucket.getFiles).toHaveBeenCalledWith({ prefix: 'images/' });
    });

    it('should not pass undefined prefix to getFiles', async () => {
      mockBucket.getFiles.mockResolvedValueOnce([[]]);

      await service.listFiles('app-assets');

      expect(mockBucket.getFiles).toHaveBeenCalledWith(undefined);
    });

    it('should throw for empty bucket name', async () => {
      await expect(service.listFiles('')).rejects.toThrow(BadRequestException);
    });
  });

  describe('downloadFile', () => {
    it('should download a file', async () => {
      const buffer = Buffer.from('test content');
      mockFile.download.mockResolvedValueOnce([buffer]);

      const result = await service.downloadFile('app-assets', 'test.txt');
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('test content');
    });

    it('should throw for empty bucket name', async () => {
      await expect(service.downloadFile('', 'test.txt')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw for empty fileName', async () => {
      await expect(service.downloadFile('app-assets', '')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw when SDK download fails', async () => {
      mockFile.download.mockRejectedValueOnce(new Error('Not found'));

      await expect(
        service.downloadFile('app-assets', 'missing.txt')
      ).rejects.toThrow('Download failed: Not found');
    });
  });

  describe('generateDownloadUrl', () => {
    it('should generate emulator download URL when in emulator mode', async () => {
      const result = await service.generateDownloadUrl(
        'app-assets',
        'test.txt'
      );

      expect(result.url).toContain('http://localhost:9013');
      expect(result.url).toContain('download/storage/v1/b/app-assets/o');
      expect(result.url).toContain('test.txt');
      expect(result.url).toContain('alt=media');
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now() - 1000);
    });

    it('should encode file names with special characters in emulator mode', async () => {
      const result = await service.generateDownloadUrl(
        'app-assets',
        'test file.txt'
      );
      expect(result.url).toContain(encodeURIComponent('test file.txt'));
    });

    it('should generate signed URL when not in emulator mode', async () => {
      delete process.env.GCS_EMULATOR_URL;
      process.env.GOOGLE_CLOUD_PROJECT = 'test-project';

      const signedUrl =
        'https://storage.googleapis.com/app-assets/test.txt?X-Goog-Signature=abc123';
      mockFile.getSignedUrl.mockResolvedValueOnce([signedUrl]);

      const result = await service.generateDownloadUrl(
        'app-assets',
        'test.txt'
      );

      expect(result.url).toBe(signedUrl);
      expect(mockFile.getSignedUrl).toHaveBeenCalledWith({
        version: 'v4',
        action: 'read',
        expires: expect.any(Date),
      });
    });

    it('should throw for empty bucket name', async () => {
      await expect(service.generateDownloadUrl('', 'test.txt')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw for empty fileName', async () => {
      await expect(
        service.generateDownloadUrl('app-assets', '')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      await expect(
        service.deleteFile('app-assets', 'test.txt')
      ).resolves.toBeUndefined();
      expect(mockFile.delete).toHaveBeenCalled();
    });

    it('should throw for empty bucket name', async () => {
      await expect(service.deleteFile('', 'test.txt')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw for empty fileName', async () => {
      await expect(service.deleteFile('app-assets', '')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw when SDK delete fails', async () => {
      mockFile.delete.mockRejectedValueOnce(new Error('Not found'));

      await expect(
        service.deleteFile('app-assets', 'missing.txt')
      ).rejects.toThrow('Delete failed: Not found');
    });
  });

  describe('when emulator is not running and no GOOGLE_CLOUD_PROJECT', () => {
    beforeEach(() => {
      delete process.env.GCS_EMULATOR_URL;
      delete process.env.GOOGLE_CLOUD_PROJECT;
    });

    it('listFiles should return empty array', async () => {
      const files = await service.listFiles('app-assets');
      expect(files).toHaveLength(0);
    });

    it('uploadFile should throw', async () => {
      await expect(
        service.uploadFile({
          bucket: 'app-assets',
          fileName: 'test.txt',
          content: Buffer.from('x'),
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('downloadFile should throw', async () => {
      await expect(
        service.downloadFile('app-assets', 'test.txt')
      ).rejects.toThrow(BadRequestException);
    });

    it('deleteFile should throw', async () => {
      await expect(
        service.deleteFile('app-assets', 'test.txt')
      ).rejects.toThrow(BadRequestException);
    });

    it('generateDownloadUrl should throw when signed URL generation fails', async () => {
      mockFile.getSignedUrl.mockRejectedValueOnce(
        new Error('Could not load the default credentials')
      );

      await expect(
        service.generateDownloadUrl('app-assets', 'test.txt')
      ).rejects.toThrow('Failed to generate download URL');
    });
  });
});
