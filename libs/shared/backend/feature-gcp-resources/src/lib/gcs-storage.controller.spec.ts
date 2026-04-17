import { Test, TestingModule } from '@nestjs/testing';
import { GcsStorageController } from './gcs-storage.controller.js';
import { GcsStorageService } from './gcs-storage.service.js';
import { UploadFileDto } from './gcs-storage.dto.js';

describe('GcsStorageController', () => {
  let controller: GcsStorageController;
  let mockGcsStorageService: jest.Mocked<GcsStorageService>;

  beforeEach(async () => {
    mockGcsStorageService = {
      uploadFile: jest.fn(),
      listFiles: jest.fn(),
      downloadFile: jest.fn(),
      deleteFile: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GcsStorageController],
      providers: [
        {
          provide: GcsStorageService,
          useValue: mockGcsStorageService,
        },
      ],
    }).compile();

    controller = module.get<GcsStorageController>(GcsStorageController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload a file', async () => {
      const dto: UploadFileDto = {
        bucket: 'app-assets',
        fileName: 'test.txt',
        content: 'SGVsbG8gd29ybGQ=',
        contentType: 'text/plain',
      };
      const expectedMetadata = {
        name: 'test.txt',
        bucket: 'app-assets',
        size: 11,
        contentType: 'text/plain',
        updated: new Date(),
      };

      mockGcsStorageService.uploadFile.mockResolvedValue(expectedMetadata);

      const result = await controller.uploadFile(dto);
      expect(result).toEqual(expectedMetadata);
      expect(mockGcsStorageService.uploadFile).toHaveBeenCalledWith({
        bucket: 'app-assets',
        fileName: 'test.txt',
        content: Buffer.from('Hello world'),
        contentType: 'text/plain',
      });
    });

    it('should reject invalid base64', async () => {
      const dto: UploadFileDto = {
        bucket: 'app-assets',
        fileName: 'test.txt',
        content: 'not-base64!',
        contentType: 'text/plain',
      };

      await expect(controller.uploadFile(dto)).rejects.toThrow('Invalid base64 content');
      expect(mockGcsStorageService.uploadFile).not.toHaveBeenCalled();
    });
  });

  describe('listFiles', () => {
    it('should list files', async () => {
      const files = [
        { name: 'test.txt', bucket: 'app-assets', size: 11 },
      ];
      mockGcsStorageService.listFiles.mockResolvedValue(files);

      const result = await controller.listFiles('app-assets', 'prefix');
      expect(result.files).toEqual(files);
      expect(mockGcsStorageService.listFiles).toHaveBeenCalledWith('app-assets', 'prefix');
    });

    it('should require bucket', async () => {
      await expect(controller.listFiles('', 'prefix')).rejects.toThrow('Query parameter "bucket" is required');
    });
  });

  describe('downloadFile', () => {
    it('should download a file', async () => {
      const buffer = Buffer.from('Hello world');
      const metadata = { name: 'test.txt', bucket: 'app-assets', size: 11 };
      mockGcsStorageService.downloadFile.mockResolvedValue(buffer);
      mockGcsStorageService.listFiles.mockResolvedValue([metadata]);

      const result = await controller.downloadFile('app-assets', 'test.txt');
      expect(result.content).toEqual(buffer.toString('base64'));
      expect(result.metadata).toEqual(metadata);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      mockGcsStorageService.deleteFile.mockResolvedValue(undefined);
      await expect(controller.deleteFile('app-assets', 'test.txt')).resolves.toBeUndefined();
      expect(mockGcsStorageService.deleteFile).toHaveBeenCalledWith('app-assets', 'test.txt');
    });
  });
});