import { ApiProperty } from '@nestjs/swagger';
import type { LeadStatus } from '@open-kingdom/crm-poly-util-domain';

export class LeadDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false, nullable: true })
  companyName?: string | null;

  @ApiProperty({ required: false, nullable: true })
  email?: string | null;

  @ApiProperty({ required: false, nullable: true })
  phone?: string | null;

  @ApiProperty({ required: false, nullable: true })
  source?: string | null;

  @ApiProperty({ enum: ['new', 'contacted', 'qualified', 'unqualified'] })
  status!: LeadStatus;

  @ApiProperty({ required: false, nullable: true })
  notes?: string | null;

  @ApiProperty({ required: false, nullable: true })
  contactId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  companyId?: number | null;

  @ApiProperty({ required: false, nullable: true, type: Date })
  convertedAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  convertedToContactId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  convertedToCompanyId?: number | null;

  @ApiProperty()
  ownerId!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class CreateLeadDto {
  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false })
  companyName?: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  source?: string;

  @ApiProperty({
    required: false,
    enum: ['new', 'contacted', 'qualified', 'unqualified'],
    default: 'new',
  })
  status?: LeadStatus;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty({ required: false })
  ownerId?: number;
}

export class UpdateLeadDto {
  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  companyName?: string | null;

  @ApiProperty({ required: false })
  email?: string | null;

  @ApiProperty({ required: false })
  phone?: string | null;

  @ApiProperty({ required: false })
  source?: string | null;

  @ApiProperty({
    required: false,
    enum: ['new', 'contacted', 'qualified', 'unqualified'],
  })
  status?: LeadStatus;

  @ApiProperty({ required: false })
  notes?: string | null;

  @ApiProperty({ required: false })
  ownerId?: number;
}

export class ConvertLeadDto {
  @ApiProperty({
    required: false,
    description:
      'Existing contact id to link to. If omitted, a new contact is created from the lead details.',
  })
  contactId?: number;

  @ApiProperty({
    required: false,
    description:
      'Existing company id to link to. If omitted and companyName is set, a new company is created.',
  })
  companyId?: number;

  @ApiProperty({
    required: false,
    description:
      'If true, also create an opportunity seeded from the lead. Default true.',
    default: true,
  })
  createOpportunity?: boolean;

  @ApiProperty({ required: false })
  opportunityTitle?: string;

  @ApiProperty({ required: false })
  opportunityEstimatedValue?: number;
}
