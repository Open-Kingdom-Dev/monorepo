import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { Public } from '@open-kingdom/shared-backend-util-rbac';
import { GcsStorageService } from './gcs-storage.service.js';
import {
  UploadFileDto,
  FileMetadataDto,
  ListFilesResponseDto,
  GetDownloadUrlResponseDto,
} from './gcs-storage.dto.js';
import {
  ActivateErrorModeDto,
  ErrorModeStateDto,
} from './gcs-error-mode.dto.js';

@ApiTags('GCS Storage')
@Controller('gcs')
export class GcsStorageController {
  constructor(private readonly gcsStorageService: GcsStorageService) {}

  @Public()
  @Post('upload')
  @ApiOperation({
    summary: 'Upload a file to GCS',
    description:
      'Upload a file to a GCS bucket. Content must be base64 encoded.',
  })
  @ApiBody({
    type: UploadFileDto,
    description: 'File upload details',
    examples: {
      example: {
        summary: 'Upload a text file',
        value: {
          bucket: 'app-assets',
          fileName: 'hello.txt',
          content: 'SGVsbG8gd29ybGQ=',
          contentType: 'text/plain',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: FileMetadataDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request - missing fields or invalid data',
  })
  async uploadFile(
    @Body() uploadFileDto: UploadFileDto
  ): Promise<FileMetadataDto> {
    // Decode base64 content
    let content: Buffer;
    try {
      content = Buffer.from(uploadFileDto.content, 'base64');
    } catch (_error) {
      throw new BadRequestException('Invalid base64 content');
    }

    const metadata = await this.gcsStorageService.uploadFile({
      bucket: uploadFileDto.bucket,
      fileName: uploadFileDto.fileName,
      content,
      contentType: uploadFileDto.contentType,
    });

    return {
      name: metadata.name,
      bucket: metadata.bucket,
      size: metadata.size,
      contentType: metadata.contentType,
      updated: metadata.updated,
    };
  }

  @Public()
  @Get('files')
  @ApiOperation({
    summary: 'List files in a bucket',
    description: 'List files in a GCS bucket, optionally filtered by prefix.',
  })
  @ApiQuery({
    name: 'bucket',
    required: true,
    description: 'Bucket name',
    example: 'app-assets',
  })
  @ApiQuery({
    name: 'prefix',
    required: false,
    description: 'Prefix filter',
    example: 'images/',
  })
  @ApiResponse({
    status: 200,
    description: 'List of files',
    type: ListFilesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Missing bucket name',
  })
  async listFiles(
    @Query('bucket') bucket: string,
    @Query('prefix') prefix?: string
  ): Promise<ListFilesResponseDto> {
    if (!bucket?.trim()) {
      throw new BadRequestException('Query parameter "bucket" is required');
    }
    const files = await this.gcsStorageService.listFiles(
      bucket.trim(),
      prefix?.trim()
    );
    return { files };
  }

  @Public()
  @Get('files/:bucket/:fileName/url')
  @ApiOperation({
    summary: 'Get a download URL for a file',
    description:
      'Generate a download URL for a file. Returns an emulator URL when GCS_EMULATOR_URL is set, otherwise generates a GCS signed URL with 15-minute expiration.',
  })
  @ApiParam({
    name: 'bucket',
    description: 'Bucket name',
    example: 'app-assets',
  })
  @ApiParam({
    name: 'fileName',
    description: 'File name',
    example: 'hello.txt',
  })
  @ApiResponse({
    status: 200,
    description: 'Download URL generated successfully',
    type: GetDownloadUrlResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Missing bucket or file name',
  })
  async generateDownloadUrl(
    @Param('bucket') bucket: string,
    @Param('fileName') fileName: string
  ): Promise<GetDownloadUrlResponseDto> {
    if (!bucket?.trim()) {
      throw new BadRequestException('Bucket parameter is required');
    }
    if (!fileName?.trim()) {
      throw new BadRequestException('File name parameter is required');
    }

    const result = await this.gcsStorageService.generateDownloadUrl(
      bucket.trim(),
      fileName.trim()
    );

    return {
      url: result.url,
      expiresAt: result.expiresAt,
    };
  }

  @Public()
  @Get('files/:bucket/:fileName/download')
  @ApiOperation({
    summary: 'Download a file',
    description: 'Download a file from GCS as base64 encoded content.',
  })
  @ApiParam({
    name: 'bucket',
    description: 'Bucket name',
    example: 'app-assets',
  })
  @ApiParam({
    name: 'fileName',
    description: 'File name',
    example: 'hello.txt',
  })
  @ApiResponse({
    status: 200,
    description: 'File content',
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Base64 encoded file content' },
        metadata: { $ref: '#/components/schemas/FileMetadataDto' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Missing bucket or file name',
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  async downloadFile(
    @Param('bucket') bucket: string,
    @Param('fileName') fileName: string
  ): Promise<{ content: string; metadata: FileMetadataDto }> {
    if (!bucket?.trim()) {
      throw new BadRequestException('Bucket parameter is required');
    }
    if (!fileName?.trim()) {
      throw new BadRequestException('File name parameter is required');
    }

    const content = await this.gcsStorageService.downloadFile(
      bucket.trim(),
      fileName.trim()
    );
    const metadata = await this.gcsStorageService
      .listFiles(bucket.trim(), fileName.trim())
      .then((files) => files.find((f) => f.name === fileName.trim()));

    if (!metadata) {
      throw new BadRequestException('File metadata not found');
    }

    return {
      content: content.toString('base64'),
      metadata: {
        name: metadata.name,
        bucket: metadata.bucket,
        size: metadata.size,
        contentType: metadata.contentType,
        updated: metadata.updated,
      },
    };
  }

  @Public()
  @Post('files/:bucket/:fileName/delete')
  @ApiOperation({
    summary: 'Delete a file',
    description: 'Delete a file from GCS.',
  })
  @ApiParam({
    name: 'bucket',
    description: 'Bucket name',
    example: 'app-assets',
  })
  @ApiParam({
    name: 'fileName',
    description: 'File name',
    example: 'hello.txt',
  })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Missing bucket or file name',
  })
  async deleteFile(
    @Param('bucket') bucket: string,
    @Param('fileName') fileName: string
  ): Promise<void> {
    if (!bucket?.trim()) {
      throw new BadRequestException('Bucket parameter is required');
    }
    if (!fileName?.trim()) {
      throw new BadRequestException('File name parameter is required');
    }

    await this.gcsStorageService.deleteFile(bucket.trim(), fileName.trim());
  }

  // --- Error mode simulation endpoints ---

  @Public()
  @Post('error-mode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate a GCS error mode',
    description:
      'Activates a GCS error simulation mode. Only one mode can be active at a time — activating a new mode replaces the previous one. Only functional when the twin is running.',
  })
  @ApiResponse({
    status: 200,
    description: 'Error mode activated',
    type: ErrorModeStateDto,
  })
  async activateErrorMode(
    @Body() dto: ActivateErrorModeDto
  ): Promise<ErrorModeStateDto> {
    return this.gcsStorageService.setErrorMode(dto);
  }

  @Public()
  @Delete('error-mode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate current GCS error mode',
    description:
      'Deactivates the current GCS error simulation mode, returning to normal pass-through behavior.',
  })
  @ApiResponse({
    status: 200,
    description: 'Error mode deactivated',
    type: ErrorModeStateDto,
  })
  async deactivateErrorMode(): Promise<ErrorModeStateDto> {
    return this.gcsStorageService.clearErrorMode();
  }
}
