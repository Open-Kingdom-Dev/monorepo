import { PinoLogger } from 'nestjs-pino';

import { logScopeStore, startRequestScope } from './request-context';
import { resolveRequestId } from './request-id';

import type { IncomingMessage, ServerResponse } from 'http';

function pathOf(req: IncomingMessage): string {
  // The query string is left out, since it can carry tokens.
  const url =
    (req as IncomingMessage & { originalUrl?: string }).originalUrl ??
    req.url ??
    '';
  return url.split('?')[0];
}

const REASON = Symbol('loggedErrorReason');
const REPLACED_REASON = Symbol('replacedErrorReason');

type JsonResponse = ServerResponse & {
  json?: (body?: unknown) => unknown;
  [REASON]?: unknown;
  [REPLACED_REASON]?: string;
};

/**
 * Logs `text` as this request's `reason` instead of the response body's error message. For
 * error bodies whose message comes from a library and can quote the request, such as a JSON
 * parse error; the client still receives the original body.
 */
export function replaceLoggedErrorMessage(
  res: ServerResponse,
  text: string
): void {
  (res as JsonResponse)[REPLACED_REASON] = text;
}

/**
 * Remembers the `message` (or `error`) of an error response's JSON body as the line's
 * `reason`. Express answers through `res.json`, which Nest's exception handling calls for
 * guard rejections too.
 */
function captureReason(res: JsonResponse): void {
  const json = res.json?.bind(res);
  if (!json) return;
  res.json = (body?: unknown) => {
    if (res.statusCode >= 400 && body && typeof body === 'object') {
      const { message, error } = body as { message?: unknown; error?: unknown };
      res[REASON] = message ?? error;
    }
    return json(body);
  };
}

function levelOf(status: number): 'info' | 'warn' | 'error' {
  if (status >= 500) return 'error';
  if (status >= 400) return 'warn';
  return 'info';
}

/**
 * Express middleware that gives each request its ID and log scope, and writes its access line
 * when the response closes: method, path, status, duration and rejection reason, never
 * headers, bodies or query strings. Mounted with `app.use` before Nest's body parsers, so it
 * also sees requests a parser or a guard rejects.
 */
export function requestLogging(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
): void {
  const requestId = resolveRequestId(req, res);
  const path = pathOf(req);
  // Health checks run every few seconds and would drown the requests worth reading.
  if (path.endsWith('/health')) {
    startRequestScope(req, requestId, next);
    return;
  }

  const startedAt = Date.now();
  const url = req.url ?? '';
  captureReason(res as JsonResponse);
  startRequestScope(req, requestId, () => {
    const scope = logScopeStore.getStore();
    res.once('close', () => {
      let reason =
        (res as JsonResponse)[REPLACED_REASON] ?? (res as JsonResponse)[REASON];
      // Nest's 404 for an unknown route quotes the full URL ("Cannot GET /x?token=…").
      if (typeof reason === 'string' && url.includes('?')) {
        reason = reason.split(url).join(path);
      }
      const status = res.statusCode;
      // Written inside the request's scope, so it carries the same requestId and fields.
      logScopeStore.run(scope ?? { requestId, fields: {} }, () => {
        PinoLogger.root[levelOf(status)](
          {
            method: req.method,
            path,
            status,
            durationMs: Date.now() - startedAt,
            ...(reason === undefined ? {} : { reason }),
            // A response that hasn't finished by close lost its client.
            ...(res.writableFinished ? {} : { clientClosed: true }),
          },
          `${req.method} ${path} ${status}`
        );
      });
    });
    next();
  });
}
