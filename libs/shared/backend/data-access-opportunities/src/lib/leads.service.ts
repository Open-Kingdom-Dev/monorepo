import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { and, asc, eq, like, or } from 'drizzle-orm';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { Lead, LeadsTableName, leads } from './schemas';
import { CreateLeadDto, UpdateLeadDto } from './dtos';

type schema = {
  [LeadsTableName]: typeof leads;
};

export interface LeadFilter {
  ownerId?: number;
  status?: string;
  search?: string;
  includeConverted?: boolean;
}

@Injectable()
export class LeadsService {
  constructor(@Inject(DB_TAG) private readonly db: BetterSQLite3Database<schema>) {}

  async findAll(filter: LeadFilter = {}): Promise<Lead[]> {
    const conditions = [];
    if (filter.ownerId !== undefined) {
      conditions.push(eq(leads.ownerId, filter.ownerId));
    }
    if (filter.status) {
      conditions.push(eq(leads.status, filter.status));
    }
    if (filter.search) {
      const wildcard = `%${filter.search}%`;
      const searchCond = or(
        like(leads.name, wildcard),
        like(leads.companyName, wildcard),
        like(leads.email, wildcard),
        like(leads.phone, wildcard)
      );
      if (searchCond) conditions.push(searchCond);
    }
    return this.db
      .select()
      .from(leads)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(leads.createdAt))
      .all();
  }

  async findById(id: number): Promise<Lead | undefined> {
    return this.db.query.leads.findFirst({ where: eq(leads.id, id) });
  }

  async create(input: CreateLeadDto, defaultOwnerId: number): Promise<Lead> {
    if (!input.email && !input.phone) {
      throw new BadRequestException(
        'At least one contact method (email or phone) is required'
      );
    }
    const { ownerId, status, ...rest } = input;
    const [row] = await this.db
      .insert(leads)
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
      .update(leads)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(leads.id, id))
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
      .update(leads)
      .set({
        status: 'qualified',
        convertedAt: new Date(),
        convertedToContactId: contactId,
        convertedToCompanyId: companyId,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, id))
      .returning();
    return row;
  }

  async delete(id: number): Promise<void> {
    const current = await this.findById(id);
    if (!current) throw new NotFoundException(`Lead ${id} not found`);
    await this.db.delete(leads).where(eq(leads.id, id));
  }
}
