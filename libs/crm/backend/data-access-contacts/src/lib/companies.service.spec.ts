import { Test, TestingModule } from '@nestjs/testing';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { DB_TAG, SCHEMA_TAG } from '@open-kingdom/shared-poly-util-constants';
import { companies, contacts } from './schemas';
import { CompaniesService } from './companies.service';

describe('CompaniesService', () => {
  let service: CompaniesService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockQuery: any;

  const row = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 1,
    name: 'Acme',
    website: null,
    primaryPhone: null,
    industry: null,
    status: 'active',
    location: null,
    companySize: null,
    revenueRange: null,
    notesSummary: null,
    ownerId: 42,
    isArchived: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    mockQuery = { companies: { findFirst: jest.fn() } };
    const selectChain = () => {
      const chain: Record<string, jest.Mock> = {};
      chain.from = jest.fn(() => chain);
      chain.where = jest.fn(() => chain);
      chain.orderBy = jest.fn(() => chain);
      chain.all = jest.fn().mockResolvedValue([row()]);
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
            returning: jest.fn().mockResolvedValue([row({ name: 'Updated' })]),
          })),
        })),
      })),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: DB_TAG, useValue: mockDb as BetterSQLite3Database<never> },
        { provide: SCHEMA_TAG, useValue: { companies, contacts } },
      ],
    }).compile();
    service = module.get(CompaniesService);
  });

  it('lists active companies by default', async () => {
    const result = await service.findAll();
    expect(result).toHaveLength(1);
  });

  it('applies owner/status/search filters and includeArchived flag', async () => {
    await service.findAll({
      ownerId: 42,
      status: 'active',
      search: 'acme',
      includeArchived: true,
    });
    expect(mockDb.select).toHaveBeenCalled();
  });

  it('finds by id via drizzle query helper', async () => {
    mockQuery.companies.findFirst.mockResolvedValue(row());
    const r = await service.findById(1);
    expect(r?.id).toBe(1);
  });

  it('creates a company, defaulting ownerId to the authenticated user', async () => {
    const result = await service.create({ name: 'Acme' }, 42);
    expect(result.name).toBe('Acme');
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('throws NotFoundException when updating a missing company', async () => {
    mockQuery.companies.findFirst.mockResolvedValue(undefined);
    await expect(service.update(99, { name: 'x' })).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('updates an existing company', async () => {
    mockQuery.companies.findFirst.mockResolvedValue(row());
    const r = await service.update(1, { name: 'Updated' });
    expect(r.name).toBe('Updated');
  });

  it('archives and restores', async () => {
    mockQuery.companies.findFirst.mockResolvedValue(row());
    await service.archive(1);
    await service.restore(1);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it('assertOwnerOrAdmin returns the row when owner matches', async () => {
    mockQuery.companies.findFirst.mockResolvedValue(row({ ownerId: 42 }));
    const r = await service.assertOwnerOrAdmin(1, 42, false);
    expect(r.id).toBe(1);
  });

  it('assertOwnerOrAdmin throws Forbidden when non-admin and different owner', async () => {
    mockQuery.companies.findFirst.mockResolvedValue(row({ ownerId: 99 }));
    await expect(
      service.assertOwnerOrAdmin(1, 42, false)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('assertOwnerOrAdmin allows admins regardless of owner', async () => {
    mockQuery.companies.findFirst.mockResolvedValue(row({ ownerId: 99 }));
    const r = await service.assertOwnerOrAdmin(1, 42, true);
    expect(r.id).toBe(1);
  });

  it('archive/restore/assert throw NotFound when missing', async () => {
    mockQuery.companies.findFirst.mockResolvedValue(undefined);
    await expect(service.archive(1)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.restore(1)).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.assertOwnerOrAdmin(1, 42, true)
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
