import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { and, asc, eq, like, or, sql } from 'drizzle-orm';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import {
  isTerminalOpportunityStage,
  OpportunityStage,
} from '@open-kingdom/shared-poly-util-crm-domain';
import {
  Opportunity,
  OpportunitiesTableName,
  opportunities,
} from './schemas';
import {
  CloseOpportunityDto,
  CreateOpportunityDto,
  UpdateOpportunityDto,
} from './dtos';

type schema = {
  [OpportunitiesTableName]: typeof opportunities;
};

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
  constructor(@Inject(DB_TAG) private readonly db: BetterSQLite3Database<schema>) {}

  async findAll(filter: OpportunityFilter = {}): Promise<Opportunity[]> {
    const conditions = [];
    if (filter.ownerId !== undefined) {
      conditions.push(eq(opportunities.ownerId, filter.ownerId));
    }
    if (filter.companyId !== undefined) {
      conditions.push(eq(opportunities.companyId, filter.companyId));
    }
    if (filter.stage) {
      conditions.push(eq(opportunities.stage, filter.stage));
    }
    if (filter.search) {
      const wildcard = `%${filter.search}%`;
      const searchCond = or(
        like(opportunities.title, wildcard),
        like(opportunities.notes, wildcard)
      );
      if (searchCond) conditions.push(searchCond);
    }
    const rows = await this.db
      .select()
      .from(opportunities)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(opportunities.expectedCloseDate), asc(opportunities.id))
      .all();
    if (filter.openOnly) {
      return rows.filter((r) => !isTerminalOpportunityStage(r.stage as OpportunityStage));
    }
    return rows;
  }

  async findById(id: number): Promise<Opportunity | undefined> {
    return this.db.query.opportunities.findFirst({
      where: eq(opportunities.id, id),
    });
  }

  async create(
    input: CreateOpportunityDto,
    defaultOwnerId: number
  ): Promise<Opportunity> {
    const { ownerId, stage, ...rest } = input;
    const [row] = await this.db
      .insert(opportunities)
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
      .update(opportunities)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(opportunities.id, id))
      .returning();
    return row;
  }

  async close(id: number, input: CloseOpportunityDto): Promise<Opportunity> {
    const current = await this.findById(id);
    if (!current) throw new NotFoundException(`Opportunity ${id} not found`);
    const [row] = await this.db
      .update(opportunities)
      .set({
        stage: input.outcome,
        closedAt: new Date(),
        lossReason: input.outcome === 'lost' ? (input.lossReason ?? null) : null,
        updatedAt: new Date(),
      })
      .where(eq(opportunities.id, id))
      .returning();
    return row;
  }

  async pipelineSummary(ownerId?: number): Promise<StageSummary[]> {
    const conditions = [];
    if (ownerId !== undefined) {
      conditions.push(eq(opportunities.ownerId, ownerId));
    }
    const rows = await this.db
      .select({
        stage: opportunities.stage,
        count: sql<number>`count(*)`.as('count'),
        totalValue: sql<number>`coalesce(sum(${opportunities.estimatedValue}), 0)`.as(
          'total_value'
        ),
        weightedValue: sql<number>`coalesce(sum(${opportunities.estimatedValue} * coalesce(${opportunities.probability}, 0) / 100.0), 0)`.as(
          'weighted_value'
        ),
      })
      .from(opportunities)
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(opportunities.stage)
      .all();
    return rows.map((r) => ({
      stage: r.stage,
      count: Number(r.count ?? 0),
      totalValue: Number(r.totalValue ?? 0),
      weightedValue: Number(r.weightedValue ?? 0),
    }));
  }
}
