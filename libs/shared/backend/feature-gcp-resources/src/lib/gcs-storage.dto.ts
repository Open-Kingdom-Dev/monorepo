import { ApiProperty } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({ description: 'Bucket name', example: 'app-assets' })
  bucket!: string;

  @ApiProperty({ description: 'File name', example: 'test.txt' })
  fileName!: string;

  @ApiProperty({
    description: 'File content as base64 string',
    example: 'SGVsbG8gd29ybGQ=',
  })
  content!: string;

  @ApiProperty({
    description: 'Optional content type',
    example: 'text/plain',
    required: false,
  })
  contentType?: string;
}

export class FileMetadataDto {
  @ApiProperty({ description: 'File name', example: 'test.txt' })
  name!: string;

  @ApiProperty({ description: 'Bucket name', example: 'app-assets' })
  bucket!: string;

  @ApiProperty({ description: 'File size in bytes', example: 11 })
  size?: number;

  @ApiProperty({ description: 'Content type', example: 'text/plain' })
  contentType?: string;

  @ApiProperty({ description: 'Last updated timestamp' })
  updated?: Date;
}

export class ListFilesResponseDto {
  @ApiProperty({ type: [FileMetadataDto] })
  files!: FileMetadataDto[];
}

export class GetDownloadUrlResponseDto {
  @ApiProperty({
    description: 'Download URL',
    example:
      'https://storage.googleapis.com/app-assets/test.txt?X-Goog-Signature=...',
  })
  url!: string;

  @ApiProperty({
    description: 'URL expiration timestamp',
    example: '2024-01-01T00:15:00.000Z',
  })
  expiresAt!: Date;
}
