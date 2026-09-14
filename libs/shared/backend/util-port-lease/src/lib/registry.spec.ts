import {
  lowestFreeSlot,
  normalizeWorktreePath,
  parseRegistry,
  parseWorktreePorcelain,
  pruneRegistry,
  selectSlot,
  serializeRegistry,
} from './registry.js';

const PRIMARY = '/work/project';
const FEATURE = '/work/project-feature-x';

describe('normalizeWorktreePath', () => {
  it.each([
    ['backslashes', 'C:\\work\\project', 'C:/work/project'],
    ['drive-letter case', 'c:/work/project', 'C:/work/project'],
    ['trailing slash', '/work/project/', '/work/project'],
    ['duplicate separators', '/work//project', '/work/project'],
    ['surrounding space', '  /work/project  ', '/work/project'],
  ])('canonicalizes %s', (_label, input, expected) => {
    expect(normalizeWorktreePath(input)).toBe(expected);
  });

  it('keeps a UNC prefix intact', () => {
    expect(normalizeWorktreePath('\\\\host\\share\\project')).toBe(
      '//host/share/project'
    );
  });

  it('leaves root alone and maps empty input to empty', () => {
    expect(normalizeWorktreePath('/')).toBe('/');
    expect(normalizeWorktreePath('')).toBe('');
  });

  it('treats separator variants of one directory as the same worktree', () => {
    expect(normalizeWorktreePath('C:\\work\\project\\')).toBe(
      normalizeWorktreePath('c:/work/project')
    );
  });
});

describe('parseWorktreePorcelain', () => {
  it('extracts paths in git order, primary first', () => {
    const stdout = [
      'worktree /work/project',
      'HEAD abc123',
      'branch refs/heads/main',
      '',
      'worktree /work/project-feature-x',
      'HEAD def456',
      'branch refs/heads/feature-x',
      '',
    ].join('\n');
    expect(parseWorktreePorcelain(stdout)).toEqual([PRIMARY, FEATURE]);
  });

  it('normalizes as it parses and tolerates CRLF', () => {
    expect(parseWorktreePorcelain('worktree c:\\work\\project\r\n')).toEqual([
      'C:/work/project',
    ]);
  });

  it('returns nothing for empty output', () => {
    expect(parseWorktreePorcelain('')).toEqual([]);
  });
});

describe('parseRegistry', () => {
  it('round-trips through serializeRegistry', () => {
    const registry = {
      slots: {
        '0': { path: PRIMARY, branch: 'main' },
        '1': { path: FEATURE, branch: 'feature-x' },
      },
    };
    expect(parseRegistry(serializeRegistry(registry))).toEqual(registry);
  });

  it('orders slots numerically, not lexically', () => {
    const serialized = serializeRegistry({
      slots: {
        '10': { path: '/w/j', branch: '' },
        '2': { path: '/w/b', branch: '' },
        '0': { path: PRIMARY, branch: '' },
      },
    });
    expect(Object.keys(JSON.parse(serialized).slots)).toEqual(['0', '2', '10']);
  });

  it.each([
    ['null', null],
    ['empty string', ''],
    ['malformed JSON', '{not json'],
    ['a JSON array', '[]'],
    ['a missing slots key', '{}'],
  ])('reads %s as an empty registry rather than throwing', (_label, raw) => {
    expect(parseRegistry(raw)).toEqual({ slots: {} });
  });

  it('drops entries that are not usable slot records', () => {
    const raw = JSON.stringify({
      slots: {
        '0': { path: PRIMARY, branch: 'main' },
        '1': { path: '' },
        '-2': { path: '/w/neg' },
        abc: { path: '/w/nan' },
        '3': 'nope',
        '4': { path: 'c:\\w\\d' },
      },
    });
    expect(parseRegistry(raw)).toEqual({
      slots: {
        '0': { path: PRIMARY, branch: 'main' },
        '4': { path: 'C:/w/d', branch: '' },
      },
    });
  });
});

describe('pruneRegistry', () => {
  it('drops slots whose worktree is gone and keeps the live ones', () => {
    const registry = {
      slots: {
        '0': { path: PRIMARY, branch: 'main' },
        '1': { path: FEATURE, branch: 'feature-x' },
        '2': { path: '/work/project-deleted', branch: 'gone' },
      },
    };
    expect(pruneRegistry(registry, [PRIMARY, FEATURE])).toEqual({
      slots: {
        '0': { path: PRIMARY, branch: 'main' },
        '1': { path: FEATURE, branch: 'feature-x' },
      },
    });
  });

  it('compares through the canonicalizer', () => {
    const registry = { slots: { '1': { path: 'C:/work/x', branch: '' } } };
    expect(pruneRegistry(registry, ['c:\\work\\x\\']).slots['1']).toBeDefined();
  });

  it('frees the slot space so churn cannot exhaust it', () => {
    const registry = { slots: { '1': { path: '/work/old', branch: '' } } };
    const pruned = pruneRegistry(registry, [PRIMARY]);
    expect(lowestFreeSlot(pruned.slots)).toBe(1);
  });
});

