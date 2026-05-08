import {
  Controller,
  ForbiddenException,
  Get,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RequirePermission } from '@open-kingdom/shared-backend-util-rbac';

import { DashboardService } from '../services/dashboard.service';
import { DashboardSnapshotDto } from '../dtos/dashboard.dto';

interface AuthenticatedRequest {
  user?: { id: number };
}

@ApiTags('CRM Dashboard')
@Controller('crm/dashboard')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @RequirePermission('opportunities', 'read')
  @ApiOperation({ summary: 'Snapshot of the current user’s pipeline and tasks' })
  @ApiResponse({ status: 200, type: DashboardSnapshotDto })
  async snapshot(@Req() req: AuthenticatedRequest): Promise<DashboardSnapshotDto> {
    const userId = req.user?.id;
    if (!userId) throw new ForbiddenException('Missing authenticated user');
    return this.dashboard.snapshotForUser(userId);
  }
}
