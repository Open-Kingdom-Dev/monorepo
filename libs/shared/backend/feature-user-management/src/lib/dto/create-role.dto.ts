import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Unique role name',
    example: 'editor',
  })
  name!: string;

  @ApiProperty({
    description: 'Role description',
    example: 'Content editor with publishing rights',
    required: false,
  })
  description?: string;
}
