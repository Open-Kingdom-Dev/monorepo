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

import { CompaniesService } from './companies.service';
import { CompanyDto, CreateCompanyDto, UpdateCompanyDto } from './dtos';

interface AuthenticatedRequest {
  user?: { id: number; role?: string };
}

@ApiTags('Companies')
@Controller('companies')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Get()
  @RequirePermission('companies', 'read')
  @ApiOperation({ summary: 'List companies' })
  @ApiResponse({ status: 200, type: [CompanyDto] })
  async findAll(
    @Query('ownerId') ownerId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('includeArchived') includeArchived?: string
  ) {
    return this.service.findAll({
      ownerId: ownerId ? Number(ownerId) : undefined,
      status,
      search,
      includeArchived: includeArchived === 'true' || includeArchived === '1',
    });
  }

  @Get(':id')
  @RequirePermission('companies', 'read')
  @ApiOperation({ summary: 'Get a company by id' })
  @ApiResponse({ status: 200, type: CompanyDto })
  @ApiNotFoundResponse()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Post()
  @RequirePermission('companies', 'create')
  @ApiOperation({ summary: 'Create a company' })
  @ApiResponse({ status: 201, type: CompanyDto })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCompanyDto
  ) {
    const ownerId = req.user?.id;
    if (!ownerId) throw new ForbiddenException('Missing authenticated user');
    return this.service.create(dto, ownerId);
  }

  @Patch(':id')
  @RequirePermission('companies', 'update')
  @ApiOperation({ summary: 'Update a company' })
  @ApiResponse({ status: 200, type: CompanyDto })
  @ApiNotFoundResponse()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyDto
  ) {
    return this.service.update(id, dto);
  }

  @Post(':id/archive')
  @RequirePermission('companies', 'update')
  @ApiOperation({ summary: 'Archive a company' })
  @ApiResponse({ status: 200, type: CompanyDto })
  @ApiNotFoundResponse()
  async archive(@Param('id', ParseIntPipe) id: number) {
    return this.service.archive(id);
  }

  @Post(':id/restore')
  @RequirePermission('companies', 'update')
  @ApiOperation({ summary: 'Restore an archived company' })
  @ApiResponse({ status: 200, type: CompanyDto })
  @ApiNotFoundResponse()
  async restore(@Param('id', ParseIntPipe) id: number) {
    return this.service.restore(id);
  }
}
