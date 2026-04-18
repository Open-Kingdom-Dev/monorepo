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

import { LeadsService } from './leads.service';
import { CreateLeadDto, LeadDto, UpdateLeadDto } from './dtos';

interface AuthenticatedRequest {
  user?: { id: number };
}

@ApiTags('Leads')
@Controller('leads')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  @Get()
  @RequirePermission('leads', 'read')
  @ApiOperation({ summary: 'List leads' })
  @ApiResponse({ status: 200, type: [LeadDto] })
  async findAll(
    @Query('ownerId') ownerId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    return this.service.findAll({
      ownerId: ownerId ? Number(ownerId) : undefined,
      status,
      search,
    });
  }

  @Get(':id')
  @RequirePermission('leads', 'read')
  @ApiOperation({ summary: 'Get a lead by id' })
  @ApiResponse({ status: 200, type: LeadDto })
  @ApiNotFoundResponse()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Post()
  @RequirePermission('leads', 'create')
  @ApiOperation({ summary: 'Create a lead' })
  @ApiResponse({ status: 201, type: LeadDto })
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateLeadDto) {
    const ownerId = req.user?.id;
    if (!ownerId) throw new ForbiddenException('Missing authenticated user');
    return this.service.create(dto, ownerId);
  }

  @Patch(':id')
  @RequirePermission('leads', 'update')
  @ApiOperation({ summary: 'Update a lead' })
  @ApiResponse({ status: 200, type: LeadDto })
  @ApiNotFoundResponse()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLeadDto
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('leads', 'delete')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a lead' })
  @ApiResponse({ status: 204 })
  @ApiNotFoundResponse()
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.service.delete(id);
  }
}
