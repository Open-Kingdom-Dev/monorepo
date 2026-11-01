import {
  CanActivate,
  Controller,
  Get,
  Logger,
  UseGuards,
} from '@nestjs/common';

import { bindLogFields, LogDomainFields, runWithLogFields } from '../index';
import { startTestApp, TestApp } from './testing/logging-test-app';

declare module '../index' {
  interface LogDomainFields {
    deviceId: string;
  }
}

class VerifiedDeviceGuard implements CanActivate {
  canActivate(): boolean {
    bindLogFields({ deviceId: 'wall-7' });
    return true;
  }
}

@Controller()
class DeviceController {
  private readonly logger = new Logger('DeviceController');

  @Get('device')
  @UseGuards(VerifiedDeviceGuard)
  async device() {
    await new Promise((resolve) => setTimeout(resolve, 5));
    this.logger.log('settings stream opened');
    return { ok: true };
  }
}

class StrayFieldGuard implements CanActivate {
  canActivate(): boolean {
    bindLogFields({
      deviceId: 'wall-7',
      residentName: 'Jane Doe',
    } as Partial<LogDomainFields>);
    return true;
  }
}

@Controller()
class StrayFieldController {
  @Get('stray')
  @UseGuards(StrayFieldGuard)
  stray() {
    return { ok: true };
  }
}

describe('domain fields', () => {
  let t: TestApp;

  afterEach(async () => {
    await t?.app.close();
  });

  it('carries fields bound during a request on its later lines and its access line', async () => {
    t = await startTestApp({ domainFields: ['deviceId'] }, [DeviceController]);

    await fetch(`${t.url}/device`, { headers: { 'x-request-id': 'r-9' } });

    const appLine = await t.captured.waitFor(
      (l) => l['msg'] === 'settings stream opened'
    );
    expect(appLine).toMatchObject({
      deviceId: 'wall-7',
      requestId: 'r-9',
      context: 'DeviceController',
    });
    const accessLine = await t.captured.waitFor((l) => l['path'] === '/device');
    expect(accessLine).toMatchObject({ deviceId: 'wall-7', requestId: 'r-9' });
  });

  it('drops a field the host never declared, and warns once naming it', async () => {
    t = await startTestApp({ domainFields: ['deviceId'] }, [
      StrayFieldController,
    ]);

    await fetch(`${t.url}/stray`);
    await fetch(`${t.url}/stray`);

    await t.captured.waitFor(
      (l) => l['path'] === '/stray' && l['level'] === 'info'
    );
    const all = JSON.stringify(t.captured.lines);
    expect(all).not.toContain('Jane Doe');
    const warnings = t.captured.lines.filter(
      (l) => l['level'] === 'warn' && String(l['msg']).includes('residentName')
    );
    expect(warnings).toHaveLength(1);
  });

  it('scopes fields to work outside a request, without leaking between scopes', async () => {
    t = await startTestApp({ domainFields: ['deviceId'] });
    const logger = new Logger('TunnelRelay');
    const connection = (deviceId: string) =>
      runWithLogFields({ deviceId }, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        logger.log(`device connected ${deviceId}`);
      });

    await Promise.all([connection('wall-1'), connection('wall-2')]);
    logger.log('relay idle');

    const first = await t.captured.waitFor(
      (l) => l['msg'] === 'device connected wall-1'
    );
    const second = await t.captured.waitFor(
      (l) => l['msg'] === 'device connected wall-2'
    );
    const idle = await t.captured.waitFor((l) => l['msg'] === 'relay idle');
    expect(first['deviceId']).toBe('wall-1');
    expect(second['deviceId']).toBe('wall-2');
    expect(idle['deviceId']).toBeUndefined();
  });
});
