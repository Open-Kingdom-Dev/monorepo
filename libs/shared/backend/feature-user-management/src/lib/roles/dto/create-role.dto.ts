import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name (unique)' })
  name!: string;

  @ApiProperty({ description: 'Role description', required: false })
  description?: string;

  @ApiProperty({ description: 'JSON string of permissions', required: false })
  permissions?: string;
}
