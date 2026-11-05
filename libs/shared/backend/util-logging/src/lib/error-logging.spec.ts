import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { UnexpectedErrorFilter } from '../index';
import { startTestApp, TestApp } from './testing/logging-test-app';

@Controller()
class ResidentsController {
  @Post('residents')
  create(@Body() body: unknown) {
    return body;
  }

  @Get('broken')
  broken() {
    throw new Error('Cannot save resident Zelda Testperson');
  }
}

const withFilter = [{ provide: APP_FILTER, useClass: UnexpectedErrorFilter }];

@Controller()
class DeliveryController {
  private readonly logger = new Logger('Delivery');

  @Get('deliver')
  deliver() {
    this.logger.error(
      'Delivery failed',
      new TypeError('Cannot read photo of Zelda Testperson')
    );
    this.logger.error(new RangeError('Zelda Testperson is out of range'));
    return { ok: true };
  }
}

describe('error logging', () => {
  let t: TestApp;

  afterEach(async () => {
    await t?.app.close();
  });

  it('never writes the message of an error passed to the logger', async () => {
    t = await startTestApp({}, [DeliveryController]);

    await fetch(`${t.url}/deliver`);

    await t.captured.waitFor((l) => l['path'] === '/deliver');
    const withMessage = await t.captured.waitFor(
      (l) => l['msg'] === 'Delivery failed'
    );
    expect(withMessage['err']).toMatchObject({ type: 'TypeError' });
    expect(String((withMessage['err'] as { stack: string }).stack)).toContain(
      '    at '
    );
    const alone = await t.captured.waitFor((l) => l['msg'] === 'RangeError');
    expect(alone['err']).toMatchObject({ type: 'RangeError' });
    expect(JSON.stringify(t.captured.lines)).not.toContain('Zelda');
  });

  it('logs a malformed request body with a fixed reason, not the parser message', async () => {
    t = await startTestApp({}, [ResidentsController], withFilter);

    const response = await fetch(`${t.url}/residents`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"name": "Zelda Testperson",',
    });

    expect(response.status).toBe(400);
    const line = await t.captured.waitFor((l) => l['path'] === '/residents');
    expect(line['reason']).toBe('Malformed request body or URL');
    expect(JSON.stringify(t.captured.lines)).not.toContain('Zelda');
  });

  it('answers an unexpected error as Nest would, logging only its description', async () => {
    t = await startTestApp({}, [ResidentsController], withFilter);

    const response = await fetch(`${t.url}/broken`);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      statusCode: 500,
      message: 'Internal server error',
    });
    const line = await t.captured.waitFor(
      (l) => l['level'] === 'error' && l['context'] === 'ExceptionsHandler'
    );
    expect(String(line['msg'])).toMatch(/^Error\n\s+at /);
    expect(JSON.stringify(t.captured.lines)).not.toContain('Zelda');
  });
});
