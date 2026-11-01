import { Controller, Get, Logger } from '@nestjs/common';

import { startTestApp, TestApp } from './testing/logging-test-app';

@Controller()
class InvitationController {
  private readonly logger = new Logger('Invitations');

  @Get('invite')
  invite() {
    this.logger.log({
      msg: 'invitation sent',
      invitee: { email: 'zelda@example.com', role: 'staff' },
    });
    this.logger.debug('rendering invitation template');
    return { ok: true };
  }
}

describe('configuration', () => {
  let t: TestApp;
  const savedLevel = process.env['LOG_LEVEL'];

  afterEach(async () => {
    await t?.app.close();
    if (savedLevel === undefined) delete process.env['LOG_LEVEL'];
    else process.env['LOG_LEVEL'] = savedLevel;
  });

  it("strips the host's redact paths from every line", async () => {
    t = await startTestApp({ redact: ['invitee.email'] }, [
      InvitationController,
    ]);

    await fetch(`${t.url}/invite`);

    const line = await t.captured.waitFor(
      (l) => l['msg'] === 'invitation sent'
    );
    expect(line['invitee']).toEqual({ role: 'staff' });
    expect(JSON.stringify(t.captured.lines)).not.toContain('zelda@');
  });

  it('logs at the default level unless LOG_LEVEL overrides it', async () => {
    t = await startTestApp({ level: 'info' }, [InvitationController]);
    await fetch(`${t.url}/invite`);
    await t.captured.waitFor((l) => l['path'] === '/invite');
    expect(t.captured.lines.some((l) => l['level'] === 'debug')).toBe(false);
    await t.app.close();

    process.env['LOG_LEVEL'] = 'debug';
    t = await startTestApp({ level: 'info' }, [InvitationController]);
    await fetch(`${t.url}/invite`);

    await t.captured.waitFor(
      (l) => l['msg'] === 'rendering invitation template'
    );
  });
});
