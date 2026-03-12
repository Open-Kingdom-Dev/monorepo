import { ApiProperty } from '@nestjs/swagger';

export class AssignUserRoleDto {
  @ApiProperty({
    description: 'Role ID to assign',
    example: 2,
  })
  roleId!: number;
}
