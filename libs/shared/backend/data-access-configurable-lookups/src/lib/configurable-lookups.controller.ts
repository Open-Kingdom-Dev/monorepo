import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
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

import { ConfigurableLookupsService } from './configurable-lookups.service';
import {
  ConfigurableLookupDto,
  CreateConfigurableLookupDto,
  UpdateConfigurableLookupDto,
} from './dtos';

@ApiTags('Configurable Lookups')
@Controller('configurable-lookups')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
export class ConfigurableLookupsController {
  constructor(private readonly service: ConfigurableLookupsService) {}

  @Get()
  @RequirePermission('lookups', 'read')
  @ApiOperation({
    summary: 'List lookup entries, optionally filtered by listKey',
  })
  @ApiResponse({ status: 200, type: [ConfigurableLookupDto] })
  async findAll(
    @Query('listKey') listKey?: string,
    @Query('includeInactive') includeInactive?: string
  ) {
    const include = includeInactive === 'true' || includeInactive === '1';
    if (listKey) {
      return this.service.findByListKey(listKey, { includeInactive: include });
    }
    return this.service.findAll();
  }

  @Get(':id')
  @RequirePermission('lookups', 'read')
  @ApiOperation({ summary: 'Get a lookup entry by id' })
  @ApiResponse({ status: 200, type: ConfigurableLookupDto })
  @ApiNotFoundResponse()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Post()
  @RequirePermission('lookups', 'create')
  @ApiOperation({ summary: 'Create a lookup entry' })
  @ApiResponse({ status: 201, type: ConfigurableLookupDto })
  async create(@Body() dto: CreateConfigurableLookupDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @RequirePermission('lookups', 'update')
  @ApiOperation({ summary: 'Update a lookup entry' })
  @ApiResponse({ status: 200, type: ConfigurableLookupDto })
  @ApiNotFoundResponse()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateConfigurableLookupDto
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('lookups', 'delete')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a non-system lookup entry' })
  @ApiResponse({ status: 204 })
  @ApiNotFoundResponse()
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.service.delete(id);
  }
}
