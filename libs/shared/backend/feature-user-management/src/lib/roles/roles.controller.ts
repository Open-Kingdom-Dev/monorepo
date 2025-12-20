import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesService } from './roles.service.js';
import { Roles } from '../decorators/index.js';
import { RolesGuard } from '../guards/index.js';
import {
  CreateRoleDto,
  CustomRoleResponseDto,
  DeleteRoleResponseDto,
} from './dto/index.js';

interface RequestWithUser extends Request {
  user: { id: number; email: string; role?: string };
}

@ApiTags('Roles')
@Controller('roles')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'List all custom roles' })
  @ApiResponse({ status: 200, type: [CustomRoleResponseDto] })
  async list(): Promise<CustomRoleResponseDto[]> {
    return this.rolesService.list();
  }

  @Post()
  @ApiOperation({ summary: 'Create a custom role' })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({ status: 201, type: CustomRoleResponseDto })
  async create(
    @Body() dto: CreateRoleDto,
    @Request() req: RequestWithUser
  ): Promise<CustomRoleResponseDto> {
    return this.rolesService.create(dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a custom role' })
  @ApiResponse({ status: 200, type: DeleteRoleResponseDto })
  async delete(
    @Param('id', ParseIntPipe) id: number
  ): Promise<DeleteRoleResponseDto> {
    await this.rolesService.delete(id);
    return { success: true };
  }
}
