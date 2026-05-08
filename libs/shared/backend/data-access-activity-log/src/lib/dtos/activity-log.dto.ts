import { ApiProperty } from '@nestjs/swagger';

export class ActivityLogEntryDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({
    description:
      'Polymorphic identifier for the related record kind. Validated against the allowed-types list registered via DataAccessActivityLogModule.forRoot().',
  })
  relatedType!: string;

  @ApiProperty()
  relatedId!: number;

  @ApiProperty({
    description:
      'Activity type. Validated against the allowed-types list registered via DataAccessActivityLogModule.forRoot().',
  })
  type!: string;

  @ApiProperty()
  subject!: string;

  @ApiProperty({ required: false, nullable: true })
  description?: string | null;

  @ApiProperty({ required: false, nullable: true, type: Date })
  dueAt?: Date | null;

  @ApiProperty({ required: false, nullable: true, type: Date })
  completedAt?: Date | null;

  @ApiProperty()
  ownerId!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class CreateActivityLogEntryDto {
  @ApiProperty()
  relatedType!: string;

  @ApiProperty()
  relatedId!: number;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  subject!: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false, type: Date })
  dueAt?: Date;
}

export class UpdateActivityLogEntryDto {
  @ApiProperty({ required: false })
  subject?: string;

  @ApiProperty({ required: false })
  description?: string | null;

  @ApiProperty({ required: false, type: Date })
  dueAt?: Date | null;
}

export class CompleteActivityLogEntryDto {
  @ApiProperty({ required: false })
  outcomeNotes?: string;
}
