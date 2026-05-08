import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from '../services/dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let dashboard: jest.Mocked<DashboardService>;

  beforeEach(async () => {
    dashboard = {
      snapshotForUser: jest.fn(),
    } as unknown as jest.Mocked<DashboardService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: dashboard }],
    }).compile();
    controller = module.get(DashboardController);
  });

  it('returns a snapshot for the authenticated user', async () => {
    dashboard.snapshotForUser.mockResolvedValue({
      pipeline: [],
      tasksOpen: 0,
      tasksOverdue: 0,
    });
    await controller.snapshot({ user: { id: 42 } });
    expect(dashboard.snapshotForUser).toHaveBeenCalledWith(42);
  });

  it('rejects requests with no authenticated user', async () => {
    await expect(controller.snapshot({})).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });
});
