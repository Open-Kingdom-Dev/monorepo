import type { Request } from 'express';
import {
  InMemoryOAuthStateStore,
  OAUTH_STATE_TTL_MS,
} from './google-auth-emulate.state-store';

describe('InMemoryOAuthStateStore', () => {
  let store: InMemoryOAuthStateStore;
  const req = {} as Request;

  const register = (nonce?: string): string => {
    let handle: string | undefined;
    store.store(req, undefined, { nonce }, {}, (_err, h) => {
      handle = h;
    });
    return handle as string;
  };

  beforeEach(() => {
    store = new InMemoryOAuthStateStore();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('generates a handle and remembers the nonce', () => {
    const handle = register('nonce-1');

    expect(handle).toBeDefined();
    expect(store.consume(handle)).toMatchObject({ nonce: 'nonce-1' });
  });

  it('defaults the nonce to an empty string when none is supplied', () => {
    const handle = register();

    expect(store.consume(handle)).toMatchObject({ nonce: '' });
  });

  it('verifies a known state', () => {
    const handle = register('nonce-1');
    const callback = jest.fn();

    store.verify(req, handle, callback);

    expect(callback).toHaveBeenCalledWith(null, true, handle);
  });

  it('rejects a missing state', () => {
    const callback = jest.fn();

    store.verify(req, undefined, callback);

    expect(callback).toHaveBeenCalledWith(null, false, {
      message: 'Missing OAuth state parameter',
    });
  });

  it('rejects an unknown state', () => {
    const callback = jest.fn();

    store.verify(req, 'not-a-handle', callback);

    expect(callback).toHaveBeenCalledWith(null, false, {
      message: 'Invalid or expired OAuth state parameter',
    });
  });

  it('consumes a pending authorization only once', () => {
    const handle = register('nonce-1');

    expect(store.consume(handle)).toBeDefined();
    expect(store.consume(handle)).toBeUndefined();
  });

  it('returns undefined when consuming without a handle', () => {
    expect(store.consume(undefined)).toBeUndefined();
  });

  it('sweeps entries older than the TTL', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const stale = register('stale-nonce');

    jest.setSystemTime(new Date(Date.now() + OAUTH_STATE_TTL_MS + 1000));

    // A new registration triggers the sweep.
    const fresh = register('fresh-nonce');

    const callback = jest.fn();
    store.verify(req, stale, callback);
    expect(callback).toHaveBeenCalledWith(null, false, {
      message: 'Invalid or expired OAuth state parameter',
    });

    const freshCallback = jest.fn();
    store.verify(req, fresh, freshCallback);
    expect(freshCallback).toHaveBeenCalledWith(null, true, fresh);
  });
});
