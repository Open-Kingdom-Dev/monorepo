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

import { ContactsService } from './contacts.service';
import { ContactDto, CreateContactDto, UpdateContactDto } from './dtos';

interface AuthenticatedRequest {
  user?: { id: number; role?: string };
}

@ApiTags('Contacts')
@Controller('contacts')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
export class ContactsController {
  constructor(private readonly service: ContactsService) {}

  @Get()
  @RequirePermission('contacts', 'read')
  @ApiOperation({ summary: 'List contacts' })
  @ApiResponse({ status: 200, type: [ContactDto] })
  async findAll(
    @Query('ownerId') ownerId?: string,
    @Query('companyId') companyId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('includeArchived') includeArchived?: string
  ) {
    return this.service.findAll({
      ownerId: ownerId ? Number(ownerId) : undefined,
      companyId: companyId ? Number(companyId) : undefined,
      status,
      search,
      includeArchived: includeArchived === 'true' || includeArchived === '1',
    });
  }

  @Get(':id')
  @RequirePermission('contacts', 'read')
  @ApiOperation({ summary: 'Get a contact by id' })
  @ApiResponse({ status: 200, type: ContactDto })
  @ApiNotFoundResponse()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Post()
  @RequirePermission('contacts', 'create')
  @ApiOperation({ summary: 'Create a contact' })
  @ApiResponse({ status: 201, type: ContactDto })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateContactDto
  ) {
    const ownerId = req.user?.id;
    if (!ownerId) throw new ForbiddenException('Missing authenticated user');
    return this.service.create(dto, ownerId);
  }

  @Patch(':id')
  @RequirePermission('contacts', 'update')
  @ApiOperation({ summary: 'Update a contact' })
  @ApiResponse({ status: 200, type: ContactDto })
  @ApiNotFoundResponse()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContactDto
  ) {
    return this.service.update(id, dto);
  }

  @Post(':id/archive')
  @RequirePermission('contacts', 'update')
  @ApiOperation({ summary: 'Archive a contact' })
  @ApiResponse({ status: 200, type: ContactDto })
  @ApiNotFoundResponse()
  async archive(@Param('id', ParseIntPipe) id: number) {
    return this.service.archive(id);
  }

  @Post(':id/restore')
  @RequirePermission('contacts', 'update')
  @ApiOperation({ summary: 'Restore an archived contact' })
  @ApiResponse({ status: 200, type: ContactDto })
  @ApiNotFoundResponse()
  async restore(@Param('id', ParseIntPipe) id: number) {
    return this.service.restore(id);
  }
}
