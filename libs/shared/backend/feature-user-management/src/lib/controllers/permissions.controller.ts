import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RequirePermission } from '@open-kingdom/shared-backend-util-rbac';

import { PermissionsService } from '../services';
import { CreatePermissionDto } from '../dto';

@ApiTags('Permissions')
@Controller('permissions')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({
  description: 'Unauthorized - Invalid or missing JWT token',
})
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermission('permissions', 'read')
  @ApiOperation({ summary: 'List all permissions' })
  @ApiResponse({ status: 200, description: 'List of permissions' })
  async findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @RequirePermission('permissions', 'read')
  @ApiOperation({ summary: 'Get a permission by ID' })
  @ApiResponse({ status: 200, description: 'Permission found' })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findById(id);
  }

  @Post()
  @RequirePermission('permissions', 'create')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiBody({ type: CreatePermissionDto })
  @ApiResponse({ status: 201, description: 'Permission created' })
  @ApiBadRequestResponse({ description: 'Permission already exists' })
  async create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(
      dto.resource,
      dto.action,
      dto.description
    );
  }

  @Delete(':id')
  @RequirePermission('permissions', 'delete')
  @ApiOperation({ summary: 'Delete a permission' })
  @ApiResponse({ status: 200, description: 'Permission deleted successfully' })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  @ApiBadRequestResponse({
    description: 'Cannot delete permission assigned to roles',
  })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.permissionsService.delete(id);
    return { message: 'Permission deleted successfully' };
  }
}
