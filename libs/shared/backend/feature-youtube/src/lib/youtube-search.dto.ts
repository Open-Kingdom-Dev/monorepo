import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class YoutubeSearchQueryDto {
  @ApiProperty({
    description:
      'Search query string to match video titles, descriptions, and tags',
    example: 'yoga',
  })
  q?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of search results to return (default 5)',
    example: 3,
    type: 'integer',
  })
  maxResults?: number;
}

export class YoutubeThumbnailDetailsDto {
  @ApiProperty({ description: 'Thumbnail URL' })
  url?: string;

  @ApiProperty({ description: 'Thumbnail width' })
  width?: number;

  @ApiProperty({ description: 'Thumbnail height' })
  height?: number;
}

export class YoutubeThumbnailsDto {
  @ApiProperty({ type: YoutubeThumbnailDetailsDto })
  default?: YoutubeThumbnailDetailsDto;

  @ApiProperty({ type: YoutubeThumbnailDetailsDto })
  medium?: YoutubeThumbnailDetailsDto;

  @ApiProperty({ type: YoutubeThumbnailDetailsDto })
  high?: YoutubeThumbnailDetailsDto;
}

export class YoutubeSearchSnippetDto {
  @ApiProperty({ description: 'Publish time' })
  publishedAt?: string;

  @ApiProperty({ description: 'Channel ID' })
  channelId?: string;

  @ApiProperty({ description: 'Video title' })
  title?: string;

  @ApiProperty({ description: 'Video description' })
  description?: string;

  @ApiProperty({ type: YoutubeThumbnailsDto })
  thumbnails?: YoutubeThumbnailsDto;

  @ApiProperty({ description: 'Channel Title' })
  channelTitle?: string;

  @ApiProperty({ description: 'Live broadcast content status' })
  liveBroadcastContent?: string;
}

export class YoutubeVideoIdDto {
  @ApiProperty({ description: 'Resource kind' })
  kind?: string;

  @ApiProperty({ description: 'Unique video ID' })
  videoId?: string;
}

export class YoutubeSearchResultItemDto {
  @ApiProperty({ description: 'Result item kind' })
  kind?: string;

  @ApiProperty({ description: 'ETag of the item' })
  etag?: string;

  @ApiProperty({ type: YoutubeVideoIdDto })
  id?: YoutubeVideoIdDto;

  @ApiProperty({ type: YoutubeSearchSnippetDto })
  snippet?: YoutubeSearchSnippetDto;
}

export class YoutubePageInfoDto {
  @ApiProperty({ description: 'Total results' })
  totalResults?: number;

  @ApiProperty({ description: 'Results per page' })
  resultsPerPage?: number;
}

export class YoutubeSearchResponseDto {
  @ApiProperty({ description: 'Search list response kind' })
  kind?: string;

  @ApiProperty({ description: 'ETag' })
  etag?: string;

  @ApiProperty({ description: 'Region code' })
  regionCode?: string;

  @ApiProperty({ type: YoutubePageInfoDto })
  pageInfo?: YoutubePageInfoDto;

  @ApiProperty({ type: [YoutubeSearchResultItemDto] })
  items?: YoutubeSearchResultItemDto[];
}
