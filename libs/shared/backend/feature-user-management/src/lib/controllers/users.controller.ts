import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { UserManagementService } from '../services';
import type { AuthenticatedRequest } from '../types';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@ApiUnauthorizedResponse({
  description: 'Unauthorized - Invalid or missing JWT token',
})
export class UsersController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Get()
  @ApiOperation({
    summary: 'List all users',
    description: 'Returns a list of all users without passwords',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users',
  })
  async findAll() {
    return this.userManagementService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a user by ID',
    description: 'Returns a single user by their ID',
  })
  @ApiResponse({
    status: 200,
    description: 'User found',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userManagementService.findById(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a user',
    description: 'Delete a user by their ID. Cannot delete your own account.',
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiForbiddenResponse({
    description: 'Cannot delete your own account',
  })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest
  ) {
    await this.userManagementService.delete(id, req.user.id);
    return { message: 'User deleted successfully' };
  }
}
