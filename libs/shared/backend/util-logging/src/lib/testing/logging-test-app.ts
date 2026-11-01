import { Controller, Get, INestApplication, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';


import {
  LoggingModule,
  LoggingModuleOptions,
  useLogging,
} from '../logging.module';

/** Collects every JSON log line the module writes, parsed. */
export class CapturedLines {
  readonly lines: Record<string, unknown>[] = [];

  readonly stream = {
    write: (chunk: string) => {
      for (const line of chunk.split('\n')) {
        if (line.trim()) this.lines.push(JSON.parse(line));
      }
    },
  };

  /** Waits for a line matching `predicate`; access lines are written when the response closes. */
  async waitFor(
    predicate: (line: Record<string, unknown>) => boolean,
    timeoutMs = 2000
  ): Promise<Record<string, unknown>> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const found = this.lines.find(predicate);
      if (found) return found;
      if (Date.now() > deadline) {
        throw new Error(
          `No matching log line. Lines:\n${this.lines
            .map((l) => JSON.stringify(l))
            .join('\n')}`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
}

@Controller()
export class DefaultTestController {
  @Get('ok')
  ok() {
    return { ok: true };
  }
}

export interface TestApp {
  app: INestApplication;
  url: string;
  captured: CapturedLines;
}

/**
 * nestjs-pino builds one pino logger per process, on first use, and keeps it. Each test app
 * needs its own, so the cached one is dropped first. The reset lives in a file the package
 * doesn't export, hence the path.
 */
function resetNestjsPinoRootLogger(): void {
  const { join, dirname } = require('path');
  const pinoLogger = require(join(
    dirname(require.resolve('nestjs-pino')),
    'PinoLogger.js'
  ));
  pinoLogger.__resetOutOfContextForTests();
}

export async function startTestApp(
  options: Partial<LoggingModuleOptions> = {},
  controllers: Type<unknown>[] = [DefaultTestController],
  providers: unknown[] = []
): Promise<TestApp> {
  resetNestjsPinoRootLogger();
  const captured = new CapturedLines();
  const moduleRef = await Test.createTestingModule({
    imports: [
      LoggingModule.forRoot({
        app: 'test-app',
        project: 'test-project',
        env: 'test',
        redact: [],
        domainFields: [],
        stream: captured.stream,
        ...options,
      }),
    ],
    controllers,
    providers: providers as never[],
  }).compile();

  const app = moduleRef.createNestApplication({ bufferLogs: true });
  useLogging(app);
  await app.listen(0);
  return { app, url: await app.getUrl(), captured };
}
