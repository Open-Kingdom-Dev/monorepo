import { Test, TestingModule } from '@nestjs/testing';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { NotFoundException } from '@nestjs/common';

import { DB_TAG, SCHEMA_TAG } from '@open-kingdom/shared-poly-util-constants';
import { companies, contacts } from './schemas';
import { ContactsService } from './contacts.service';

describe('ContactsService', () => {
  let service: ContactsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockQuery: any;

  const row = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 1,
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    phone: null,
    secondaryPhone: null,
    secondaryEmail: null,
    jobTitle: null,
    companyId: null,
    leadSource: null,
    tags: null,
    mailingAddress: null,
    notesSummary: null,
    status: 'active',
    ownerId: 42,
    isArchived: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    mockQuery = { contacts: { findFirst: jest.fn() } };
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
              .mockResolvedValue([row({ firstName: 'Updated' })]),
          })),
        })),
      })),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        { provide: DB_TAG, useValue: mockDb as BetterSQLite3Database<never> },
        { provide: SCHEMA_TAG, useValue: { companies, contacts } },
      ],
    }).compile();
    service = module.get(ContactsService);
  });

  it('lists active contacts by default', async () => {
    const result = await service.findAll();
    expect(result).toHaveLength(1);
  });

  it('applies filters including companyId and search', async () => {
    await service.findAll({
      ownerId: 42,
      companyId: 7,
      status: 'active',
      search: 'jane',
      includeArchived: true,
    });
    expect(mockDb.select).toHaveBeenCalled();
  });

  it('finds by id via drizzle query helper', async () => {
    mockQuery.contacts.findFirst.mockResolvedValue(row());
    const r = await service.findById(1);
    expect(r?.id).toBe(1);
  });

  it('creates a contact, defaulting ownerId', async () => {
    const result = await service.create(
      { firstName: 'Jane', lastName: 'Doe' },
      42
    );
    expect(result.firstName).toBe('Jane');
  });

  it('throws NotFoundException when updating a missing contact', async () => {
    mockQuery.contacts.findFirst.mockResolvedValue(undefined);
    await expect(service.update(99, { firstName: 'x' })).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('updates an existing contact', async () => {
    mockQuery.contacts.findFirst.mockResolvedValue(row());
    const r = await service.update(1, { firstName: 'Updated' });
    expect(r.firstName).toBe('Updated');
  });

  it('archives and restores', async () => {
    mockQuery.contacts.findFirst.mockResolvedValue(row());
    await service.archive(1);
    await service.restore(1);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it('archive/restore throw NotFound when missing', async () => {
    mockQuery.contacts.findFirst.mockResolvedValue(undefined);
    await expect(service.archive(1)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.restore(1)).rejects.toBeInstanceOf(NotFoundException);
  });
});
