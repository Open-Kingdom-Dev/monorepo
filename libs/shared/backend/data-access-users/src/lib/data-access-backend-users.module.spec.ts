import { Test, TestingModule } from '@nestjs/testing';
import { DrizzleBetterSQLiteModule } from '@knaadh/nestjs-drizzle-better-sqlite3';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { users } from './schemas';
import { OpenKingdomDataAccessBackendUsersModule } from './data-access-backend-users.module';
import { UsersService } from './users.service';

describe('OpenKingdomDataAccessBackendUsersModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        DrizzleBetterSQLiteModule.register({
          tag: DB_TAG,
          sqlite3: {
            filename: 'demo-test.db',
          },
          config: { schema: users },
        }),
        OpenKingdomDataAccessBackendUsersModule,
      ],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('integration with NestJS', () => {
    it('can be imported into any NestJS application', () => {
      expect(module).toBeDefined();
    });
  });

  describe('providing user operations', () => {
    it('exposes a service for finding and creating users', () => {
      const usersService = module.get<UsersService>(UsersService);

      expect(usersService).toBeDefined();
      expect(typeof usersService.findOne).toBe('function');
      expect(typeof usersService.ensureUser).toBe('function');
    });

    it('maintains a single shared service instance across the application', () => {
      const service1 = module.get<UsersService>(UsersService);
      const service2 = module.get<UsersService>(UsersService);

      expect(service1).toBe(service2);
    });
  });
});
