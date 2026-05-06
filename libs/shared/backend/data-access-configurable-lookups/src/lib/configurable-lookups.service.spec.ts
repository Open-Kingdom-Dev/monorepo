import { Test, TestingModule } from '@nestjs/testing';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { ConfigurableLookupsService } from './configurable-lookups.service';

describe('ConfigurableLookupsService', () => {
  let service: ConfigurableLookupsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockQuery: any;

  const row = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 1,
    listKey: 'opportunity_stage',
    value: 'discovery',
    label: 'Discovery',
    sortOrder: 1,
    isSystem: 0,
    isActive: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    mockQuery = {
      configurableLookups: { findFirst: jest.fn() },
    };

    const selectChain = () => {
      const chain: Record<string, jest.Mock> = {};
      chain.from = jest.fn(() => chain);
      chain.where = jest.fn(() => chain);
      chain.orderBy = jest.fn(() => chain);
      chain.all = jest.fn();
      return chain;
    };

    mockDb = {
      query: mockQuery,
      select: jest.fn(() => selectChain()),
      insert: jest.fn(() => ({
        values: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([row()]),
        })),
      })),
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: jest.fn(() => ({
            returning: jest.fn().mockResolvedValue([row({ label: 'Updated' })]),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        where: jest.fn().mockResolvedValue(undefined),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurableLookupsService,
        { provide: DB_TAG, useValue: mockDb as BetterSQLite3Database<never> },
      ],
    }).compile();
    service = module.get(ConfigurableLookupsService);
  });

  it('creates a new lookup when none clashes', async () => {
    mockQuery.configurableLookups.findFirst.mockResolvedValue(undefined);
    const result = await service.create({
      listKey: 'opportunity_stage',
      value: 'discovery',
      label: 'Discovery',
    });
    expect(result.label).toBe('Discovery');
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('throws ConflictException when a lookup with the same listKey+value exists', async () => {
    mockQuery.configurableLookups.findFirst.mockResolvedValue(row());
    await expect(
      service.create({
        listKey: 'opportunity_stage',
        value: 'discovery',
        label: 'Dup',
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws NotFoundException when updating a missing lookup', async () => {
    mockQuery.configurableLookups.findFirst.mockResolvedValue(undefined);
    await expect(service.update(99, { label: 'x' })).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('forbids renaming the canonical value of a system lookup', async () => {
    mockQuery.configurableLookups.findFirst.mockResolvedValue(row({ isSystem: 1 }));
    await expect(
      service.update(1, { value: 'different' })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('forbids deactivating a system lookup', async () => {
    mockQuery.configurableLookups.findFirst.mockResolvedValue(row({ isSystem: 1 }));
    await expect(
      service.update(1, { isActive: false })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('forbids deleting a system lookup', async () => {
    mockQuery.configurableLookups.findFirst.mockResolvedValue(row({ isSystem: 1 }));
    await expect(service.delete(1)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('deletes non-system lookups', async () => {
    mockQuery.configurableLookups.findFirst.mockResolvedValue(row());
    await service.delete(1);
    expect(mockDb.delete).toHaveBeenCalled();
  });

  it('findByListKey returns active rows by default and includes inactive when asked', async () => {
    const allMock = jest
      .fn()
      .mockResolvedValueOnce([row(), row({ id: 2, isActive: 0 })])
      .mockResolvedValueOnce([row(), row({ id: 2, isActive: 0 })]);
    mockDb.select = jest.fn(() => ({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      all: allMock,
    }));
    const active = await service.findByListKey('lead_status');
    expect(active).toHaveLength(1);
    const full = await service.findByListKey('lead_status', {
      includeInactive: true,
    });
    expect(full).toHaveLength(2);
  });

  it('findAll returns all rows sorted', async () => {
    const all = jest.fn().mockResolvedValue([row(), row({ id: 2 })]);
    mockDb.select = jest.fn(() => ({
      from: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      all,
    }));
    const rows = await service.findAll();
    expect(rows).toHaveLength(2);
  });

  it('findById delegates to drizzle query helper', async () => {
    mockQuery.configurableLookups.findFirst.mockResolvedValue(row());
    const r = await service.findById(1);
    expect(r?.id).toBe(1);
  });

  it('findByListAndValue delegates to drizzle query helper', async () => {
    mockQuery.configurableLookups.findFirst.mockResolvedValue(row());
    const r = await service.findByListAndValue('opportunity_stage', 'discovery');
    expect(r?.value).toBe('discovery');
  });

  it('throws NotFoundException when deleting a missing lookup', async () => {
    mockQuery.configurableLookups.findFirst.mockResolvedValue(undefined);
    await expect(service.delete(1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates a non-system lookup with new listKey/value when no clash', async () => {
    mockQuery.configurableLookups.findFirst
      .mockResolvedValueOnce(row())
      .mockResolvedValueOnce(undefined);
    const result = await service.update(1, {
      listKey: 'lead_status',
      value: 'new',
      label: 'New',
    });
    expect(result.label).toBe('Updated');
  });

  it('throws ConflictException when update causes a listKey+value clash', async () => {
    mockQuery.configurableLookups.findFirst
      .mockResolvedValueOnce(row())
      .mockResolvedValueOnce(row({ id: 42 }));
    await expect(
      service.update(1, { value: 'different' })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('seedDefaults skips existing entries', async () => {
    mockQuery.configurableLookups.findFirst
      .mockResolvedValueOnce(row())
      .mockResolvedValueOnce(undefined);
    await service.seedDefaults([
      { listKey: 'lead_status', value: 'new', label: 'New' },
      { listKey: 'lead_status', value: 'contacted', label: 'Contacted' },
    ]);
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });
});
