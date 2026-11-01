import { randomUUID } from 'crypto';

import type { IncomingMessage, ServerResponse } from 'http';

export const REQUEST_ID_HEADER = 'x-request-id';

// The header comes from outside; anything else is replaced so it can't forge log lines.
const SAFE_REQUEST_ID = /^[\w.:-]{1,128}$/;

/** An incoming `x-request-id` value that is safe to reuse and log. */
export function isSafeRequestId(value: unknown): value is string {
  return typeof value === 'string' && SAFE_REQUEST_ID.test(value);
}

/**
 * The request's ID: the incoming header when it is safe, otherwise a new UUID. Written back
 * onto the request and echoed on the response, so later hops and the client see the same ID.
 */
export function resolveRequestId(
  req: IncomingMessage,
  res: ServerResponse
): string {
  const incoming = req.headers[REQUEST_ID_HEADER];
  const requestId = isSafeRequestId(incoming) ? incoming : randomUUID();
  req.headers[REQUEST_ID_HEADER] = requestId;
  if (!res.headersSent) res.setHeader(REQUEST_ID_HEADER, requestId);
  return requestId;
}
