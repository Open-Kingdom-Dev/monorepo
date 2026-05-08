import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { and, asc, eq, like, or } from 'drizzle-orm';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { Contact, ContactsTableName, contacts } from './schemas';
import { CreateContactDto, UpdateContactDto } from './dtos';

type schema = {
  [ContactsTableName]: typeof contacts;
};

export interface ContactFilter {
  ownerId?: number;
  companyId?: number;
  status?: string;
  search?: string;
  includeArchived?: boolean;
}

@Injectable()
export class ContactsService {
  constructor(
    @Inject(DB_TAG) private readonly db: BetterSQLite3Database<schema>
  ) {}

  async findAll(filter: ContactFilter = {}): Promise<Contact[]> {
    const conditions = [];
    if (!filter.includeArchived) {
      conditions.push(eq(contacts.isArchived, 0));
    }
    if (filter.ownerId !== undefined) {
      conditions.push(eq(contacts.ownerId, filter.ownerId));
    }
    if (filter.companyId !== undefined) {
      conditions.push(eq(contacts.companyId, filter.companyId));
    }
    if (filter.status) {
      conditions.push(eq(contacts.status, filter.status));
    }
    if (filter.search) {
      const wildcard = `%${filter.search}%`;
      const searchCond = or(
        like(contacts.firstName, wildcard),
        like(contacts.lastName, wildcard),
        like(contacts.email, wildcard),
        like(contacts.phone, wildcard)
      );
      if (searchCond) conditions.push(searchCond);
    }
    return this.db
      .select()
      .from(contacts)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(contacts.lastName), asc(contacts.firstName))
      .all();
  }

  async findById(id: number): Promise<Contact | undefined> {
    return this.db.query.contacts.findFirst({
      where: eq(contacts.id, id),
    });
  }

  async create(
    input: CreateContactDto,
    defaultOwnerId: number
  ): Promise<Contact> {
    const { ownerId, status, ...rest } = input;
    const [row] = await this.db
      .insert(contacts)
      .values({
        ...rest,
        firstName: input.firstName,
        lastName: input.lastName,
        status: status ?? 'active',
        ownerId: ownerId ?? defaultOwnerId,
        isArchived: 0,
      })
      .returning();
    return row;
  }

  async update(id: number, input: UpdateContactDto): Promise<Contact> {
    const current = await this.findById(id);
    if (!current) throw new NotFoundException(`Contact ${id} not found`);
    const patch = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined)
    );
    const [row] = await this.db
      .update(contacts)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return row;
  }

  async archive(id: number): Promise<Contact> {
    const current = await this.findById(id);
    if (!current) throw new NotFoundException(`Contact ${id} not found`);
    const [row] = await this.db
      .update(contacts)
      .set({ isArchived: 1, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return row;
  }

  async restore(id: number): Promise<Contact> {
    const current = await this.findById(id);
    if (!current) throw new NotFoundException(`Contact ${id} not found`);
    const [row] = await this.db
      .update(contacts)
      .set({ isArchived: 0, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return row;
  }
}
