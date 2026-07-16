import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { and, asc, eq, like, or, sql } from 'drizzle-orm';

import { DB_TAG, SCHEMA_TAG } from '@open-kingdom/shared-poly-util-constants';
import {
  isTerminalOpportunityStage,
  OpportunityStage,
} from '@open-kingdom/crm-poly-util-domain';
import type { Opportunity, OpportunitiesSchema } from './schemas';
import {
  CloseOpportunityDto,
  CreateOpportunityDto,
  UpdateOpportunityDto,
} from './dtos';

export interface OpportunityFilter {
  ownerId?: number;
  companyId?: number;
  stage?: string;
  search?: string;
  openOnly?: boolean;
}

export interface StageSummary {
  stage: string;
  count: number;
  totalValue: number;
  weightedValue: number;
}

@Injectable()
export class OpportunitiesService {
  // Tables come from the host-composed schema (SCHEMA_TAG) rather than the
  // module-scope singletons, so a prefixed schema (embedded mode) works
  // transparently.
  private readonly opportunities: OpportunitiesSchema['opportunities'];

  constructor(
    @Inject(DB_TAG)
    private readonly db: BetterSQLite3Database<OpportunitiesSchema>,
    @Inject(SCHEMA_TAG) schema: OpportunitiesSchema
  ) {
    this.opportunities = schema.opportunities;
  }

  async findAll(filter: OpportunityFilter = {}): Promise<Opportunity[]> {
    const conditions = [];
    if (filter.ownerId !== undefined) {
      conditions.push(eq(this.opportunities.ownerId, filter.ownerId));
    }
    if (filter.companyId !== undefined) {
      conditions.push(eq(this.opportunities.companyId, filter.companyId));
    }
    if (filter.stage) {
      conditions.push(eq(this.opportunities.stage, filter.stage));
    }
    if (filter.search) {
      const wildcard = `%${filter.search}%`;
      const searchCond = or(
        like(this.opportunities.title, wildcard),
        like(this.opportunities.notes, wildcard)
      );
      if (searchCond) conditions.push(searchCond);
    }
    const rows = await this.db
      .select()
      .from(this.opportunities)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(this.opportunities.expectedCloseDate), asc(this.opportunities.id))
      .all();
    if (filter.openOnly) {
      return rows.filter(
        (r) => !isTerminalOpportunityStage(r.stage as OpportunityStage)
      );
    }
    return rows;
  }

  async findById(id: number): Promise<Opportunity | undefined> {
    return this.db.query.opportunities.findFirst({
      where: eq(this.opportunities.id, id),
    });
  }

  async create(
    input: CreateOpportunityDto,
    defaultOwnerId: number
  ): Promise<Opportunity> {
    const { ownerId, stage, ...rest } = input;
    const [row] = await this.db
      .insert(this.opportunities)
      .values({
        ...rest,
        title: input.title,
        companyId: input.companyId,
        stage: stage ?? 'new',
        ownerId: ownerId ?? defaultOwnerId,
      })
      .returning();
    return row;
  }

  async update(id: number, input: UpdateOpportunityDto): Promise<Opportunity> {
    const current = await this.findById(id);
    if (!current) throw new NotFoundException(`Opportunity ${id} not found`);
    const patch = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined)
    );
    const [row] = await this.db
      .update(this.opportunities)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(this.opportunities.id, id))
      .returning();
    return row;
  }

  async close(id: number, input: CloseOpportunityDto): Promise<Opportunity> {
    const current = await this.findById(id);
    if (!current) throw new NotFoundException(`Opportunity ${id} not found`);
    const [row] = await this.db
      .update(this.opportunities)
      .set({
        stage: input.outcome,
        closedAt: new Date(),
        lossReason: input.outcome === 'lost' ? input.lossReason ?? null : null,
        updatedAt: new Date(),
      })
      .where(eq(this.opportunities.id, id))
      .returning();
    return row;
  }

  async pipelineSummary(ownerId?: number): Promise<StageSummary[]> {
    const conditions = [];
    if (ownerId !== undefined) {
      conditions.push(eq(this.opportunities.ownerId, ownerId));
    }
    const rows = await this.db
      .select({
        stage: this.opportunities.stage,
        count: sql<number>`count(*)`.as('count'),
        totalValue:
          sql<number>`coalesce(sum(${this.opportunities.estimatedValue}), 0)`.as(
            'total_value'
          ),
        weightedValue:
          sql<number>`coalesce(sum(${this.opportunities.estimatedValue} * coalesce(${this.opportunities.probability}, 0) / 100.0), 0)`.as(
            'weighted_value'
          ),
      })
      .from(this.opportunities)
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(this.opportunities.stage)
      .all();
    return rows.map((r) => ({
      stage: r.stage,
      count: Number(r.count ?? 0),
      totalValue: Number(r.totalValue ?? 0),
      weightedValue: Number(r.weightedValue ?? 0),
    }));
  }
}
