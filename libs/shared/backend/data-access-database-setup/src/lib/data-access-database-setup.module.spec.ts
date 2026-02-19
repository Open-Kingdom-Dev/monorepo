import { Test } from '@nestjs/testing';
import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { DatabaseSetupModule } from './data-access-database-setup.module';

const mockPragma = jest.fn();

jest.mock('better-sqlite3', () => {
  return jest.fn().mockImplementation(() => ({
    pragma: mockPragma,
  }));
});

jest.mock('drizzle-orm/better-sqlite3', () => ({
  drizzle: jest.fn().mockImplementation((_sqlite, config) => ({
    query: {},
    _schema: config?.schema,
  })),
}));

describe('DatabaseSetupModule', () => {
  const mockSchema = { users: { name: 'users' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is defined', () => {
    expect(DatabaseSetupModule).toBeDefined();
  });

  it('makes the database available to all modules in the application', () => {
    const dynamicModule = DatabaseSetupModule.register({
      schema: mockSchema,
      filename: 'test.db',
    });

    expect(dynamicModule.module).toBe(DatabaseSetupModule);
    expect(dynamicModule.global).toBe(true);
    expect(dynamicModule.exports).toContain(DB_TAG);
    expect(dynamicModule.providers).toEqual(
      expect.arrayContaining([expect.objectContaining({ provide: DB_TAG })])
    );
  });

  it('only requires a schema to set up the database', () => {
    const dynamicModule = DatabaseSetupModule.register({
      schema: mockSchema,
    });

    expect(dynamicModule).toBeDefined();
    expect(dynamicModule.providers).toBeDefined();
    expect(dynamicModule.exports).toContain(DB_TAG);
  });

  it('opens the database at the specified file path', async () => {
    const Database = require('better-sqlite3');

    const module = await Test.createTestingModule({
      imports: [
        DatabaseSetupModule.register({
          schema: mockSchema,
          filename: 'test.db',
        }),
      ],
    }).compile();

    const db = module.get(DB_TAG);

    expect(db).toBeDefined();
    expect(Database).toHaveBeenCalledWith('test.db');
    expect(mockPragma).not.toHaveBeenCalled();
  });

  it('applies pragmas to configure the database connection', async () => {
    await Test.createTestingModule({
      imports: [
        DatabaseSetupModule.register({
          schema: mockSchema,
          filename: 'pragmas.db',
          pragmas: {
            journal_mode: 'WAL',
            foreign_keys: 'ON',
          },
        }),
      ],
    }).compile();

    expect(mockPragma).toHaveBeenCalledWith('journal_mode = WAL');
    expect(mockPragma).toHaveBeenCalledWith('foreign_keys = ON');
  });

  it('defaults to demo.db when no filename is specified', async () => {
    const Database = require('better-sqlite3');

    await Test.createTestingModule({
      imports: [
        DatabaseSetupModule.register({
          schema: mockSchema,
        }),
      ],
    }).compile();

    expect(Database).toHaveBeenCalledWith('demo.db');
  });
});
