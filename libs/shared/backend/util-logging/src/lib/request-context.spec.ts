import { Controller, Get } from '@nestjs/common';

import { currentRequestId, requestIdHeader } from '../index';
import { startTestApp, TestApp } from './testing/logging-test-app';

@Controller()
class ContextController {
  @Get('context')
  async context() {
    await new Promise((resolve) => setTimeout(resolve, 5));
    return { requestId: currentRequestId(), header: requestIdHeader() };
  }
}

describe('request context', () => {
  let t: TestApp;

  afterEach(async () => {
    await t?.app.close();
  });

  it('exposes the request ID inside the request, across awaits', async () => {
    t = await startTestApp({}, [ContextController]);

    const body = await (
      await fetch(`${t.url}/context`, { headers: { 'x-request-id': 'r-1' } })
    ).json();

    expect(body).toEqual({
      requestId: 'r-1',
      header: { 'x-request-id': 'r-1' },
    });
  });

  it('replaces an unsafe incoming request ID with a fresh one', async () => {
    t = await startTestApp({}, [ContextController]);

    const response = await fetch(`${t.url}/context`, {
      headers: { 'x-request-id': 'forged id" level=error' },
    });
    const body = (await response.json()) as { requestId: string };

    expect(body.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers.get('x-request-id')).toBe(body.requestId);
    expect(JSON.stringify(t.captured.lines)).not.toContain('forged');
  });

  it('has no request ID outside a request', () => {
    expect(currentRequestId()).toBeUndefined();
    expect(requestIdHeader()).toEqual({});
  });
});
