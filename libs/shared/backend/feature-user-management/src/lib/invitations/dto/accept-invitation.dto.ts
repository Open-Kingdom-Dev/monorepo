import { ApiProperty } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiProperty({ description: 'Invitation token from email' })
  token!: string;

  @ApiProperty({ description: 'New password (min 8 characters)' })
  password!: string;

  @ApiProperty({
    description: 'First name (can override invitation)',
    required: false,
  })
  firstName?: string;

  @ApiProperty({
    description: 'Last name (can override invitation)',
    required: false,
  })
  lastName?: string;
}
