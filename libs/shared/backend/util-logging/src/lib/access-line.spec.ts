import {
  BadRequestException,
  CanActivate,
  Controller,
  ForbiddenException,
  Get,
  Res,
  UseGuards,
} from '@nestjs/common';

import { replaceLoggedErrorMessage } from '../index';
import { startTestApp, TestApp } from './testing/logging-test-app';

import type { Response } from 'express';

class DenyAllGuard implements CanActivate {
  canActivate(): boolean {
    throw new ForbiddenException('Wall is not claimed');
  }
}

@Controller()
class GuardedController {
  @Get('guarded')
  @UseGuards(DenyAllGuard)
  guarded() {
    return { ok: true };
  }
}

@Controller()
class QuotingController {
  @Get('quoting')
  quoting(@Res({ passthrough: true }) res: Response) {
    replaceLoggedErrorMessage(res, 'Malformed request body');
    throw new BadRequestException('Unexpected token in "Jane Doe"');
  }
}

@Controller()
class SlowController {
  @Get('slow')
  async slow() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { ok: true };
  }
}

@Controller()
class HealthController {
  @Get('api/health')
  health() {
    return { status: 'ok' };
  }

  @Get('api/ready')
  ready() {
    return { status: 'ok' };
  }
}

describe('access line', () => {
  let t: TestApp;

  afterEach(async () => {
    await t?.app.close();
  });

  it('writes one line per request carrying the core fields', async () => {
    t = await startTestApp();

    const response = await fetch(`${t.url}/ok?token=secret`, {
      headers: { 'x-request-id': 'abc-123' },
    });

    expect(response.headers.get('x-request-id')).toBe('abc-123');
    const line = await t.captured.waitFor((l) => l['path'] === '/ok');
    expect(line).toMatchObject({
      level: 'info',
      app: 'test-app',
      project: 'test-project',
      env: 'test',
      requestId: 'abc-123',
      method: 'GET',
      path: '/ok',
      status: 200,
    });
    expect(typeof line['durationMs']).toBe('number');
    expect(JSON.stringify(line)).not.toContain('secret');
  });

  it('logs a request a guard rejects at warn, with the rejection reason', async () => {
    t = await startTestApp({}, [GuardedController]);

    const response = await fetch(`${t.url}/guarded`);

    expect(response.status).toBe(403);
    const line = await t.captured.waitFor((l) => l['path'] === '/guarded');
    expect(line).toMatchObject({
      level: 'warn',
      status: 403,
      reason: 'Wall is not claimed',
    });
  });

  it('logs the replacement reason when the error message could quote the request', async () => {
    t = await startTestApp({}, [QuotingController]);

    const response = await fetch(`${t.url}/quoting`);

    expect(((await response.json()) as { message: string }).message).toContain('Jane Doe');
    const line = await t.captured.waitFor((l) => l['path'] === '/quoting');
    expect(line['reason']).toBe('Malformed request body');
    expect(JSON.stringify(t.captured.lines)).not.toContain('Jane Doe');
  });

  it("keeps the query string out of the reason Nest gives for an unknown route", async () => {
    t = await startTestApp();

    await fetch(`${t.url}/missing?token=secret`);

    const line = await t.captured.waitFor((l) => l['path'] === '/missing');
    expect(line['reason']).toBe('Cannot GET /missing');
    expect(JSON.stringify(t.captured.lines)).not.toContain('secret');
  });

  it('flags a request the client gave up on', async () => {
    t = await startTestApp({}, [SlowController]);

    await fetch(`${t.url}/slow`, { signal: AbortSignal.timeout(30) }).catch(
      () => undefined
    );

    const line = await t.captured.waitFor((l) => l['path'] === '/slow');
    expect(line['clientClosed']).toBe(true);
  });

  it('writes no access line for health checks', async () => {
    t = await startTestApp({}, [HealthController]);

    await fetch(`${t.url}/api/health`);
    await fetch(`${t.url}/api/ready`);

    await t.captured.waitFor((l) => l['path'] === '/api/ready');
    expect(t.captured.lines.some((l) => l['path'] === '/api/health')).toBe(
      false
    );
  });
});
