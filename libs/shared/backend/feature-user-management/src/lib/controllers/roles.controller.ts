import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
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
import { AuthGuard } from '@nestjs/passport';
import {
  PermissionGuard,
  RequirePermission,
} from '@open-kingdom/shared-backend-util-rbac';

import { RolesService, PermissionsService } from '../services';
import { CreateRoleDto, UpdateRoleDto, SetRolePermissionsDto } from '../dto';

@ApiTags('Roles')
@Controller('roles')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), PermissionGuard)
@ApiUnauthorizedResponse({
  description: 'Unauthorized - Invalid or missing JWT token',
})
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService
  ) {}

  @Get()
  @RequirePermission('roles', 'read')
  @ApiOperation({ summary: 'List all roles' })
  @ApiResponse({ status: 200, description: 'List of roles' })
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermission('roles', 'read')
  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiResponse({ status: 200, description: 'Role found' })
  @ApiNotFoundResponse({ description: 'Role not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findById(id);
  }

  @Post()
  @RequirePermission('roles', 'create')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({ status: 201, description: 'Role created' })
  @ApiBadRequestResponse({ description: 'Role name already exists' })
  async create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto.name, dto.description ?? null);
  }

  @Patch(':id')
  @RequirePermission('roles', 'update')
  @ApiOperation({ summary: 'Update a role' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiNotFoundResponse({ description: 'Role not found' })
  @ApiBadRequestResponse({ description: 'Cannot rename a system role' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto
  ) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('roles', 'delete')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiNotFoundResponse({ description: 'Role not found' })
  @ApiBadRequestResponse({
    description: 'Cannot delete system role or role with assigned users',
  })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.rolesService.delete(id);
    return { message: 'Role deleted successfully' };
  }

  @Get(':id/permissions')
  @RequirePermission('roles', 'read')
  @ApiOperation({ summary: 'Get permissions for a role' })
  @ApiResponse({
    status: 200,
    description: 'List of permissions for the role',
  })
  async getPermissions(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findByRole(id);
  }

  @Put(':id/permissions')
  @RequirePermission('roles', 'update')
  @ApiOperation({
    summary: 'Set permissions for a role',
    description: 'Replace all permissions for a role',
  })
  @ApiBody({ type: SetRolePermissionsDto })
  @ApiResponse({ status: 200, description: 'Permissions updated' })
  @ApiNotFoundResponse({ description: 'Role not found' })
  async setPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetRolePermissionsDto
  ) {
    await this.rolesService.findById(id);
    await this.permissionsService.setRolePermissions(id, dto.permissionIds);
    return { message: 'Role permissions updated successfully' };
  }
}
