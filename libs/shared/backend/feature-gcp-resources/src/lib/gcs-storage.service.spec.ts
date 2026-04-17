import { Test, TestingModule } from '@nestjs/testing';
import { GcsStorageService } from './gcs-storage.service.js';
import { Storage } from '@google-cloud/storage';

// Mock the entire @google-cloud/storage module
jest.mock('@google-cloud/storage', () => {
  const mockBucket = {
    file: jest.fn().mockReturnValue({
      save: jest.fn().mockResolvedValue(undefined),
      getMetadata: jest.fn().mockResolvedValue([
        {
          size: '123',
          contentType: 'text/plain',
          updated: '2024-01-01T00:00:00.000Z',
        },
      ]),
      download: jest.fn().mockResolvedValue([Buffer.from('test')]),
      delete: jest.fn().mockResolvedValue(undefined),
    }),
    getFiles: jest.fn().mockResolvedValue([
      [
        {
          name: 'test.txt',
          metadata: {
            size: '123',
            contentType: 'text/plain',
            updated: '2024-01-01T00:00:00.000Z',
          },
        },
      ],
    ]),
  };

  const mockStorage = {
    bucket: jest.fn().mockReturnValue(mockBucket),
  };

  return {
    Storage: jest.fn(() => mockStorage),
  };
});

describe('GcsStorageService', () => {
  let service: GcsStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GcsStorageService],
    }).compile();

    service = module.get<GcsStorageService>(GcsStorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload a file', async () => {
      const request = {
        bucket: 'app-assets',
        fileName: 'test.txt',
        content: Buffer.from('hello'),
        contentType: 'text/plain',
      };

      const result = await service.uploadFile(request);
      expect(result.name).toBe('test.txt');
      expect(result.bucket).toBe('app-assets');
      expect(result.size).toBe(123);
    });
  });

  describe('listFiles', () => {
    it('should list files', async () => {
      const files = await service.listFiles('app-assets');
      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('test.txt');
    });
  });

  describe('downloadFile', () => {
    it('should download a file', async () => {
      const buffer = await service.downloadFile('app-assets', 'test.txt');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString()).toBe('test');
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      await expect(
        service.deleteFile('app-assets', 'test.txt')
      ).resolves.toBeUndefined();
    });
  });
});