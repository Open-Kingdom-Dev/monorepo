import { Test, TestingModule } from '@nestjs/testing';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import { LeadsService } from './leads.service';

describe('LeadsService', () => {
  let service: LeadsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockQuery: any;

  const row = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 1,
    name: 'Jane',
    companyName: 'Acme',
    email: 'jane@acme.com',
    phone: null,
    source: null,
    status: 'new',
    notes: null,
    contactId: null,
    companyId: null,
    convertedAt: null,
    convertedToContactId: null,
    convertedToCompanyId: null,
    ownerId: 42,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    mockQuery = { leads: { findFirst: jest.fn() } };
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
            returning: jest
              .fn()
              .mockResolvedValue([row({ status: 'qualified' })]),
          })),
        })),
      })),
      delete: jest.fn(() => ({ where: jest.fn().mockResolvedValue(undefined) })),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: DB_TAG, useValue: mockDb as BetterSQLite3Database<never> },
      ],
    }).compile();
    service = module.get(LeadsService);
  });

  it('lists leads with filters', async () => {
    await service.findAll({ ownerId: 42, status: 'new', search: 'acme' });
    expect(mockDb.select).toHaveBeenCalled();
  });

  it('lists leads with no filters', async () => {
    await service.findAll();
    expect(mockDb.select).toHaveBeenCalled();
  });

  it('creates a lead when email is provided', async () => {
    const result = await service.create(
      { name: 'Jane', email: 'jane@acme.com' },
      42
    );
    expect(result.name).toBe('Jane');
  });

  it('creates a lead when phone is provided', async () => {
    const result = await service.create({ name: 'Jane', phone: '555' }, 42);
    expect(result.name).toBe('Jane');
  });

  it('rejects lead creation when neither email nor phone is provided', async () => {
    await expect(service.create({ name: 'Jane' }, 42)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it('updates an existing lead', async () => {
    mockQuery.leads.findFirst.mockResolvedValue(row());
    const r = await service.update(1, { status: 'contacted' });
    expect(r.status).toBe('qualified');
  });

  it('update throws when missing', async () => {
    mockQuery.leads.findFirst.mockResolvedValue(undefined);
    await expect(service.update(99, {})).rejects.toBeInstanceOf(NotFoundException);
  });

  it('markConverted stamps converted fields and sets status to qualified', async () => {
    mockQuery.leads.findFirst.mockResolvedValue(row());
    const r = await service.markConverted(1, 10, 20);
    expect(r.status).toBe('qualified');
  });

  it('markConverted throws when missing', async () => {
    mockQuery.leads.findFirst.mockResolvedValue(undefined);
    await expect(service.markConverted(99, 1, 2)).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('deletes an existing lead', async () => {
    mockQuery.leads.findFirst.mockResolvedValue(row());
    await service.delete(1);
    expect(mockDb.delete).toHaveBeenCalled();
  });

  it('delete throws when missing', async () => {
    mockQuery.leads.findFirst.mockResolvedValue(undefined);
    await expect(service.delete(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findById delegates to drizzle query helper', async () => {
    mockQuery.leads.findFirst.mockResolvedValue(row());
    const r = await service.findById(1);
    expect(r?.id).toBe(1);
  });
});
