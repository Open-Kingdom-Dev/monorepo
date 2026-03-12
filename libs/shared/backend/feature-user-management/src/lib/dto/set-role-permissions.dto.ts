import { ApiProperty } from '@nestjs/swagger';

export class SetRolePermissionsDto {
  @ApiProperty({
    description: 'Array of permission IDs to assign',
    type: [Number],
    example: [1, 2, 3],
  })
  permissionIds!: number[];
}
