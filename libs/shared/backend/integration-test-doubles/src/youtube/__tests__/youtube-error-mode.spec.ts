import { YoutubeErrorModeManager } from '../youtube-error-mode.js';

describe('YoutubeErrorModeManager', () => {
  let manager: YoutubeErrorModeManager;

  beforeEach(() => {
    manager = new YoutubeErrorModeManager();
  });

  it('should initially have no active mode', () => {
    expect(manager.getMode()).toBeNull();
    expect(manager.getPlayerErrorCode()).toBeNull();
    expect(manager.matchSearchRequest()).toBeNull();
  });

  it('should support setting and clearing a mode', () => {
    manager.setMode({ type: 'daily-limit-exceeded' });
    expect(manager.getMode()).toEqual({ type: 'daily-limit-exceeded' });

    manager.clearMode();
    expect(manager.getMode()).toBeNull();
  });

  it('should return 403 daily limit exceeded for daily-limit-exceeded mode', () => {
    manager.setMode({ type: 'daily-limit-exceeded' });
    const result = manager.matchSearchRequest();
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
    expect(result!.body).toEqual({
      error: {
        code: 403,
        message: 'Daily Limit Exceeded',
        errors: [
          {
            domain: 'usageLimits',
            reason: 'dailyLimitExceeded',
            message: 'Daily Limit Exceeded',
          },
        ],
      },
    });
  });

  it('should return 400 keyInvalid for invalid-api-key mode', () => {
    manager.setMode({ type: 'invalid-api-key' });
    const result = manager.matchSearchRequest();
    expect(result).not.toBeNull();
    expect(result!.status).toBe(400);
    expect(result!.body).toEqual({
      error: {
        code: 400,
        message: 'API key not valid',
        errors: [
          {
            domain: 'usageLimits',
            reason: 'keyInvalid',
            message: 'API key not valid',
          },
        ],
      },
    });
  });

  it('should return empty search list for empty-results mode', () => {
    manager.setMode({ type: 'empty-results' });
    const result = manager.matchSearchRequest();
    expect(result).not.toBeNull();
    expect(result!.status).toBe(200);
    expect(result!.body).toEqual({
      kind: 'youtube#searchListResponse',
      etag: 'empty-etag',
      regionCode: 'US',
      pageInfo: { totalResults: 0, resultsPerPage: 0 },
      items: [],
    });
  });

  it('should return null search match and extract error code for player-error modes', () => {
    manager.setMode({ type: 'player-error-100' });
    expect(manager.matchSearchRequest()).toBeNull();
    expect(manager.getPlayerErrorCode()).toBe(100);

    manager.setMode({ type: 'player-error-150' });
    expect(manager.getPlayerErrorCode()).toBe(150);

    manager.setMode({ type: 'player-error-2' });
    expect(manager.getPlayerErrorCode()).toBe(2);
  });

  it('should clear mode on reset', () => {
    manager.setMode({ type: 'daily-limit-exceeded' });
    manager.reset();
    expect(manager.getMode()).toBeNull();
    expect(manager.matchSearchRequest()).toBeNull();
  });
});
