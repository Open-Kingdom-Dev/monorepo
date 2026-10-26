import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@open-kingdom/shared-backend-util-rbac';
import { PortLeaseService } from './port-lease.service';
import { PortLeaseStatusDto } from './port-lease.dto';

@ApiTags('Port Lease')
@Controller('port-lease')
export class PortLeaseController {
  constructor(private readonly portLeaseService: PortLeaseService) {}

  @Public()
  @Get('status')
  @ApiOperation({
    summary: 'Get worktree port lease',
    description:
      'Leases this checkout’s slot and returns the ports the demo stack would use in it, whether each is already bound, and every slot leased in this clone.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lease resolved',
    type: PortLeaseStatusDto,
  })
  async getStatus(): Promise<PortLeaseStatusDto> {
    return await this.portLeaseService.status();
  }
}
