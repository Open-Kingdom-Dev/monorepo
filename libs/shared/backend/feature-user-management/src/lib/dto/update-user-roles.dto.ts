import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRolesDto {
  @ApiProperty({
    description: 'Array of role IDs to assign (replaces all existing roles)',
    type: [Number],
    example: [1, 2],
  })
  roleIds!: number[];
}
