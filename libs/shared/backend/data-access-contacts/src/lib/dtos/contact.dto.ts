import { ApiProperty } from '@nestjs/swagger';

export class ContactDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({ required: false, nullable: true })
  email?: string | null;

  @ApiProperty({ required: false, nullable: true })
  phone?: string | null;

  @ApiProperty({ required: false, nullable: true })
  secondaryPhone?: string | null;

  @ApiProperty({ required: false, nullable: true })
  secondaryEmail?: string | null;

  @ApiProperty({ required: false, nullable: true })
  jobTitle?: string | null;

  @ApiProperty({ required: false, nullable: true })
  companyId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  leadSource?: string | null;

  @ApiProperty({ required: false, nullable: true })
  tags?: string | null;

  @ApiProperty({ required: false, nullable: true })
  mailingAddress?: string | null;

  @ApiProperty({ required: false, nullable: true })
  notesSummary?: string | null;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  ownerId!: number;

  @ApiProperty()
  isArchived!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class CreateContactDto {
  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  secondaryPhone?: string;

  @ApiProperty({ required: false })
  secondaryEmail?: string;

  @ApiProperty({ required: false })
  jobTitle?: string;

  @ApiProperty({ required: false })
  companyId?: number;

  @ApiProperty({ required: false })
  leadSource?: string;

  @ApiProperty({ required: false })
  tags?: string;

  @ApiProperty({ required: false })
  mailingAddress?: string;

  @ApiProperty({ required: false })
  notesSummary?: string;

  @ApiProperty({ required: false, default: 'active' })
  status?: string;

  @ApiProperty({
    required: false,
    description: 'Owner user id. Defaults to the authenticated user.',
  })
  ownerId?: number;
}

export class UpdateContactDto {
  @ApiProperty({ required: false })
  firstName?: string;

  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty({ required: false })
  email?: string | null;

  @ApiProperty({ required: false })
  phone?: string | null;

  @ApiProperty({ required: false })
  secondaryPhone?: string | null;

  @ApiProperty({ required: false })
  secondaryEmail?: string | null;

  @ApiProperty({ required: false })
  jobTitle?: string | null;

  @ApiProperty({ required: false })
  companyId?: number | null;

  @ApiProperty({ required: false })
  leadSource?: string | null;

  @ApiProperty({ required: false })
  tags?: string | null;

  @ApiProperty({ required: false })
  mailingAddress?: string | null;

  @ApiProperty({ required: false })
  notesSummary?: string | null;

  @ApiProperty({ required: false })
  status?: string;

  @ApiProperty({ required: false })
  ownerId?: number;
}
