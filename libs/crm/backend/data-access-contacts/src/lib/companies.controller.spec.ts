import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

describe('CompaniesController', () => {
  let controller: CompaniesController;
  let service: jest.Mocked<CompaniesService>;
  const req = { user: { id: 42 } };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
      restore: jest.fn(),
    } as unknown as jest.Mocked<CompaniesService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [{ provide: CompaniesService, useValue: service }],
    }).compile();
    controller = module.get(CompaniesController);
  });

  it('forwards list filters to the service', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll('42', 'active', 'acme', 'true');
    expect(service.findAll).toHaveBeenCalledWith({
      ownerId: 42,
      status: 'active',
      search: 'acme',
      includeArchived: true,
    });
  });

  it('list with no filters yields undefined ownerId and false includeArchived', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll();
    expect(service.findAll).toHaveBeenCalledWith({
      ownerId: undefined,
      status: undefined,
      search: undefined,
      includeArchived: false,
    });
  });

  it('list accepts includeArchived=1 as truthy', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll(undefined, undefined, undefined, '1');
    expect(service.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ includeArchived: true })
    );
  });

  it('creates with the authenticated user as owner', async () => {
    service.create.mockResolvedValue({} as never);
    await controller.create(req, { name: 'Acme' });
    expect(service.create).toHaveBeenCalledWith({ name: 'Acme' }, 42);
  });

  it('rejects create without authenticated user', async () => {
    await expect(controller.create({}, { name: 'Acme' })).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  it('delegates findOne, update, archive, restore', async () => {
    service.findById.mockResolvedValue({} as never);
    service.update.mockResolvedValue({} as never);
    service.archive.mockResolvedValue({} as never);
    service.restore.mockResolvedValue({} as never);
    await controller.findOne(1);
    await controller.update(1, { name: 'n' });
    await controller.archive(1);
    await controller.restore(1);
    expect(service.findById).toHaveBeenCalledWith(1);
    expect(service.update).toHaveBeenCalledWith(1, { name: 'n' });
    expect(service.archive).toHaveBeenCalledWith(1);
    expect(service.restore).toHaveBeenCalledWith(1);
  });
});
