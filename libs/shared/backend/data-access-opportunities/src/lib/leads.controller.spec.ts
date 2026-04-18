import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

describe('LeadsController', () => {
  let controller: LeadsController;
  let service: jest.Mocked<LeadsService>;
  const req = { user: { id: 42 } };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<LeadsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadsController],
      providers: [{ provide: LeadsService, useValue: service }],
    }).compile();
    controller = module.get(LeadsController);
  });

  it('forwards list filters', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll('42', 'new', 'jane');
    expect(service.findAll).toHaveBeenCalledWith({
      ownerId: 42,
      status: 'new',
      search: 'jane',
    });
  });

  it('list with no filters passes undefined ownerId', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll();
    expect(service.findAll).toHaveBeenCalledWith({
      ownerId: undefined,
      status: undefined,
      search: undefined,
    });
  });

  it('creates with the authenticated user as owner', async () => {
    service.create.mockResolvedValue({} as never);
    await controller.create(req, { name: 'Jane', email: 'j@a.com' });
    expect(service.create).toHaveBeenCalledWith(
      { name: 'Jane', email: 'j@a.com' },
      42
    );
  });

  it('rejects create without authenticated user', async () => {
    await expect(
      controller.create({}, { name: 'Jane', email: 'j@a.com' })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('delegates findOne, update, delete', async () => {
    service.findById.mockResolvedValue({} as never);
    service.update.mockResolvedValue({} as never);
    service.delete.mockResolvedValue(undefined);
    await controller.findOne(1);
    await controller.update(1, { status: 'contacted' });
    await controller.delete(1);
    expect(service.findById).toHaveBeenCalledWith(1);
    expect(service.update).toHaveBeenCalledWith(1, { status: 'contacted' });
    expect(service.delete).toHaveBeenCalledWith(1);
  });
});
