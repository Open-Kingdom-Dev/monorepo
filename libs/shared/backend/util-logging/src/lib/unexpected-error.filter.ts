import {
  Catch,
  HttpException,
  HttpStatus,
  IntrinsicException,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

import { replaceLoggedErrorMessage } from './access-line';
import { configuredErrorSummary, describeUnexpectedError } from './safe-error';

import type { ArgumentsHost } from '@nestjs/common';
import type { AbstractHttpAdapter } from '@nestjs/core';
import type { ServerResponse } from 'http';

// Same context as Nest's default handler, so unexpected-error lines read as before.
const logger = new Logger('ExceptionsHandler');

/**
 * Nest's default exception handling, except that an unexpected error is logged as its safe
 * description instead of its message and stack, which can quote the data being handled.
 * Responses are unchanged. Register as `APP_FILTER`.
 */
@Catch()
export class UnexpectedErrorFilter extends BaseExceptionFilter {
  override catch(exception: unknown, host: ArgumentsHost): void {
    // Nest answers body-parser's JSON SyntaxError (and a bad URL's URIError) with a
    // BadRequestException carrying that message, which quotes the request. The client keeps
    // it; the access line gets fixed text. Only Nest's mapping creates it, so its stack says so.
    if (
      exception instanceof HttpException &&
      exception.stack?.includes('mapExternalException')
    ) {
      replaceLoggedErrorMessage(
        host.getArgByIndex<ServerResponse>(1),
        'Malformed request body or URL'
      );
    }
    super.catch(exception, host);
  }

  override handleUnknownError(
    exception: unknown,
    host: ArgumentsHost,
    applicationRef: AbstractHttpAdapter
  ): void {
    // Same bodies as the default: http-errors (e.g. body-parser) keep their status.
    const body = this.isHttpError(exception)
      ? { statusCode: exception.statusCode, message: exception.message }
      : {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        };
    const response = host.getArgByIndex<ServerResponse>(1);
    const description = describeUnexpectedError(
      exception,
      configuredErrorSummary()
    );
    if (this.isHttpError(exception)) {
      // A library's HTTP error (e.g. body too large): the client keeps its message, the
      // access line gets its type.
      replaceLoggedErrorMessage(response, description.split('\n')[0]);
    }
    if (!applicationRef.isHeadersSent(response)) {
      applicationRef.reply(response, body, body.statusCode);
    } else {
      applicationRef.end(response);
    }
    if (!(exception instanceof IntrinsicException)) {
      logger.error(description);
    }
  }
}
