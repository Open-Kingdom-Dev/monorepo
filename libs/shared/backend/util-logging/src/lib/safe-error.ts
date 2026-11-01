import { HttpException } from '@nestjs/common';

/**
 * One line for a log message about a caught error: our own HttpException's message, which our
 * code chose, or else the type (and any safe summary) of anything else, never its message.
 */
export function describeError(
  error: unknown,
  summarize?: ErrorSummaryHook
): string {
  return error instanceof HttpException
    ? error.message
    : describeUnexpectedError(error, summarize).split('\n')[0];
}

/**
 * A host's way to add one safe line about an error, such as the argument a database
 * validation error names. It must return names, never values; `undefined` adds nothing.
 */
export type ErrorSummaryHook = (error: Error) => string | undefined;

let errorSummary: ErrorSummaryHook | undefined;

/** Set once by `LoggingModule.forRoot`: the host's error summary hook, if any. */
export function configureErrorSummary(hook: ErrorSummaryHook | undefined): void {
  errorSummary = hook;
}

/** The host's error summary hook, for code outside the logger's own options. */
export function configuredErrorSummary(): ErrorSummaryHook | undefined {
  return errorSummary;
}

/** How an error appears under `err` in a log line: never its message. */
export function serializeError(
  error: unknown,
  summarize?: ErrorSummaryHook
): Record<string, unknown> {
  if (!(error instanceof Error)) return { type: typeof error };
  const code = (error as { code?: unknown }).code;
  return {
    type: error.constructor.name,
    ...(code === undefined ? {} : { code }),
    ...(error instanceof HttpException ? { message: error.message } : {}),
    stack: describeUnexpectedError(error, summarize),
  };
}

/**
 * Normalizes a pino call so an error never brings its message along: an `Error` passed after
 * the message (`logger.error('Delivery failed', err)`, which pino would drop as a format
 * argument) moves under `err`, and a line with no message of its own gets the error's safe
 * description instead of the message pino would copy from it.
 */
export function moveErrorArguments(
  args: unknown[],
  summarize?: ErrorSummaryHook
): unknown[] {
  const [head, ...rest] = args;
  const first = head instanceof Error ? { err: head } : head;
  if (first === null || typeof first !== 'object') return args;
  const obj = { ...(first as Record<string, unknown>) };
  const kept = rest.filter((arg) => {
    if (arg instanceof Error && obj['err'] === undefined) {
      obj['err'] = arg;
      return false;
    }
    return !(arg instanceof Error);
  });
  const message = kept[0];
  if (typeof message !== 'string' && obj['err'] !== undefined) {
    return [obj, describeError(obj['err'], summarize), ...kept];
  }
  return [obj, ...kept];
}

/**
 * A loggable description of an error our code did not raise on purpose: its type, code and
 * stack frames, never its message. Database and library errors can quote the values they were
 * handling, and the stack repeats the message in its first lines, so both are left out.
 */
export function describeUnexpectedError(
  error: unknown,
  summarize?: ErrorSummaryHook
): string {
  if (!(error instanceof Error)) {
    return `Non-error thrown (${typeof error})`;
  }
  const frames = (error.stack ?? '')
    .split('\n')
    .filter((line) => /^\s+at /.test(line));
  const code = (error as { code?: unknown }).code;
  let heading =
    typeof code === 'string' || typeof code === 'number'
      ? `${error.constructor.name} code=${code}`
      : error.constructor.name;
  const summary = summarize?.(error);
  if (summary) heading += ` — ${summary}`;
  return [heading, ...frames].join('\n');
}
