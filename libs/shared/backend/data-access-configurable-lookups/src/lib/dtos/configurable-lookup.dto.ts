import { ApiProperty } from '@nestjs/swagger';

export class ConfigurableLookupDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  listKey!: string;

  @ApiProperty()
  value!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  isSystem!: boolean;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class CreateConfigurableLookupDto {
  @ApiProperty({
    example: 'opportunity_stage',
    description: 'snake_case list key',
  })
  listKey!: string;

  @ApiProperty({
    example: 'discovery',
    description: 'snake_case canonical value',
  })
  value!: string;

  @ApiProperty({ example: 'Discovery' })
  label!: string;

  @ApiProperty({ required: false, default: 0 })
  sortOrder?: number;

  @ApiProperty({ required: false, default: true })
  isActive?: boolean;
}

export class UpdateConfigurableLookupDto {
  @ApiProperty({ required: false })
  listKey?: string;

  @ApiProperty({ required: false })
  value?: string;

  @ApiProperty({ required: false })
  label?: string;

  @ApiProperty({ required: false })
  sortOrder?: number;

  @ApiProperty({ required: false })
  isActive?: boolean;
}
