import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RequirePermission } from '@open-kingdom/shared-backend-util-rbac';

import { OpportunitiesService } from './opportunities.service';
import {
  CloseOpportunityDto,
  CreateOpportunityDto,
  OpportunityDto,
  UpdateOpportunityDto,
} from './dtos';

interface AuthenticatedRequest {
  user?: { id: number };
}

@ApiTags('Opportunities')
@Controller('opportunities')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
export class OpportunitiesController {
  constructor(private readonly service: OpportunitiesService) {}

  @Get()
  @RequirePermission('opportunities', 'read')
  @ApiOperation({ summary: 'List opportunities' })
  @ApiResponse({ status: 200, type: [OpportunityDto] })
  async findAll(
    @Query('ownerId') ownerId?: string,
    @Query('companyId') companyId?: string,
    @Query('stage') stage?: string,
    @Query('search') search?: string,
    @Query('openOnly') openOnly?: string
  ) {
    return this.service.findAll({
      ownerId: ownerId ? Number(ownerId) : undefined,
      companyId: companyId ? Number(companyId) : undefined,
      stage,
      search,
      openOnly: openOnly === 'true' || openOnly === '1',
    });
  }

  @Get('pipeline-summary')
  @RequirePermission('opportunities', 'read')
  @ApiOperation({ summary: 'Get aggregated pipeline counts and values by stage' })
  async pipelineSummary(@Query('ownerId') ownerId?: string) {
    return this.service.pipelineSummary(
      ownerId ? Number(ownerId) : undefined
    );
  }

  @Get(':id')
  @RequirePermission('opportunities', 'read')
  @ApiOperation({ summary: 'Get an opportunity by id' })
  @ApiResponse({ status: 200, type: OpportunityDto })
  @ApiNotFoundResponse()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Post()
  @RequirePermission('opportunities', 'create')
  @ApiOperation({ summary: 'Create an opportunity' })
  @ApiResponse({ status: 201, type: OpportunityDto })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateOpportunityDto
  ) {
    const ownerId = req.user?.id;
    if (!ownerId) throw new ForbiddenException('Missing authenticated user');
    return this.service.create(dto, ownerId);
  }

  @Patch(':id')
  @RequirePermission('opportunities', 'update')
  @ApiOperation({ summary: 'Update an opportunity' })
  @ApiResponse({ status: 200, type: OpportunityDto })
  @ApiNotFoundResponse()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOpportunityDto
  ) {
    return this.service.update(id, dto);
  }

  @Post(':id/close')
  @RequirePermission('opportunities', 'update')
  @ApiOperation({ summary: 'Mark an opportunity as won or lost' })
  @ApiResponse({ status: 200, type: OpportunityDto })
  @ApiNotFoundResponse()
  async close(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CloseOpportunityDto
  ) {
    return this.service.close(id, dto);
  }
}
