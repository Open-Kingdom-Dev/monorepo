import { ApiProperty } from '@nestjs/swagger';

export class AcceptInvitationResponseDto {
  @ApiProperty({ description: 'Whether the account was created successfully' })
  success!: boolean;

  @ApiProperty({ description: 'The created user email', required: false })
  email?: string;

  @ApiProperty({ description: 'Error message if failed', required: false })
  error?: string;
}
