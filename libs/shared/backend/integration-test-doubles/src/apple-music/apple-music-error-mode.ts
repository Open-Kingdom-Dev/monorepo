export type AppleMusicErrorModeType =
  | 'unauthorized'
  | 'expired-token'
  | 'rate-limited'
  | 'empty-results'
  | 'not-found';

export interface AppleMusicErrorModeConfig {
  type: AppleMusicErrorModeType;
}

export interface AppleMusicErrorSimulationResult {
  status: number;
  body: Record<string, unknown>;
}

function appleMusicError(
  status: number,
  title: string,
  detail: string,
  code = status.toString()
): AppleMusicErrorSimulationResult {
  return {
    status,
    body: {
      errors: [
        {
          id: `mock-error-${Date.now()}`,
          status: status.toString(),
          code,
          title,
          detail,
        },
      ],
    },
  };
}

export class AppleMusicErrorModeManager {
  private activeMode: AppleMusicErrorModeConfig | null = null;

  setMode(config: AppleMusicErrorModeConfig): void {
    this.activeMode = config;
  }

  clearMode(): void {
    this.activeMode = null;
  }

  getMode(): AppleMusicErrorModeConfig | null {
    return this.activeMode;
  }

  matchRequest(path: string): AppleMusicErrorSimulationResult | null {
    if (!this.activeMode) return null;
    if (path.startsWith('/test/')) return null;

    switch (this.activeMode.type) {
      case 'unauthorized':
        return appleMusicError(401, 'Unauthorized', 'The developer token is missing or invalid.');
      case 'expired-token':
        return appleMusicError(403, 'Forbidden', 'The user token has expired or is invalid.');
      case 'rate-limited':
        return appleMusicError(429, 'Too Many Requests', 'The request was rate limited.');
      case 'empty-results':
        if (path.includes('/search')) {
          return {
            status: 200,
            body: {
              results: {},
            },
          };
        }
        return null;
      case 'not-found':
        return appleMusicError(404, 'Not Found', 'The requested resource was not found.');
      default:
        return null;
    }
  }

  reset(): void {
    this.activeMode = null;
  }
}
