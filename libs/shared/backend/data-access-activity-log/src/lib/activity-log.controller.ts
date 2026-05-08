import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
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
import {
  RelatedEntityType,
  isRelatedEntityType,
} from '@open-kingdom/crm-poly-util-domain';

import { ActivityLogService } from './activity-log.service';
import {
  ActivityLogEntryDto,
  CompleteActivityLogEntryDto,
  CreateActivityLogEntryDto,
  UpdateActivityLogEntryDto,
} from './dtos';

interface AuthenticatedRequest {
  user?: { id: number };
}

@ApiTags('Activity Log')
@Controller('activities')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
export class ActivityLogController {
  constructor(private readonly service: ActivityLogService) {}

  @Get()
  @RequirePermission('activities', 'read')
  @ApiOperation({ summary: 'List activities for a related record or the current user' })
  @ApiResponse({ status: 200, type: [ActivityLogEntryDto] })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('relatedType') relatedType?: string,
    @Query('relatedId') relatedId?: string,
    @Query('scope') scope?: 'open' | 'overdue'
  ) {
    if (relatedType && relatedId) {
      if (!isRelatedEntityType(relatedType)) {
        throw new ForbiddenException(`Unknown relatedType '${relatedType}'`);
      }
      return this.service.findForRecord(
        relatedType as RelatedEntityType,
        Number(relatedId)
      );
    }
    const ownerId = req.user?.id;
    if (!ownerId) {
      throw new ForbiddenException('Missing authenticated user');
    }
    if (scope === 'overdue') {
      return this.service.findOverdueForOwner(ownerId);
    }
    return this.service.findOpenForOwner(ownerId);
  }

  @Get(':id')
  @RequirePermission('activities', 'read')
  @ApiOperation({ summary: 'Get an activity by id' })
  @ApiResponse({ status: 200, type: ActivityLogEntryDto })
  @ApiNotFoundResponse()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Post()
  @RequirePermission('activities', 'create')
  @ApiOperation({ summary: 'Create an activity' })
  @ApiResponse({ status: 201, type: ActivityLogEntryDto })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateActivityLogEntryDto
  ) {
    const ownerId = req.user?.id;
    if (!ownerId) {
      throw new ForbiddenException('Missing authenticated user');
    }
    return this.service.create(dto, ownerId);
  }

  @Patch(':id')
  @RequirePermission('activities', 'update')
  @ApiOperation({ summary: 'Update an activity' })
  @ApiResponse({ status: 200, type: ActivityLogEntryDto })
  @ApiNotFoundResponse()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActivityLogEntryDto
  ) {
    return this.service.update(id, dto);
  }

  @Post(':id/complete')
  @RequirePermission('activities', 'update')
  @ApiOperation({ summary: 'Mark an activity as complete' })
  @ApiResponse({ status: 200, type: ActivityLogEntryDto })
  @ApiNotFoundResponse()
  async complete(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompleteActivityLogEntryDto
  ) {
    return this.service.complete(id, dto);
  }

  @Delete(':id')
  @RequirePermission('activities', 'delete')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an activity' })
  @ApiResponse({ status: 204 })
  @ApiNotFoundResponse()
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.service.delete(id);
  }
}
