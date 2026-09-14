import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { getFrontendBaseUrl } from './google-auth-emulate.service';

/**
 * Turns a rejected Google OAuth callback into a return trip to the demo page.
 *
 * Passport fails before the controller runs, so the success redirect in
 * `GoogleAuthEmulateController.callback` never happens on failure. Redirecting
 * here (rather than returning `false` from the guard, which makes Nest write a
 * second response) lets the frontend's existing `?auth=error` banner show the
 * reason. The filter owns the response, so there is no double-send.
 */
@Catch(UnauthorizedException)
export class GoogleAuthFailureRedirectFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const message = exception.message || 'Google authentication failed';

    response.redirect(
      `${getFrontendBaseUrl()}/google-auth-demo?auth=error&message=${encodeURIComponent(
        message
      )}`
    );
  }
}
