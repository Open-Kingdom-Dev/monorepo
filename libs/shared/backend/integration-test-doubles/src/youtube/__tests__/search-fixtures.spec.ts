import {
  searchFixtures,
  videoFixtures,
  VideoFixture,
} from '../search-fixtures.js';
import { formatSearchResponse } from '../search-response.js';

describe('searchFixtures', () => {
  it('should filter fixtures by query case-insensitively', () => {
    const yogaResults = searchFixtures('yoga', 5);
    expect(yogaResults.length).toBeGreaterThan(0);
    yogaResults.forEach((v: VideoFixture) => {
      const match =
        v.title.toLowerCase().includes('yoga') ||
        v.description.toLowerCase().includes('yoga') ||
        v.tags.some((t: string) => t.toLowerCase().includes('yoga'));
      expect(match).toBe(true);
    });

    const cookingResults = searchFixtures('cooking', 5);
    expect(cookingResults.length).toBeGreaterThan(0);
    cookingResults.forEach((v: VideoFixture) => {
      const match =
        v.title.toLowerCase().includes('cooking') ||
        v.description.toLowerCase().includes('cooking') ||
        v.tags.some((t: string) => t.toLowerCase().includes('cooking'));
      expect(match).toBe(true);
    });

    // Make sure different queries yield different files
    expect(yogaResults[0].videoId).not.toBe(cookingResults[0].videoId);
  });

  it('should return default subset for empty or whitespace queries', () => {
    const emptyResults = searchFixtures('');
    expect(emptyResults.length).toBe(10);
    expect(emptyResults).toEqual(videoFixtures.slice(0, 10));

    const spaceResults = searchFixtures('   ');
    expect(spaceResults.length).toBe(10);
    expect(spaceResults).toEqual(videoFixtures.slice(0, 10));
  });

  it('should return fallback subset for unmatched queries', () => {
    const fallbackResults = searchFixtures('xyznonexistentquery');
    expect(fallbackResults.length).toBe(10);
    expect(fallbackResults).toEqual(videoFixtures.slice(0, 10));
  });

  it('should clamp maxResults between 1 and 50', () => {
    const zeroResults = searchFixtures('yoga', 0);
    expect(zeroResults.length).toBe(1);

    const negativeResults = searchFixtures('yoga', -5);
    expect(negativeResults.length).toBe(1);

    const oversizedResults = searchFixtures('', 100);
    expect(oversizedResults.length).toBe(Math.min(videoFixtures.length, 50));
  });

  it('should respect custom fixtures parameter', () => {
    const custom = [
      {
        videoId: 'custom-1',
        title: 'Custom Yoga Video',
        channelTitle: 'Ch',
        channelId: 'Ch1',
        description: 'Desc',
        publishedAt: '2024-03-01T00:00:00Z',
        thumbnailIndex: 1,
        duration: 'PT5M',
        viewCount: '100',
        tags: ['yoga'],
      },
    ];
    const results = searchFixtures('yoga', 5, custom);
    expect(results).toEqual(custom);

    const noMatch = searchFixtures('cooking', 5, custom);
    expect(noMatch).toEqual(custom); // Falls back to general subset of custom
  });
});

describe('formatSearchResponse', () => {
  it('should format VideoFixtures exactly matching the YouTube v3 JSON schema', () => {
    const sampleFixtures = videoFixtures.slice(0, 2);
    const baseUrl = 'http://localhost:9016';
    const response = formatSearchResponse(
      sampleFixtures,
      baseUrl,
      sampleFixtures.length
    );

    expect(response.kind).toBe('youtube#searchListResponse');
    expect(response.etag).toContain('test-etag');
    expect(response.regionCode).toBe('US');
    expect(response.pageInfo).toEqual({
      totalResults: 2,
      resultsPerPage: 2,
    });

    expect(response.items.length).toBe(2);
    const firstItem = response.items[0];
    const firstFixture = sampleFixtures[0];

    expect(firstItem.kind).toBe('youtube#searchResult');
    expect(firstItem.etag).toBe(`item-etag-${firstFixture.videoId}`);
    expect(firstItem.id).toEqual({
      kind: 'youtube#video',
      videoId: firstFixture.videoId,
    });

    expect(firstItem.snippet.publishedAt).toBe(firstFixture.publishedAt);
    expect(firstItem.snippet.channelId).toBe(firstFixture.channelId);
    expect(firstItem.snippet.title).toBe(firstFixture.title);
    expect(firstItem.snippet.description).toBe(firstFixture.description);
    expect(firstItem.snippet.channelTitle).toBe(firstFixture.channelTitle);
    expect(firstItem.snippet.liveBroadcastContent).toBe('none');

    // Thumbnails validation
    const thumbIndexStr = String(firstFixture.thumbnailIndex).padStart(2, '0');
    expect(firstItem.snippet.thumbnails).toEqual({
      default: {
        url: `${baseUrl}/test-assets/thumbnails/thumbnail-${thumbIndexStr}.jpg`,
        width: 120,
        height: 90,
      },
      medium: {
        url: `${baseUrl}/test-assets/thumbnails/thumbnail-${thumbIndexStr}.jpg`,
        width: 320,
        height: 180,
      },
      high: {
        url: `${baseUrl}/test-assets/thumbnails/thumbnail-${thumbIndexStr}.jpg`,
        width: 480,
        height: 360,
      },
    });
  });
});