describe('selectSlot', () => {
  const base = { primaryWorktreePath: PRIMARY };

  it('pins the primary worktree to slot 0', () => {
    const result = selectSlot(
      { slots: {} },
      { ...base, worktreePath: PRIMARY, branch: 'main' }
    );
    expect(result).toMatchObject({ slot: 0, isPrimary: true, reused: false });
    expect(result.registry.slots['0']).toEqual({
      path: PRIMARY,
      branch: 'main',
    });
  });

  it('evicts a stale holder of slot 0 when the primary claims it', () => {
    const result = selectSlot(
      { slots: { '0': { path: '/work/squatter', branch: 'old' } } },
      { ...base, worktreePath: PRIMARY, branch: 'main' }
    );
    expect(result.slot).toBe(0);
    expect(result.registry.slots['0'].path).toBe(PRIMARY);
  });

  it('releases a primary worktree stale non-zero slot when pinning it to 0', () => {
    const result = selectSlot(
      { slots: { '3': { path: PRIMARY, branch: 'main' } } },
      { ...base, worktreePath: PRIMARY, branch: 'main' }
    );
    expect(result.slot).toBe(0);
    expect(result.registry.slots).toEqual({
      '0': { path: PRIMARY, branch: 'main' },
    });
  });

  it('gives a new worktree the lowest free slot >= 1', () => {
    const result = selectSlot(
      { slots: { '0': { path: PRIMARY, branch: 'main' } } },
      { ...base, worktreePath: FEATURE, branch: 'feature-x' }
    );
    expect(result).toMatchObject({ slot: 1, isPrimary: false, reused: false });
  });

  it('fills a gap left by a pruned worktree', () => {
    const registry = {
      slots: {
        '0': { path: PRIMARY, branch: 'main' },
        '2': { path: '/work/b', branch: 'b' },
      },
    };
    expect(selectSlot(registry, { ...base, worktreePath: FEATURE }).slot).toBe(
      1
    );
  });

  it('reuses an existing slot so ports survive restarts', () => {
    const registry = {
      slots: {
        '0': { path: PRIMARY, branch: 'main' },
        '1': { path: '/work/a', branch: 'a' },
        '2': { path: FEATURE, branch: 'feature-x' },
      },
    };
    const result = selectSlot(registry, {
      ...base,
      worktreePath: FEATURE,
      branch: 'feature-x',
    });
    expect(result).toMatchObject({ slot: 2, reused: true });
  });

  it('refreshes the recorded branch on reuse', () => {
    const registry = { slots: { '1': { path: FEATURE, branch: 'old' } } };
    const result = selectSlot(registry, {
      ...base,
      worktreePath: FEATURE,
      branch: 'renamed',
    });
    expect(result.registry.slots['1'].branch).toBe('renamed');
  });

  it('matches an existing entry through the canonicalizer', () => {
    const registry = { slots: { '1': { path: 'C:/work/x', branch: '' } } };
    const result = selectSlot(registry, {
      primaryWorktreePath: 'C:/work/main',
      worktreePath: 'c:\\work\\x\\',
    });
    expect(result).toMatchObject({ slot: 1, reused: true });
    expect(Object.keys(result.registry.slots)).toEqual(['1']);
  });

  it('never mutates the input registry', () => {
    const registry = { slots: { '0': { path: PRIMARY, branch: 'main' } } };
    const snapshot = JSON.stringify(registry);
    selectSlot(registry, { ...base, worktreePath: FEATURE });
    expect(JSON.stringify(registry)).toBe(snapshot);
  });

  it('hands distinct slots to a sequence of new worktrees', () => {
    let registry = { slots: {} };
    const slots: number[] = [];
    for (const path of [PRIMARY, '/w/a', '/w/b', '/w/c']) {
      const result = selectSlot(registry, { ...base, worktreePath: path });
      registry = result.registry;
      slots.push(result.slot);
    }
    expect(slots).toEqual([0, 1, 2, 3]);
  });
});

describe('lowestFreeSlot', () => {
  it('never returns 0, which is reserved for the primary worktree', () => {
    expect(lowestFreeSlot({})).toBe(1);
  });

  it('skips taken slots', () => {
    expect(
      lowestFreeSlot({
        '0': { path: '/a', branch: '' },
        '1': { path: '/b', branch: '' },
        '3': { path: '/c', branch: '' },
      })
    ).toBe(2);
  });
});
