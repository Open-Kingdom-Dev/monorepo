import { Inject, Injectable } from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

import { DB_TAG, SCHEMA_TAG } from '@open-kingdom/shared-poly-util-constants';
import type { User, UsersSchema } from './schemas';

/**
 * Input for creating a user. `password` is optional: omit it (or pass null)
 * for users owned by an external identity provider — the row is stored with a
 * null password and can never log in through the credential path.
 */
export type CreateUserInput = Omit<User, 'id' | 'password'> & {
  password?: string | null;
};

@Injectable()
export class UsersService {
  // Tables come from the host-composed schema (SCHEMA_TAG) rather than the
  // module-scope singletons, so a prefixed schema (embedded mode) works
  // transparently.
  private readonly users: UsersSchema['users'];

  constructor(
    @Inject(DB_TAG) private db: BetterSQLite3Database<UsersSchema>,
    @Inject(SCHEMA_TAG) schema: UsersSchema
  ) {
    this.users = schema.users;
  }

  async findOne(email: string): Promise<User | undefined> {
    const user = await this.db.query.users.findFirst({
      where: eq(this.users.email, email),
    });
    return user;
  }

  async findById(id: number): Promise<User | undefined> {
    const user = await this.db.query.users.findFirst({
      where: eq(this.users.id, id),
    });
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.db.query.users.findMany();
  }

  async create(data: CreateUserInput): Promise<User> {
    await this.db.insert(this.users).values({
      ...data,
      password: data.password ? await bcrypt.hash(data.password, 12) : null,
    });
    return this.findOne(data.email) as Promise<User>;
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(this.users).where(eq(this.users.id, id));
  }

  async ensureUser(data: CreateUserInput) {
    const existing = await this.findOne(data.email);
    if (existing) return existing;

    await this.db.insert(this.users).values({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password ? await bcrypt.hash(data.password, 12) : null,
    });
    return this.findOne(data.email);
  }
}
