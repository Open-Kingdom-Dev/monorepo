import { ApiProperty } from '@nestjs/swagger';
import type { OpportunityStage } from '@open-kingdom/shared-poly-util-crm-domain';

export class OpportunityDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  companyId!: number;

  @ApiProperty({ required: false, nullable: true })
  primaryContactId?: number | null;

  @ApiProperty({
    enum: ['new', 'discovery', 'proposal', 'negotiation', 'won', 'lost'],
  })
  stage!: OpportunityStage;

  @ApiProperty({ required: false, nullable: true })
  estimatedValue?: number | null;

  @ApiProperty({ required: false, nullable: true })
  probability?: number | null;

  @ApiProperty({ required: false, nullable: true, type: Date })
  expectedCloseDate?: Date | null;

  @ApiProperty({ required: false, nullable: true, type: Date })
  closedAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  lossReason?: string | null;

  @ApiProperty({ required: false, nullable: true })
  notes?: string | null;

  @ApiProperty()
  ownerId!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class CreateOpportunityDto {
  @ApiProperty()
  title!: string;

  @ApiProperty()
  companyId!: number;

  @ApiProperty({ required: false })
  primaryContactId?: number;

  @ApiProperty({
    required: false,
    enum: ['new', 'discovery', 'proposal', 'negotiation', 'won', 'lost'],
    default: 'new',
  })
  stage?: OpportunityStage;

  @ApiProperty({ required: false })
  estimatedValue?: number;

  @ApiProperty({ required: false })
  probability?: number;

  @ApiProperty({ required: false, type: Date })
  expectedCloseDate?: Date;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty({ required: false })
  ownerId?: number;
}

export class UpdateOpportunityDto {
  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty({ required: false })
  companyId?: number;

  @ApiProperty({ required: false })
  primaryContactId?: number | null;

  @ApiProperty({
    required: false,
    enum: ['new', 'discovery', 'proposal', 'negotiation', 'won', 'lost'],
  })
  stage?: OpportunityStage;

  @ApiProperty({ required: false })
  estimatedValue?: number | null;

  @ApiProperty({ required: false })
  probability?: number | null;

  @ApiProperty({ required: false, type: Date })
  expectedCloseDate?: Date | null;

  @ApiProperty({ required: false })
  notes?: string | null;

  @ApiProperty({ required: false })
  ownerId?: number;
}

export class CloseOpportunityDto {
  @ApiProperty({ enum: ['won', 'lost'] })
  outcome!: 'won' | 'lost';

  @ApiProperty({ required: false })
  lossReason?: string;
}
