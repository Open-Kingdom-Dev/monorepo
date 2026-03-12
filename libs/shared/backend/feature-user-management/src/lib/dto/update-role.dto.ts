import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'New role name',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'New description',
    required: false,
  })
  description?: string;
}
