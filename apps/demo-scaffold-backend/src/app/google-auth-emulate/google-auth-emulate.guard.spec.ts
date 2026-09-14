import { Test, TestingModule } from '@nestjs/testing';
import { GoogleAuthEmulateGuard } from './google-auth-emulate.guard';

describe('GoogleAuthEmulateGuard', () => {
  let guard: GoogleAuthEmulateGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleAuthEmulateGuard],
    }).compile();

    guard = module.get<GoogleAuthEmulateGuard>(GoogleAuthEmulateGuard);
  });

  it('returns the authenticated user', () => {
    const user = { id: 'user-1' };

    expect(guard.handleRequest(null, user, null)).toBe(user);
  });

  it('surfaces the passport info message on failure', () => {
    expect(() =>
      guard.handleRequest(null, false, {
        message: 'Invalid or expired OAuth state parameter',
      })
    ).toThrow('Invalid or expired OAuth state parameter');
  });

  it('falls back to the error message when there is no info', () => {
    expect(() => guard.handleRequest(new Error('boom'), false, null)).toThrow(
      'boom'
    );
  });

  it('falls back to a generic message when nothing is provided', () => {
    expect(() => guard.handleRequest(null, false, null)).toThrow(
      'Google authentication failed'
    );
  });
});
