import { ApiProperty } from '@nestjs/swagger';

export class InviteUserResponseDto {
  @ApiProperty({ description: 'Whether the invitation was sent successfully' })
  success!: boolean;

  @ApiProperty({ description: 'The created invitation ID', required: false })
  invitationId?: number;

  @ApiProperty({ description: 'Error message if failed', required: false })
  error?: string;
}
