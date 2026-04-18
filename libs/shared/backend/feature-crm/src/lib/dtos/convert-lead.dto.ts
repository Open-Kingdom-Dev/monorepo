import { ApiProperty } from '@nestjs/swagger';

export class ConvertLeadRequestDto {
  @ApiProperty({ required: false })
  contactId?: number;

  @ApiProperty({ required: false })
  companyId?: number;

  @ApiProperty({ required: false, default: true })
  createOpportunity?: boolean;

  @ApiProperty({ required: false })
  opportunityTitle?: string;

  @ApiProperty({ required: false })
  opportunityEstimatedValue?: number;
}
