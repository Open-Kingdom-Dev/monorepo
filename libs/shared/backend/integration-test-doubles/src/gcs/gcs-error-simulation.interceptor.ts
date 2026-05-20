import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { GcsErrorModeManager, isGcsDataOperation } from './gcs-error-mode.js';

/**
 * NestJS interceptor that checks the active GCS error mode and short-circuits
 * matching requests with GCS-shaped error responses.
 *
 * Registered as APP_INTERCEPTOR (global) but exits immediately for non-GCS routes.
 * The route-prefix check is a cheap string comparison before any mode lookup.
 *
 * When an error mode matches, the interceptor throws an HttpException with the
 * GCS error status code (403, 404, 500) so that the frontend receives a proper
 * HTTP error response — not a 200 with an error body.
 */
@Injectable()
export class GcsErrorSimulationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(GcsErrorSimulationInterceptor.name);

  constructor(private readonly errorModeManager: GcsErrorModeManager) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ method: string; url: string }>();
    const method: string = request.method;
    const path: string = request.url;

    // Fast exit: only intercept GCS data operation routes
    if (!isGcsDataOperation(method, path)) {
      return next.handle();
    }

    const result = this.errorModeManager.matchRequest(method, path);

    if (result) {
      this.logger.warn(
        `Error mode intercepted ${method} ${path} → ${result.status} (${result.body.error.errors[0].reason})`
      );
      // Throw with the real HTTP status code so the client gets a proper error response
      throw new HttpException(result.body, result.status);
    }

    // Debug-level log when a mode is active but this request passed through
    const activeMode = this.errorModeManager.getMode();
    if (activeMode) {
      this.logger.debug(
        `Error mode '${activeMode.type}' active but ${method} ${path} passed through`
      );
    }

    return next.handle();
  }
}
