import { DynamicModule, INestApplication, Module } from '@nestjs/common';
import { Logger, LoggerModule } from 'nestjs-pino';

import {
  configureHealthCheckPaths,
  DEFAULT_HEALTH_CHECK_PATHS,
  requestLogging,
} from './access-line';
import {
  LineOptions,
  LogFileOptions,
  lineOptions,
  transportFor,
} from './pino-options';
import { declareDomainFields } from './request-context';
import { configureErrorSummary } from './safe-error';

import type { DestinationStream } from 'pino';
import type { Options } from 'pino-http';

export interface LoggingModuleOptions extends LineOptions {
  /** Names of the domain fields this host declares in `LogDomainFields`. */
  domainFields: string[];
  /** Write rotating JSON files instead of stdout. */
  file?: LogFileOptions;
  /** Human-readable stdout. Defaults to on unless `NODE_ENV` is `production`. */
  pretty?: boolean;
  /** Write to this stream instead of a transport, e.g. to capture lines in tests. */
  stream?: DestinationStream;
  /**
   * Exact paths (no query string) whose passing requests get no access line; failures are
   * still logged. Defaults to `['/api/health']`.
   */
  healthCheckPaths?: string[];
}

@Module({})
export class LoggingModule {
  static forRoot(options: LoggingModuleOptions): DynamicModule {
    declareDomainFields(options.domainFields);
    configureErrorSummary(options.summarizeError);
    configureHealthCheckPaths(
      options.healthCheckPaths ?? DEFAULT_HEALTH_CHECK_PATHS
    );
    const pinoOptions: Options = {
      ...lineOptions(options),
      // The access line is written by `requestLogging`, inside the request's scope.
      autoLogging: false,
    };
    return {
      module: LoggingModule,
      imports: [
        LoggerModule.forRoot({
          pinoHttp: options.stream
            ? [pinoOptions, options.stream]
            : {
                ...pinoOptions,
                transport: transportFor(
                  options.file,
                  options.pretty ?? process.env['NODE_ENV'] !== 'production'
                ),
              },
          // nestjs-pino's own request middleware would run after Nest's body parsers and miss
          // the requests they reject; `useLogging` mounts ours ahead of them instead.
          forRoutes: [],
        }),
      ],
      exports: [LoggerModule],
    };
  }
}

/**
 * Finishes the host's setup; call right after `NestFactory.create`, before `listen`. Routes
 * Nest's own logging through pino, and mounts request logging ahead of Nest's body parsers so
 * every request leaves an access line, including the ones a parser or a guard rejects.
 */
export function useLogging(app: INestApplication): void {
  app.useLogger(app.get(Logger));
  app.use(requestLogging);
}
