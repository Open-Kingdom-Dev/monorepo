import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { and, asc, eq, like, or } from 'drizzle-orm';

import { DB_TAG, SCHEMA_TAG } from '@open-kingdom/shared-poly-util-constants';
import type { Company, ContactsSchema } from './schemas';
import { CreateCompanyDto, UpdateCompanyDto } from './dtos';

export interface CompanyFilter {
  ownerId?: number;
  status?: string;
  search?: string;
  includeArchived?: boolean;
}

@Injectable()
export class CompaniesService {
  // Tables come from the host-composed schema (SCHEMA_TAG) rather than the
  // module-scope singletons, so a prefixed schema (embedded mode) works
  // transparently.
  private readonly companies: ContactsSchema['companies'];

  constructor(
    @Inject(DB_TAG) private readonly db: BetterSQLite3Database<ContactsSchema>,
    @Inject(SCHEMA_TAG) schema: ContactsSchema
  ) {
    this.companies = schema.companies;
  }

  async findAll(filter: CompanyFilter = {}): Promise<Company[]> {
    const conditions = [];
    if (!filter.includeArchived) {
      conditions.push(eq(this.companies.isArchived, 0));
    }
    if (filter.ownerId !== undefined) {
      conditions.push(eq(this.companies.ownerId, filter.ownerId));
    }
    if (filter.status) {
      conditions.push(eq(this.companies.status, filter.status));
    }
    if (filter.search) {
      const wildcard = `%${filter.search}%`;
      const searchCond = or(
        like(this.companies.name, wildcard),
        like(this.companies.website, wildcard),
        like(this.companies.industry, wildcard)
      );
      if (searchCond) conditions.push(searchCond);
    }
    return this.db
      .select()
      .from(this.companies)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(this.companies.name))
      .all();
  }

  async findById(id: number): Promise<Company | undefined> {
    return this.db.query.companies.findFirst({
      where: eq(this.companies.id, id),
    });
  }

  async create(
    input: CreateCompanyDto,
    defaultOwnerId: number
  ): Promise<Company> {
    const { ownerId, status, ...rest } = input;
    const [row] = await this.db
      .insert(this.companies)
      .values({
        ...rest,
        name: input.name,
        status: status ?? 'active',
        ownerId: ownerId ?? defaultOwnerId,
        isArchived: 0,
      })
      .returning();
    return row;
  }

  async update(id: number, input: UpdateCompanyDto): Promise<Company> {
    const current = await this.findById(id);
    if (!current) throw new NotFoundException(`Company ${id} not found`);
    const patch = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined)
    );
    const [row] = await this.db
      .update(this.companies)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(this.companies.id, id))
      .returning();
    return row;
  }

  async archive(id: number): Promise<Company> {
    const current = await this.findById(id);
    if (!current) throw new NotFoundException(`Company ${id} not found`);
    const [row] = await this.db
      .update(this.companies)
      .set({ isArchived: 1, updatedAt: new Date() })
      .where(eq(this.companies.id, id))
      .returning();
    return row;
  }

  async restore(id: number): Promise<Company> {
    const current = await this.findById(id);
    if (!current) throw new NotFoundException(`Company ${id} not found`);
    const [row] = await this.db
      .update(this.companies)
      .set({ isArchived: 0, updatedAt: new Date() })
      .where(eq(this.companies.id, id))
      .returning();
    return row;
  }

  async assertOwnerOrAdmin(
    id: number,
    userId: number,
    isAdmin: boolean
  ): Promise<Company> {
    const current = await this.findById(id);
    if (!current) throw new NotFoundException(`Company ${id} not found`);
    if (!isAdmin && current.ownerId !== userId) {
      throw new ForbiddenException('Not the owner of this company');
    }
    return current;
  }
}
