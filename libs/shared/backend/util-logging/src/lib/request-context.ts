import { AsyncLocalStorage } from 'async_hooks';

import { Logger } from '@nestjs/common';

import { REQUEST_ID_HEADER } from './request-id';

/**
 * The domain fields a host app may bind. Empty here; each host declares its own with module
 * augmentation, so `bindLogFields` is type-checked against them:
 *
 *   declare module '@open-kingdom/shared-backend-util-logging' {
 *     interface LogDomainFields { deviceId: string; facilityId: string }
 *   }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type
export interface LogDomainFields {}

/** The log scope: one request, or a block run with `runWithLogFields`. */
export interface LogScope {
  requestId?: string;
  fields: Partial<LogDomainFields>;
}

export const logScopeStore = new AsyncLocalStorage<LogScope>();

/** Runs the rest of a request inside its own log scope. */
export function startRequestScope(
  _req: object,
  requestId: string,
  next: () => void
): void {
  logScopeStore.run({ requestId, fields: {} }, next);
}

const logger = new Logger('Logging');
let declaredFields = new Set<string>();
let warnedFields = new Set<string>();

/** Set once by `LoggingModule.forRoot`: the domain field names the host declared. */
export function declareDomainFields(names: string[]): void {
  declaredFields = new Set(names);
  warnedFields = new Set();
}

/**
 * Binds domain fields to every later line of the current log scope. A field the host never
 * declared is dropped, so ad-hoc fields (and the resident data they might carry) can't reach a
 * line; the first time each one is seen, a warning names it.
 */
export function bindLogFields(fields: Partial<LogDomainFields>): void {
  const scope = logScopeStore.getStore();
  if (!scope) return;
  for (const [name, value] of Object.entries(fields)) {
    if (declaredFields.has(name)) {
      (scope.fields as Record<string, unknown>)[name] = value;
    } else if (!warnedFields.has(name)) {
      warnedFields.add(name);
      logger.warn(
        `Dropped log field "${name}": it is not declared in domainFields`
      );
    }
  }
}

/**
 * Runs `fn` in a new log scope carrying `fields`, for work that isn't an HTTP request: a
 * device's tunnel connection, a stream, a timer. Everything logged inside, including async
 * work `fn` starts, carries the fields. An enclosing scope's request ID and fields carry over.
 */
export function runWithLogFields<T>(
  fields: Partial<LogDomainFields>,
  fn: () => T
): T {
  const parent = logScopeStore.getStore();
  const scope: LogScope = {
    requestId: parent?.requestId,
    fields: { ...parent?.fields },
  };
  return logScopeStore.run(scope, () => {
    bindLogFields(fields);
    return fn();
  });
}

/** The current scope's request ID and domain fields, merged into every line by pino's mixin. */
export function currentScopeFields(): Record<string, unknown> {
  const scope = logScopeStore.getStore();
  if (!scope) return {};
  return scope.requestId === undefined
    ? { ...scope.fields }
    : { requestId: scope.requestId, ...scope.fields };
}

/** The current request's ID, or undefined outside a request (startup, timers). */
export function currentRequestId(): string | undefined {
  return logScopeStore.getStore()?.requestId;
}

/** `{ 'x-request-id': id }` inside a request, `{}` outside: spread into outbound headers. */
export function requestIdHeader(): Record<string, string> {
  const id = currentRequestId();
  return id ? { [REQUEST_ID_HEADER]: id } : {};
}
