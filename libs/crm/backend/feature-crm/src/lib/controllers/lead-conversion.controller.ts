import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RequirePermission } from '@open-kingdom/shared-backend-util-rbac';

import {
  LeadConversionService,
  type ConvertLeadResult,
} from '../services/lead-conversion.service';
import { ConvertLeadRequestDto } from '../dtos/convert-lead.dto';

@ApiTags('Lead Conversion')
@Controller('leads/:id/convert')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
export class LeadConversionController {
  constructor(private readonly conversion: LeadConversionService) {}

  @Post()
  @RequirePermission('leads', 'update')
  @ApiOperation({
    summary: 'Convert a lead into contact/company/opportunity records',
  })
  @ApiResponse({ status: 201 })
  async convert(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConvertLeadRequestDto
  ): Promise<ConvertLeadResult> {
    return this.conversion.convert({
      leadId: id,
      contactId: dto.contactId,
      companyId: dto.companyId,
      createOpportunity: dto.createOpportunity,
      opportunityTitle: dto.opportunityTitle,
      opportunityEstimatedValue: dto.opportunityEstimatedValue,
    });
  }
}
