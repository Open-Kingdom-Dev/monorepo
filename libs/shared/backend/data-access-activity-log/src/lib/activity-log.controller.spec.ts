import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import { ActivityLogController } from './activity-log.controller';
import { ActivityLogService } from './activity-log.service';

describe('ActivityLogController', () => {
  let controller: ActivityLogController;
  let service: jest.Mocked<ActivityLogService>;

  const req = { user: { id: 7 } };

  beforeEach(async () => {
    service = {
      isAllowedRelatedType: jest.fn().mockReturnValue(true),
      isAllowedActivityType: jest.fn().mockReturnValue(true),
      findForRecord: jest.fn(),
      findOpenForOwner: jest.fn(),
      findOverdueForOwner: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      complete: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ActivityLogService>;
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityLogController],
      providers: [{ provide: ActivityLogService, useValue: service }],
    }).compile();
    controller = module.get(ActivityLogController);
  });

  it('scopes list to a related record when relatedType and relatedId are provided', async () => {
    service.findForRecord.mockResolvedValue([]);
    await controller.findAll(req, 'contact', '10');
    expect(service.findForRecord).toHaveBeenCalledWith('contact', 10);
  });

  it('rejects an invalid relatedType', async () => {
    service.isAllowedRelatedType.mockReturnValueOnce(false);
    await expect(controller.findAll(req, 'horse', '10')).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  it('defaults to open activities for the current user', async () => {
    service.findOpenForOwner.mockResolvedValue([]);
    await controller.findAll(req);
    expect(service.findOpenForOwner).toHaveBeenCalledWith(7);
  });

  it('returns overdue activities when scope=overdue', async () => {
    service.findOverdueForOwner.mockResolvedValue([]);
    await controller.findAll(req, undefined, undefined, 'overdue');
    expect(service.findOverdueForOwner).toHaveBeenCalledWith(7);
  });

  it('throws ForbiddenException when request has no authenticated user', async () => {
    await expect(controller.findAll({})).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  it('creates an activity owned by the current user', async () => {
    service.create.mockResolvedValue({} as never);
    const dto = {
      relatedType: 'contact' as const,
      relatedId: 1,
      type: 'note' as const,
      subject: 'hi',
    };
    await controller.create(req, dto);
    expect(service.create).toHaveBeenCalledWith(dto, 7);
  });

  it('rejects create without authenticated user', async () => {
    await expect(
      controller.create(
        {},
        {
          relatedType: 'contact',
          relatedId: 1,
          type: 'note',
          subject: 'hi',
        }
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('finds, updates, completes, and deletes', async () => {
    service.findById.mockResolvedValue({} as never);
    await controller.findOne(1);
    service.update.mockResolvedValue({} as never);
    await controller.update(1, { subject: 'x' });
    service.complete.mockResolvedValue({} as never);
    await controller.complete(1, {});
    service.delete.mockResolvedValue(undefined);
    await controller.delete(1);
    expect(service.findById).toHaveBeenCalledWith(1);
    expect(service.update).toHaveBeenCalledWith(1, { subject: 'x' });
    expect(service.complete).toHaveBeenCalledWith(1, {});
    expect(service.delete).toHaveBeenCalledWith(1);
  });
});
