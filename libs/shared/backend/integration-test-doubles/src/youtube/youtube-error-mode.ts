/**
 * YouTube error mode simulation — pure state management.
 *
 * Design follows GcsErrorModeManager conventions:
 * - Single-mode constraint: only one mode active at a time.
 * - setMode() replaces any existing mode.
 * - reset() and clearMode() clear state to prevent leakage between tests.
 */

// ─── Type Definitions ────────────────────────────────────────────────

export type YoutubeApiErrorModeType =
  | 'daily-limit-exceeded'
  | 'invalid-api-key'
  | 'empty-results';

export type YoutubePlayerErrorCode = 2 | 5 | 100 | 101 | 150;

export type YoutubeErrorModeType =
  | YoutubeApiErrorModeType
  | `player-error-${YoutubePlayerErrorCode}`;

export interface YoutubeErrorModeConfig {
  type: YoutubeErrorModeType;
}

export interface YoutubeErrorSimulationResult {
  status: number;
  body: Record<string, unknown>;
}

// ─── Error Response Factories ─────────────────────────────────────────

function youtubeApiError(
  status: number,
  message: string,
  reason: string,
  domain = 'usageLimits'
): YoutubeErrorSimulationResult {
  return {
    status,
    body: {
      error: {
        code: status,
        message,
        errors: [{ domain, reason, message }],
      },
    },
  };
}

function emptySearchResponse(): YoutubeErrorSimulationResult {
  return {
    status: 200,
    body: {
      kind: 'youtube#searchListResponse',
      etag: 'empty-etag',
      regionCode: 'US',
      pageInfo: { totalResults: 0, resultsPerPage: 0 },
      items: [],
    },
  };
}

// ─── Manager ──────────────────────────────────────────────────────────

export class YoutubeErrorModeManager {
  private activeMode: YoutubeErrorModeConfig | null = null;

  setMode(config: YoutubeErrorModeConfig): void {
    this.activeMode = config;
  }

  clearMode(): void {
    this.activeMode = null;
  }

  getMode(): YoutubeErrorModeConfig | null {
    return this.activeMode;
  }

  /**
   * Check if the current mode is a player error mode.
   * Returns the numeric error code, or null if not a player error.
   */
  getPlayerErrorCode(): number | null {
    if (!this.activeMode) return null;
    const match = this.activeMode.type.match(/^player-error-(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Match a search request against the active API error mode.
   * Returns null for pass-through (no error, or player-only mode).
   */
  matchSearchRequest(): YoutubeErrorSimulationResult | null {
    if (!this.activeMode) return null;

    switch (this.activeMode.type) {
      case 'daily-limit-exceeded':
        return youtubeApiError(403, 'Daily Limit Exceeded', 'dailyLimitExceeded');
      case 'invalid-api-key':
        return youtubeApiError(400, 'API key not valid', 'keyInvalid');
      case 'empty-results':
        return emptySearchResponse();
      default:
        // Player error modes don't affect the search endpoint
        return null;
    }
  }

  reset(): void {
    this.activeMode = null;
  }
}
