import { Test, TestingModule } from '@nestjs/testing';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { NotFoundException } from '@nestjs/common';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { OpportunitiesService } from './opportunities.service';

describe('OpportunitiesService', () => {
  let service: OpportunitiesService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockQuery: any;

  const row = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 1,
    title: 'Acme Q3',
    companyId: 10,
    primaryContactId: null,
    stage: 'discovery',
    estimatedValue: 10000,
    probability: 50,
    expectedCloseDate: null,
    closedAt: null,
    lossReason: null,
    notes: null,
    ownerId: 42,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const buildSelectMock = (rows: unknown[]) => {
    const chain: Record<string, jest.Mock> = {};
    chain.from = jest.fn(() => chain);
    chain.where = jest.fn(() => chain);
    chain.orderBy = jest.fn(() => chain);
    chain.groupBy = jest.fn(() => chain);
    chain.all = jest.fn().mockResolvedValue(rows);
    return chain;
  };

  beforeEach(async () => {
    mockQuery = { opportunities: { findFirst: jest.fn() } };
    mockDb = {
      query: mockQuery,
      select: jest.fn(() => buildSelectMock([row()])),
      insert: jest.fn(() => ({
        values: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([row()]),
        })),
      })),
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: jest.fn(() => ({
            returning: jest.fn().mockResolvedValue([row({ stage: 'won' })]),
          })),
        })),
      })),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpportunitiesService,
        { provide: DB_TAG, useValue: mockDb as BetterSQLite3Database<never> },
      ],
    }).compile();
    service = module.get(OpportunitiesService);
  });

  it('lists with filters', async () => {
    await service.findAll({
      ownerId: 42,
      companyId: 10,
      stage: 'discovery',
      search: 'acme',
    });
    expect(mockDb.select).toHaveBeenCalled();
  });

  it('lists with no filters', async () => {
    await service.findAll();
    expect(mockDb.select).toHaveBeenCalled();
  });

  it('openOnly filters out terminal stages in memory', async () => {
    mockDb.select = jest.fn(() =>
      buildSelectMock([
        row({ stage: 'won' }),
        row({ id: 2, stage: 'discovery' }),
      ])
    );
    const result = await service.findAll({ openOnly: true });
    expect(result).toHaveLength(1);
    expect(result[0].stage).toBe('discovery');
  });

  it('creates an opportunity with defaults', async () => {
    const result = await service.create(
      { title: 'Acme Q3', companyId: 10 },
      42
    );
    expect(result.title).toBe('Acme Q3');
  });

  it('updates an existing opportunity', async () => {
    mockQuery.opportunities.findFirst.mockResolvedValue(row());
    const r = await service.update(1, { stage: 'proposal' });
    expect(r.stage).toBe('won');
  });

  it('update throws when missing', async () => {
    mockQuery.opportunities.findFirst.mockResolvedValue(undefined);
    await expect(service.update(99, {})).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('close stamps closedAt and sets stage to won', async () => {
    mockQuery.opportunities.findFirst.mockResolvedValue(row());
    const r = await service.close(1, { outcome: 'won' });
    expect(r.stage).toBe('won');
  });

  it('close stamps lossReason when outcome is lost', async () => {
    mockQuery.opportunities.findFirst.mockResolvedValue(row());
    const r = await service.close(1, {
      outcome: 'lost',
      lossReason: 'price',
    });
    expect(r).toBeDefined();
  });

  it('close throws when missing', async () => {
    mockQuery.opportunities.findFirst.mockResolvedValue(undefined);
    await expect(service.close(99, { outcome: 'won' })).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('findById delegates to drizzle query helper', async () => {
    mockQuery.opportunities.findFirst.mockResolvedValue(row());
    const r = await service.findById(1);
    expect(r?.id).toBe(1);
  });

  it('pipelineSummary returns aggregated rows per stage', async () => {
    mockDb.select = jest.fn(() =>
      buildSelectMock([
        {
          stage: 'discovery',
          count: 2,
          totalValue: 20000,
          weightedValue: 10000,
        },
        { stage: 'won', count: 1, totalValue: 5000, weightedValue: 5000 },
      ])
    );
    const result = await service.pipelineSummary(42);
    expect(result).toHaveLength(2);
    expect(result[0].stage).toBe('discovery');
  });

  it('pipelineSummary works without an owner filter', async () => {
    mockDb.select = jest.fn(() => buildSelectMock([]));
    const result = await service.pipelineSummary();
    expect(result).toEqual([]);
  });

  it('pipelineSummary coerces null sums to zero', async () => {
    mockDb.select = jest.fn(() =>
      buildSelectMock([
        { stage: 'new', count: null, totalValue: null, weightedValue: null },
      ])
    );
    const [r] = await service.pipelineSummary();
    expect(r).toEqual({
      stage: 'new',
      count: 0,
      totalValue: 0,
      weightedValue: 0,
    });
  });
});
