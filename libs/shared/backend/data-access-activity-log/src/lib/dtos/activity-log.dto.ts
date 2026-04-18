import { ApiProperty } from '@nestjs/swagger';
import type {
  RelatedEntityType,
  ActivityType,
} from '@open-kingdom/shared-poly-util-crm-domain';

export class ActivityLogEntryDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ enum: ['contact', 'company', 'lead', 'opportunity'] })
  relatedType!: RelatedEntityType;

  @ApiProperty()
  relatedId!: number;

  @ApiProperty({ enum: ['note', 'call', 'meeting', 'email', 'task'] })
  type!: ActivityType;

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
  @ApiProperty({ enum: ['contact', 'company', 'lead', 'opportunity'] })
  relatedType!: RelatedEntityType;

  @ApiProperty()
  relatedId!: number;

  @ApiProperty({ enum: ['note', 'call', 'meeting', 'email', 'task'] })
  type!: ActivityType;

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
