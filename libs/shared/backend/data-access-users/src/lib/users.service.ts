import { Inject, Injectable } from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { User, users, UsersTableName } from './schemas';

type schema = {
  [UsersTableName]: typeof users;
};

@Injectable()
export class UsersService {
  constructor(@Inject(DB_TAG) private db: BetterSQLite3Database<schema>) {}

  async findOne(email: string): Promise<User | undefined> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
    return user;
  }

  async findById(id: number): Promise<User | undefined> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.db.query.users.findMany();
  }

  async create(data: Omit<User, 'id'>): Promise<User> {
    await this.db.insert(users).values({
      ...data,
      password: await bcrypt.hash(data.password, 12),
    });
    return this.findOne(data.email) as Promise<User>;
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  async ensureUser(data: Omit<User, 'id'>) {
    const existing = await this.findOne(data.email);
    if (existing) return existing;

    await this.db.insert(users).values({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: await bcrypt.hash(data.password, 12),
    });
    return this.findOne(data.email);
  }
}
