import { Injectable } from '@nestjs/common';

import { ActivityLogService } from '@open-kingdom/shared-backend-data-access-activity-log';
import {
  OpportunitiesService,
  type StageSummary,
} from '@open-kingdom/crm-backend-data-access-opportunities';

export interface DashboardSnapshot {
  pipeline: StageSummary[];
  tasksOpen: number;
  tasksOverdue: number;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly opportunities: OpportunitiesService,
    private readonly activities: ActivityLogService
  ) {}

  async snapshotForUser(userId: number): Promise<DashboardSnapshot> {
    const [pipeline, open, overdue] = await Promise.all([
      this.opportunities.pipelineSummary(userId),
      this.activities.findOpenForOwner(userId),
      this.activities.findOverdueForOwner(userId),
    ]);
    return {
      pipeline,
      tasksOpen: open.length,
      tasksOverdue: overdue.length,
    };
  }
}
