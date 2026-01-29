import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { User, users, UsersTableName } from './schemas';

type schema = {
  [UsersTableName]: typeof users;
};

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(@Inject(DB_TAG) private db: BetterSQLite3Database<schema>) {}

  async onModuleInit() {
    await this.ensureUser({
      invitedBy: null,
      firstName: 'Admin',
      lastName: 'Admin',
      email: 'admin@admin.com',
      password: 'admin',
      role: 'admin',
    });
  }

  async findOne(email: string): Promise<User | undefined> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
    return user;
  }

  async ensureUser(data: Omit<User, 'id'>) {
    const existing = await this.findOne(data.email);
    if (existing) return existing;

    await this.db.insert(users).values({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: await bcrypt.hash(data.password, 12),
      role: data.role ?? 'admin',
    });
    return this.findOne(data.email);
  }
}
