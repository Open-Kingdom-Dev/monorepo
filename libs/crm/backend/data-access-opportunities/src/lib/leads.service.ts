import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { and, asc, eq, like, or } from 'drizzle-orm';

import { DB_TAG, SCHEMA_TAG } from '@open-kingdom/shared-poly-util-constants';
import type { Lead, OpportunitiesSchema } from './schemas';
import { CreateLeadDto, UpdateLeadDto } from './dtos';

export interface LeadFilter {
  ownerId?: number;
  status?: string;
  search?: string;
  includeConverted?: boolean;
}

@Injectable()
export class LeadsService {
  // Tables come from the host-composed schema (SCHEMA_TAG) rather than the
  // module-scope singletons, so a prefixed schema (embedded mode) works
  // transparently.
  private readonly leads: OpportunitiesSchema['leads'];

  constructor(
    @Inject(DB_TAG)
    private readonly db: BetterSQLite3Database<OpportunitiesSchema>,
    @Inject(SCHEMA_TAG) schema: OpportunitiesSchema
  ) {
    this.leads = schema.leads;
  }

  async findAll(filter: LeadFilter = {}): Promise<Lead[]> {
    const conditions = [];
    if (filter.ownerId !== undefined) {
      conditions.push(eq(this.leads.ownerId, filter.ownerId));
    }
    if (filter.status) {
      conditions.push(eq(this.leads.status, filter.status));
    }
    if (filter.search) {
      const wildcard = `%${filter.search}%`;
      const searchCond = or(
        like(this.leads.name, wildcard),
        like(this.leads.companyName, wildcard),
        like(this.leads.email, wildcard),
        like(this.leads.phone, wildcard)
      );
      if (searchCond) conditions.push(searchCond);
    }
    return this.db
      .select()
      .from(this.leads)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(this.leads.createdAt))
      .all();
  }

  async findById(id: number): Promise<Lead | undefined> {
    return this.db.query.leads.findFirst({ where: eq(this.leads.id, id) });
  }

  async create(input: CreateLeadDto, defaultOwnerId: number): Promise<Lead> {
    if (!input.email && !input.phone) {
      throw new BadRequestException(
        'At least one contact method (email or phone) is required'
      );
    }
    const { ownerId, status, ...rest } = input;
    const [row] = await this.db
      .insert(this.leads)
      .values({
        ...rest,
        name: input.name,
        status: status ?? 'new',
        ownerId: ownerId ?? defaultOwnerId,
      })
      .returning();
    return row;
  }

  async update(id: number, input: UpdateLeadDto): Promise<Lead> {
    const current = await this.findById(id);
    if (!current) throw new NotFoundException(`Lead ${id} not found`);
    const patch = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined)
    );
    const [row] = await this.db
      .update(this.leads)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(this.leads.id, id))
      .returning();
    return row;
  }

  async markConverted(
    id: number,
    contactId: number | null,
    companyId: number | null
  ): Promise<Lead> {
    const current = await this.findById(id);
    if (!current) throw new NotFoundException(`Lead ${id} not found`);
    const [row] = await this.db
      .update(this.leads)
      .set({
        status: 'qualified',
        convertedAt: new Date(),
        convertedToContactId: contactId,
        convertedToCompanyId: companyId,
        updatedAt: new Date(),
      })
      .where(eq(this.leads.id, id))
      .returning();
    return row;
  }

  async delete(id: number): Promise<void> {
    const current = await this.findById(id);
    if (!current) throw new NotFoundException(`Lead ${id} not found`);
    await this.db.delete(this.leads).where(eq(this.leads.id, id));
  }
}
