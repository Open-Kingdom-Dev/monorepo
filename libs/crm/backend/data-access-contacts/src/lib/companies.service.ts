import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { and, asc, eq, like, or } from 'drizzle-orm';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { Company, CompaniesTableName, companies } from './schemas';
import { CreateCompanyDto, UpdateCompanyDto } from './dtos';

type schema = {
  [CompaniesTableName]: typeof companies;
};

export interface CompanyFilter {
  ownerId?: number;
  status?: string;
  search?: string;
  includeArchived?: boolean;
}

@Injectable()
export class CompaniesService {
  constructor(
    @Inject(DB_TAG) private readonly db: BetterSQLite3Database<schema>
  ) {}

  async findAll(filter: CompanyFilter = {}): Promise<Company[]> {
    const conditions = [];
    if (!filter.includeArchived) {
      conditions.push(eq(companies.isArchived, 0));
    }
    if (filter.ownerId !== undefined) {
      conditions.push(eq(companies.ownerId, filter.ownerId));
    }
    if (filter.status) {
      conditions.push(eq(companies.status, filter.status));
    }
    if (filter.search) {
      const wildcard = `%${filter.search}%`;
      const searchCond = or(
        like(companies.name, wildcard),
        like(companies.website, wildcard),
        like(companies.industry, wildcard)
      );
      if (searchCond) conditions.push(searchCond);
    }
    return this.db
      .select()
      .from(companies)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(companies.name))
      .all();
  }

  async findById(id: number): Promise<Company | undefined> {
    return this.db.query.companies.findFirst({
      where: eq(companies.id, id),
    });
  }

  async create(
    input: CreateCompanyDto,
    defaultOwnerId: number
  ): Promise<Company> {
    const { ownerId, status, ...rest } = input;
    const [row] = await this.db
      .insert(companies)
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
      .update(companies)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return row;
  }

  async archive(id: number): Promise<Company> {
    const current = await this.findById(id);
    if (!current) throw new NotFoundException(`Company ${id} not found`);
    const [row] = await this.db
      .update(companies)
      .set({ isArchived: 1, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return row;
  }

  async restore(id: number): Promise<Company> {
    const current = await this.findById(id);
    if (!current) throw new NotFoundException(`Company ${id} not found`);
    const [row] = await this.db
      .update(companies)
      .set({ isArchived: 0, updatedAt: new Date() })
      .where(eq(companies.id, id))
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
