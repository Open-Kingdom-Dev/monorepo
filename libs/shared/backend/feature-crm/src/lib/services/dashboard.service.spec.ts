import { Test, TestingModule } from '@nestjs/testing';

import { ActivityLogService } from '@open-kingdom/shared-backend-data-access-activity-log';
import { OpportunitiesService } from '@open-kingdom/shared-backend-data-access-opportunities';

import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let opportunities: jest.Mocked<OpportunitiesService>;
  let activities: jest.Mocked<ActivityLogService>;

  beforeEach(async () => {
    opportunities = {
      pipelineSummary: jest.fn(),
    } as unknown as jest.Mocked<OpportunitiesService>;
    activities = {
      findOpenForOwner: jest.fn(),
      findOverdueForOwner: jest.fn(),
    } as unknown as jest.Mocked<ActivityLogService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: OpportunitiesService, useValue: opportunities },
        { provide: ActivityLogService, useValue: activities },
      ],
    }).compile();
    service = module.get(DashboardService);
  });

  it('assembles a snapshot for the current user', async () => {
    opportunities.pipelineSummary.mockResolvedValue([
      { stage: 'discovery', count: 3, totalValue: 30000, weightedValue: 15000 },
    ]);
    activities.findOpenForOwner.mockResolvedValue([{} as never, {} as never]);
    activities.findOverdueForOwner.mockResolvedValue([{} as never]);

    const snap = await service.snapshotForUser(42);

    expect(opportunities.pipelineSummary).toHaveBeenCalledWith(42);
    expect(activities.findOpenForOwner).toHaveBeenCalledWith(42);
    expect(activities.findOverdueForOwner).toHaveBeenCalledWith(42);
    expect(snap.pipeline).toHaveLength(1);
    expect(snap.tasksOpen).toBe(2);
    expect(snap.tasksOverdue).toBe(1);
  });
});
