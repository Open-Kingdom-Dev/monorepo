import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { ConfigurableLookupsController } from './configurable-lookups.controller';
import { ConfigurableLookupsService } from './configurable-lookups.service';

describe('ConfigurableLookupsController', () => {
  let controller: ConfigurableLookupsController;
  let service: jest.Mocked<ConfigurableLookupsService>;

  const entry = {
    id: 1,
    listKey: 'opportunity_stage',
    value: 'discovery',
    label: 'Discovery',
    sortOrder: 1,
    isSystem: 0,
    isActive: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findByListKey: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ConfigurableLookupsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigurableLookupsController],
      providers: [{ provide: ConfigurableLookupsService, useValue: service }],
    }).compile();

    controller = module.get(ConfigurableLookupsController);
  });

  it('lists everything when no listKey is provided', async () => {
    service.findAll.mockResolvedValue([entry]);
    await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
  });

  it('filters by listKey and forwards includeInactive=true', async () => {
    service.findByListKey.mockResolvedValue([entry]);
    await controller.findAll('opportunity_stage', 'true');
    expect(service.findByListKey).toHaveBeenCalledWith('opportunity_stage', {
      includeInactive: true,
    });
  });

  it('gets one entry by id', async () => {
    service.findById.mockResolvedValue(entry);
    const result = await controller.findOne(1);
    expect(result).toEqual(entry);
  });

  it('creates an entry', async () => {
    service.create.mockResolvedValue(entry);
    const dto = {
      listKey: 'opportunity_stage',
      value: 'discovery',
      label: 'Discovery',
    };
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('updates an entry', async () => {
    service.update.mockResolvedValue({ ...entry, label: 'Updated' });
    const result = await controller.update(1, { label: 'Updated' });
    expect(result.label).toBe('Updated');
    expect(service.update).toHaveBeenCalledWith(1, { label: 'Updated' });
  });

  it('deletes an entry', async () => {
    service.delete.mockResolvedValue(undefined);
    await controller.delete(1);
    expect(service.delete).toHaveBeenCalledWith(1);
  });

  it('propagates NotFoundException from the service', async () => {
    service.findById.mockRejectedValue(new NotFoundException());
    await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
  });
});
