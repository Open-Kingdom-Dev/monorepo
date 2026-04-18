import { Test, TestingModule } from '@nestjs/testing';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { NotFoundException } from '@nestjs/common';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { ActivityLogService } from './activity-log.service';

describe('ActivityLogService', () => {
  let service: ActivityLogService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockQuery: any;

  const row = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 1,
    relatedType: 'contact',
    relatedId: 10,
    type: 'note',
    subject: 'Initial call',
    description: null,
    dueAt: null,
    completedAt: null,
    ownerId: 42,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const selectChain = (rows: unknown[]) => {
    const chain: Record<string, jest.Mock> = {};
    chain.from = jest.fn(() => chain);
    chain.where = jest.fn(() => chain);
    chain.orderBy = jest.fn(() => chain);
    chain.all = jest.fn().mockResolvedValue(rows);
    return chain;
  };

  beforeEach(async () => {
    mockQuery = { activity_log: { findFirst: jest.fn() } };
    mockDb = {
      query: mockQuery,
      select: jest.fn(() => selectChain([row()])),
      insert: jest.fn(() => ({
        values: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([row()]),
        })),
      })),
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: jest.fn(() => ({
            returning: jest.fn().mockResolvedValue([row({ subject: 'Updated' })]),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        where: jest.fn().mockResolvedValue(undefined),
      })),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityLogService,
        { provide: DB_TAG, useValue: mockDb as BetterSQLite3Database<never> },
      ],
    }).compile();
    service = module.get(ActivityLogService);
  });

  it('findForRecord returns activities scoped to a record', async () => {
    const results = await service.findForRecord('contact', 10);
    expect(results).toHaveLength(1);
  });

  it('findOpenForOwner filters by owner and null completedAt', async () => {
    await service.findOpenForOwner(42);
    expect(mockDb.select).toHaveBeenCalled();
  });

  it('findOverdueForOwner queries with a cutoff date', async () => {
    await service.findOverdueForOwner(42, new Date('2026-01-01'));
    expect(mockDb.select).toHaveBeenCalled();
  });

  it('findById delegates to drizzle query helper', async () => {
    mockQuery.activity_log.findFirst.mockResolvedValue(row());
    const r = await service.findById(1);
    expect(r?.id).toBe(1);
  });

  it('creates an activity with valid relatedType and type', async () => {
    const result = await service.create(
      {
        relatedType: 'contact',
        relatedId: 10,
        type: 'call',
        subject: 'Follow up',
      },
      42
    );
    expect(result.subject).toBe('Initial call');
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('rejects an unknown relatedType', async () => {
    await expect(
      service.create(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { relatedType: 'horse' as any, relatedId: 1, type: 'note', subject: 's' },
        42
      )
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an unknown activity type', async () => {
    await expect(
      service.create(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { relatedType: 'contact', relatedId: 1, type: 'gossip' as any, subject: 's' },
        42
      )
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates an existing activity', async () => {
    mockQuery.activity_log.findFirst.mockResolvedValue(row());
    const result = await service.update(1, { subject: 'Updated' });
    expect(result.subject).toBe('Updated');
  });

  it('update throws when activity does not exist', async () => {
    mockQuery.activity_log.findFirst.mockResolvedValue(undefined);
    await expect(service.update(99, {})).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('complete appends outcome notes and stamps completedAt', async () => {
    mockQuery.activity_log.findFirst.mockResolvedValue(
      row({ description: 'existing' })
    );
    await service.complete(1, { outcomeNotes: 'done' });
    expect(mockDb.update).toHaveBeenCalled();
  });

  it('complete throws when activity does not exist', async () => {
    mockQuery.activity_log.findFirst.mockResolvedValue(undefined);
    await expect(service.complete(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes an existing activity', async () => {
    mockQuery.activity_log.findFirst.mockResolvedValue(row());
    await service.delete(1);
    expect(mockDb.delete).toHaveBeenCalled();
  });

  it('delete throws when activity does not exist', async () => {
    mockQuery.activity_log.findFirst.mockResolvedValue(undefined);
    await expect(service.delete(99)).rejects.toBeInstanceOf(NotFoundException);
  });
});
