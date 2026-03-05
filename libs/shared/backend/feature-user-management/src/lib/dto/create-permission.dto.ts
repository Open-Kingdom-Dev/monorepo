import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Resource name',
    example: 'articles',
  })
  resource!: string;

  @ApiProperty({
    description: 'Action name',
    example: 'publish',
  })
  action!: string;

  @ApiProperty({
    description: 'Permission description',
    required: false,
  })
  description?: string;
}
