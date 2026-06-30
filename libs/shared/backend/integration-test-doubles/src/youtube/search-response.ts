import { VideoFixture } from './search-fixtures.js';

/**
 * Format an array of VideoFixture objects into a youtube#searchListResponse.
 *
 * The response shape exactly matches the Google YouTube Data API v3
 * search.list endpoint documented at:
 * https://developers.google.com/youtube/v3/docs/search/list
 */
export function formatSearchResponse(
  fixtures: VideoFixture[],
  baseUrl: string,
  totalResults: number
) {
  const etagSeed = fixtures.map((f) => f.videoId).join('-');
  return {
    kind: 'youtube#searchListResponse',
    etag: `test-etag-${etagSeed || 'empty'}`,
    regionCode: 'US',
    pageInfo: {
      totalResults,
      resultsPerPage: fixtures.length,
    },
    items: fixtures.map((fixture) => ({
      kind: 'youtube#searchResult',
      etag: `item-etag-${fixture.videoId}`,
      id: {
        kind: 'youtube#video',
        videoId: fixture.videoId,
      },
      snippet: {
        publishedAt: fixture.publishedAt,
        channelId: fixture.channelId,
        title: fixture.title,
        description: fixture.description,
        thumbnails: {
          default: {
            url: `${baseUrl}/test-assets/thumbnails/thumbnail-${String(
              fixture.thumbnailIndex
            ).padStart(2, '0')}.jpg`,
            width: 120,
            height: 90,
          },
          medium: {
            url: `${baseUrl}/test-assets/thumbnails/thumbnail-${String(
              fixture.thumbnailIndex
            ).padStart(2, '0')}.jpg`,
            width: 320,
            height: 180,
          },
          high: {
            url: `${baseUrl}/test-assets/thumbnails/thumbnail-${String(
              fixture.thumbnailIndex
            ).padStart(2, '0')}.jpg`,
            width: 480,
            height: 360,
          },
        },
        channelTitle: fixture.channelTitle,
        liveBroadcastContent: 'none',
      },
    })),
  };
}
