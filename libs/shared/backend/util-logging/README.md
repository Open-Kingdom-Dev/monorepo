# `@open-kingdom/shared-backend-util-logging`

Structured JSON logging for NestJS backends, built on `nestjs-pino`. Every line carries the same core fields (`level`, `time`, `app`, `project`, `env`, and `requestId` inside a request). The host adds its own domain fields. Every request leaves one access line, including requests a body parser or guard rejects. Logged errors never include their message, since database and library messages can quote the data being handled.

---

## Setup

```typescript
// logging.config.ts — shared by the boot logger and the module
export const loggingConfig: LineOptions = {
  app: 'my-backend',
  project: 'my-project',
  env: process.env['NODE_ENV'] ?? 'development',
  redact: ['password', '*.password', 'authorization'], // required; [] if nothing to strip
};

// main.ts
const bootLogger = createBootLogger(loggingConfig);
installCrashLogging(bootLogger);

async function bootstrap() {
  bootLogger.info('Starting');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  useLogging(app); // before any app.use(json(...)), so rejected bodies are logged too
  await app.listen(3000);
}

// app.module.ts
@Module({
  imports: [LoggingModule.forRoot({ ...loggingConfig, domainFields: ['deviceId'] })],
  providers: [{ provide: APP_FILTER, useClass: UnexpectedErrorFilter }],
})
export class AppModule {}
```

Domain fields are declared once with module augmentation, which type-checks `bindLogFields` and `runWithLogFields`:

```typescript
declare module '@open-kingdom/shared-backend-util-logging' {
  interface LogDomainFields {
    deviceId: string;
  }
}
```

---

## Exports

| Export                      | Kind        | Description                                                                                                                                            |
| --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `LoggingModule`             | `class`     | Dynamic module. `.forRoot(options)` configures pino and routes Nest's `Logger` through it.                                                             |
| `useLogging`                | `function`  | `useLogging(app)`: call right after `NestFactory.create`. Installs the logger and mounts request logging ahead of Nest's body parsers.                 |
| `UnexpectedErrorFilter`     | `class`     | Nest's default exception handling, but an unexpected error is logged as its safe description. Register as `APP_FILTER`.                                |
| `bindLogFields`             | `function`  | Binds declared domain fields to every later line of the current request or scope. Undeclared fields are dropped, with one warning per field name.      |
| `runWithLogFields`          | `function`  | `runWithLogFields(fields, fn)`: runs `fn` in its own log scope, for work outside a request (a device connection, a stream, a timer).                   |
| `currentRequestId`          | `function`  | The current request's ID, or `undefined` outside a request.                                                                                            |
| `requestIdHeader`           | `function`  | `{ 'x-request-id': id }` inside a request, `{}` outside. Spread into outbound request headers.                                                         |
| `isSafeRequestId`           | `function`  | Whether an incoming `x-request-id` is safe to reuse (`[\w.:-]{1,128}`). Unsafe values are replaced with a UUID.                                        |
| `REQUEST_ID_HEADER`         | `string`    | `'x-request-id'`.                                                                                                                                      |
| `replaceLoggedErrorMessage` | `function`  | `replaceLoggedErrorMessage(res, text)`: logs `text` as the request's `reason` instead of the error body's message. The client still gets the original. |
| `describeError`             | `function`  | One line about a caught error: an `HttpException`'s own message, otherwise only the error's type.                                                      |
| `describeUnexpectedError`   | `function`  | An error's type, code and stack frames, never its message.                                                                                             |
| `createBootLogger`          | `function`  | A synchronous pino logger for use before Nest exists. Same JSON shape as runtime lines.                                                                |
| `installCrashLogging`       | `function`  | Writes a fatal boot line on an uncaught exception. Exit behavior is unchanged.                                                                         |
| `LogDomainFields`           | `interface` | Empty. Each host augments it with its domain fields.                                                                                                   |

### `LoggingModuleOptions`

| Property         | Type                | Required | Default                     | Description                                                                                                            |
| ---------------- | ------------------- | -------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `app`            | `string`            | Yes      | —                           | Written as `app` on every line.                                                                                        |
| `project`        | `string`            | Yes      | —                           | Written as `project` on every line.                                                                                    |
| `env`            | `string`            | Yes      | —                           | Written as `env` on every line.                                                                                        |
| `redact`         | `string[]`          | Yes      | —                           | pino redact paths, removed from every line. Nothing is redacted unless listed here.                                    |
| `domainFields`   | `string[]`          | Yes      | —                           | Names of the fields declared in `LogDomainFields`. Any other field is dropped.                                         |
| `level`          | `LevelWithSilent`   | No       | `'info'`                    | Default level. The `LOG_LEVEL` environment variable overrides it.                                                      |
| `file`           | `LogFileOptions`    | No       | —                           | Write rotating JSON files (pino-roll) instead of stdout. `{ path, maxBytes = 5 MB, maxFiles = 5 }`.                    |
| `pretty`         | `boolean`           | No       | `NODE_ENV !== 'production'` | Human-readable stdout (pino-pretty). Ignored when `file` is set.                                                       |
| `summarizeError` | `ErrorSummaryHook`  | No       | —                           | Adds one safe line to an error's description, such as the argument a validation error names. Must never return values. |
| `stream`         | `DestinationStream` | No       | —                           | Write to this stream instead of a transport, for example to capture lines in tests.                                    |

---

## The access line

One line per request, written when its response closes. It contains `method`, `path` (no query string), `status`, `durationMs`, `reason` (the error body's `message`, or the replacement text), and `clientClosed` when the client gave up. The level is `info` for 2xx and 3xx, `warn` for 4xx, and `error` for 5xx. Paths ending in `/health` are skipped. Headers and bodies are never logged.

---

## Notes

- Output goes through exactly one pino transport. pino rejects level labels (`"level":"info"`) when there are several targets, so a process writes either to rotating files or to stdout, not both.
- pino-roll names files `<name>.1.log`, `<name>.2.log`, … and checks size between flushes, so a burst of lines can overshoot `maxBytes`.
- `nestjs-pino` keeps one pino logger per process: one Nest app per process.
