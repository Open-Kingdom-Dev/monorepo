import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { GcsStorageService } from './gcs-storage.service.js';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GcsStorageService', () => {
  let service: GcsStorageService;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = {
      ...originalEnv,
      STORAGE_EMULATOR_HOST: 'http://localhost:9013',
    };
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [GcsStorageService],
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
      // ensureBucket: bucket check returns 200 (exists)
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {},
      });

      // upload
      mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} });

      // fetch metadata
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          name: 'test.txt',
          size: '5',
          contentType: 'text/plain',
          updated: '2024-01-01T00:00:00.000Z',
        },
      });

      const result = await service.uploadFile({
        bucket: 'app-assets',
        fileName: 'test.txt',
        content: Buffer.from('hello'),
        contentType: 'text/plain',
      });

      expect(result.name).toBe('test.txt');
      expect(result.bucket).toBe('app-assets');
      expect(result.size).toBe(5);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:9013/upload/storage/v1/b/app-assets/o',
        expect.any(Buffer),
        expect.objectContaining({
          params: { uploadType: 'media', name: 'test.txt' },
        })
      );
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
  });

  describe('listFiles', () => {
    it('should list files', async () => {
      // Bucket exists
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: {} });

      // List objects
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          items: [
            {
              name: 'test.txt',
              size: '123',
              contentType: 'text/plain',
              updated: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
      });

      const files = await service.listFiles('app-assets');
      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('test.txt');
      expect(files[0].size).toBe(123);
    });

    it('should return empty array when bucket does not exist', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 404, data: {} });

      const files = await service.listFiles('nonexistent');
      expect(files).toHaveLength(0);
    });

    it('should throw for empty bucket name', async () => {
      await expect(service.listFiles('')).rejects.toThrow(BadRequestException);
    });
  });

  describe('downloadFile', () => {
    it('should download a file', async () => {
      const data = new Uint8Array(Buffer.from('test content'));
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: data.buffer,
      });

      const buffer = await service.downloadFile('app-assets', 'test.txt');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString()).toBe('test content');
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
  });

  describe('generateDownloadUrl', () => {
    it('should generate emulator download URL', async () => {
      const result = await service.generateDownloadUrl(
        'app-assets',
        'test.txt'
      );

      expect(result.url).toContain('http://localhost:9013');
      expect(result.url).toContain('download/storage/v1/b/app-assets/o');
      expect(result.url).toContain('test.txt');
      expect(result.url).toContain('alt=media');
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should encode file names with special characters', async () => {
      const result = await service.generateDownloadUrl(
        'app-assets',
        'test file.txt'
      );
      expect(result.url).toContain(encodeURIComponent('test file.txt'));
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
      mockedAxios.delete.mockResolvedValueOnce({ status: 204 });

      await expect(
        service.deleteFile('app-assets', 'test.txt')
      ).resolves.toBeUndefined();
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        'http://localhost:9013/storage/v1/b/app-assets/o/test.txt'
      );
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
  });
});
