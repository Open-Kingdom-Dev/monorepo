import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesService } from './opportunities.service';

describe('OpportunitiesController', () => {
  let controller: OpportunitiesController;
  let service: jest.Mocked<OpportunitiesService>;
  const req = { user: { id: 42 } };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      close: jest.fn(),
      pipelineSummary: jest.fn(),
    } as unknown as jest.Mocked<OpportunitiesService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OpportunitiesController],
      providers: [{ provide: OpportunitiesService, useValue: service }],
    }).compile();
    controller = module.get(OpportunitiesController);
  });

  it('forwards list filters', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll('42', '10', 'discovery', 'acme', 'true');
    expect(service.findAll).toHaveBeenCalledWith({
      ownerId: 42,
      companyId: 10,
      stage: 'discovery',
      search: 'acme',
      openOnly: true,
    });
  });

  it('list with no filters yields undefined ids and false openOnly', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll();
    expect(service.findAll).toHaveBeenCalledWith({
      ownerId: undefined,
      companyId: undefined,
      stage: undefined,
      search: undefined,
      openOnly: false,
    });
  });

  it('list accepts openOnly=1 as truthy', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll(undefined, undefined, undefined, undefined, '1');
    expect(service.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ openOnly: true })
    );
  });

  it('pipelineSummary forwards ownerId', async () => {
    service.pipelineSummary.mockResolvedValue([]);
    await controller.pipelineSummary('42');
    expect(service.pipelineSummary).toHaveBeenCalledWith(42);
  });

  it('pipelineSummary with no ownerId passes undefined', async () => {
    service.pipelineSummary.mockResolvedValue([]);
    await controller.pipelineSummary();
    expect(service.pipelineSummary).toHaveBeenCalledWith(undefined);
  });

  it('creates with the authenticated user as owner', async () => {
    service.create.mockResolvedValue({} as never);
    await controller.create(req, { title: 'X', companyId: 10 });
    expect(service.create).toHaveBeenCalledWith(
      { title: 'X', companyId: 10 },
      42
    );
  });

  it('rejects create without authenticated user', async () => {
    await expect(
      controller.create({}, { title: 'X', companyId: 10 })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('delegates findOne, update, close', async () => {
    service.findById.mockResolvedValue({} as never);
    service.update.mockResolvedValue({} as never);
    service.close.mockResolvedValue({} as never);
    await controller.findOne(1);
    await controller.update(1, { stage: 'proposal' });
    await controller.close(1, { outcome: 'won' });
    expect(service.findById).toHaveBeenCalledWith(1);
    expect(service.update).toHaveBeenCalledWith(1, { stage: 'proposal' });
    expect(service.close).toHaveBeenCalledWith(1, { outcome: 'won' });
  });
});
