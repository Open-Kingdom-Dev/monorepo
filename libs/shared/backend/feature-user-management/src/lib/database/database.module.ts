import { Module, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import {
  createInvitationsTable,
  createCustomRolesTable,
} from './migrations/index.js';

interface DbConnection {
  run: (query: ReturnType<typeof sql>) => Promise<unknown>;
}

@Module({})
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(@Inject(DB_TAG) private readonly db: DbConnection) {}

  async onModuleInit(): Promise<void> {
    await this.runMigrations();
  }

  private async runMigrations(): Promise<void> {
    await this.db.run(createInvitationsTable);
    this.logger.log('Invitations table ensured');

    await this.db.run(createCustomRolesTable);
    this.logger.log('Custom roles table ensured');
  }
}
