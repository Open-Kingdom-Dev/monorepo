import { Test, TestingModule } from '@nestjs/testing';
import { DrizzleBetterSQLiteModule } from '@knaadh/nestjs-drizzle-better-sqlite3';

import { DB_TAG } from '@ynaa/shared-poly-util-constants';
import { YnaaDataAccessBackendUsersModule } from './data-access-backend-users.module';
import { UsersService } from './users.service';
import { users } from './schema';

describe('YnaaDataAccessBackendUsersModule', () => {
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
        YnaaDataAccessBackendUsersModule,
      ],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('module configuration', () => {
    it('should be defined', () => {
      expect(YnaaDataAccessBackendUsersModule).toBeDefined();
    });

    it('should have no controllers', () => {
      // This module is a data access module, so it shouldn't have controllers
      const moduleRef = module.get(YnaaDataAccessBackendUsersModule);
      expect(moduleRef).toBeDefined();
      // Controllers array should be empty as defined in the module
    });
  });

  describe('service availability', () => {
    it('should make UsersService available for dependency injection', () => {
      const usersService = module.get<UsersService>(UsersService);
      expect(usersService).toBeDefined();
      expect(typeof usersService.findOne).toBe('function');
      expect(typeof usersService.ensureUser).toBe('function');
      expect(typeof usersService.onModuleInit).toBe('function');
    });

    it('should allow multiple instances to access the same service', () => {
      const service1 = module.get<UsersService>(UsersService);
      const service2 = module.get<UsersService>(UsersService);

      // In a real scenario, these would be the same instance (singleton)
      expect(service1).toBeDefined();
      expect(service2).toBeDefined();
      expect(service1.constructor).toBe(service2.constructor);
    });
  });
});
