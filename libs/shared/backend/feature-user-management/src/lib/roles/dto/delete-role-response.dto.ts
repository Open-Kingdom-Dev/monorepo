import { ApiProperty } from '@nestjs/swagger';

export class DeleteRoleResponseDto {
  @ApiProperty({ description: 'Whether the role was deleted successfully' })
  success!: boolean;

  @ApiProperty({ description: 'Error message if failed', required: false })
  error?: string;
}
