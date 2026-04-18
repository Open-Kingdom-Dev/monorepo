import { ApiProperty } from '@nestjs/swagger';

export class CompanyDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false, nullable: true })
  website?: string | null;

  @ApiProperty({ required: false, nullable: true })
  primaryPhone?: string | null;

  @ApiProperty({ required: false, nullable: true })
  industry?: string | null;

  @ApiProperty()
  status!: string;

  @ApiProperty({ required: false, nullable: true })
  location?: string | null;

  @ApiProperty({ required: false, nullable: true })
  companySize?: string | null;

  @ApiProperty({ required: false, nullable: true })
  revenueRange?: string | null;

  @ApiProperty({ required: false, nullable: true })
  notesSummary?: string | null;

  @ApiProperty()
  ownerId!: number;

  @ApiProperty()
  isArchived!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class CreateCompanyDto {
  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false })
  website?: string;

  @ApiProperty({ required: false })
  primaryPhone?: string;

  @ApiProperty({ required: false })
  industry?: string;

  @ApiProperty({ required: false, default: 'active' })
  status?: string;

  @ApiProperty({ required: false })
  location?: string;

  @ApiProperty({ required: false })
  companySize?: string;

  @ApiProperty({ required: false })
  revenueRange?: string;

  @ApiProperty({ required: false })
  notesSummary?: string;

  @ApiProperty({
    required: false,
    description: 'Owner user id. Defaults to the authenticated user.',
  })
  ownerId?: number;
}

export class UpdateCompanyDto {
  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  website?: string | null;

  @ApiProperty({ required: false })
  primaryPhone?: string | null;

  @ApiProperty({ required: false })
  industry?: string | null;

  @ApiProperty({ required: false })
  status?: string;

  @ApiProperty({ required: false })
  location?: string | null;

  @ApiProperty({ required: false })
  companySize?: string | null;

  @ApiProperty({ required: false })
  revenueRange?: string | null;

  @ApiProperty({ required: false })
  notesSummary?: string | null;

  @ApiProperty({ required: false })
  ownerId?: number;
}
