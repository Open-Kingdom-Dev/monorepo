import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

describe('ContactsController', () => {
  let controller: ContactsController;
  let service: jest.Mocked<ContactsService>;
  const req = { user: { id: 42 } };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
      restore: jest.fn(),
    } as unknown as jest.Mocked<ContactsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [{ provide: ContactsService, useValue: service }],
    }).compile();
    controller = module.get(ContactsController);
  });

  it('forwards list filters including companyId', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll('42', '7', 'active', 'jane', '1');
    expect(service.findAll).toHaveBeenCalledWith({
      ownerId: 42,
      companyId: 7,
      status: 'active',
      search: 'jane',
      includeArchived: true,
    });
  });

  it('list with no filters yields undefined ids and false includeArchived', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll();
    expect(service.findAll).toHaveBeenCalledWith({
      ownerId: undefined,
      companyId: undefined,
      status: undefined,
      search: undefined,
      includeArchived: false,
    });
  });

  it('list accepts includeArchived=true as truthy', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll(
      undefined,
      undefined,
      undefined,
      undefined,
      'true'
    );
    expect(service.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ includeArchived: true })
    );
  });

  it('creates with the authenticated user as owner', async () => {
    service.create.mockResolvedValue({} as never);
    await controller.create(req, { firstName: 'Jane', lastName: 'Doe' });
    expect(service.create).toHaveBeenCalledWith(
      { firstName: 'Jane', lastName: 'Doe' },
      42
    );
  });

  it('rejects create without authenticated user', async () => {
    await expect(
      controller.create({}, { firstName: 'Jane', lastName: 'Doe' })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('delegates findOne, update, archive, restore', async () => {
    service.findById.mockResolvedValue({} as never);
    service.update.mockResolvedValue({} as never);
    service.archive.mockResolvedValue({} as never);
    service.restore.mockResolvedValue({} as never);
    await controller.findOne(1);
    await controller.update(1, { firstName: 'x' });
    await controller.archive(1);
    await controller.restore(1);
    expect(service.findById).toHaveBeenCalledWith(1);
    expect(service.update).toHaveBeenCalledWith(1, { firstName: 'x' });
    expect(service.archive).toHaveBeenCalledWith(1);
    expect(service.restore).toHaveBeenCalledWith(1);
  });
});
