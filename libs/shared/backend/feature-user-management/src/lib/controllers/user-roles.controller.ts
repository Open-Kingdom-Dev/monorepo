import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RequirePermission } from '@open-kingdom/shared-backend-util-rbac';

import { UserRolesService } from '../services';
import { AssignUserRoleDto, UpdateUserRolesDto } from '../dto';
import type { AuthenticatedRequest } from '../types';

@ApiTags('User Roles')
@Controller('users')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({
  description: 'Unauthorized - Invalid or missing JWT token',
})
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
export class UserRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}

  @Get(':userId/roles')
  @RequirePermission('users', 'read')
  @ApiOperation({ summary: 'Get roles for a user' })
  @ApiResponse({
    status: 200,
    description: 'List of roles assigned to the user',
  })
  async findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.userRolesService.findByUserId(userId);
  }

  @Put(':userId/roles')
  @RequirePermission('roles', 'update')
  @ApiOperation({
    summary: 'Replace all roles for a user',
    description: 'Replaces all role assignments for the user',
  })
  @ApiBody({ type: UpdateUserRolesDto })
  @ApiResponse({ status: 200, description: 'Roles updated' })
  async setRoles(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateUserRolesDto,
    @Request() req: AuthenticatedRequest
  ) {
    await this.userRolesService.setRoles(userId, dto.roleIds, req.user.id);
    return { message: 'User roles updated successfully' };
  }

  @Post(':userId/roles')
  @RequirePermission('roles', 'update')
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiBody({ type: AssignUserRoleDto })
  @ApiResponse({ status: 201, description: 'Role assigned' })
  async assignRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: AssignUserRoleDto,
    @Request() req: AuthenticatedRequest
  ) {
    await this.userRolesService.assignRole(userId, dto.roleId, req.user.id);
    return { message: 'Role assigned successfully' };
  }

  @Delete(':userId/roles/:roleId')
  @RequirePermission('roles', 'update')
  @ApiOperation({ summary: 'Remove a role from a user' })
  @ApiResponse({ status: 200, description: 'Role removed' })
  async removeRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number
  ) {
    await this.userRolesService.removeRole(userId, roleId);
    return { message: 'Role removed successfully' };
  }
}
