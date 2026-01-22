import { ApiProperty } from '@nestjs/swagger';

export class ValidateInvitationResponseDto {
  @ApiProperty({
    description: 'Whether the invitation token is valid',
    example: true,
  })
  valid!: boolean;

  @ApiProperty({
    description: 'Email address associated with the invitation',
    example: 'user@example.com',
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: 'Role assigned to the invitation',
    enum: ['guest', 'user', 'admin'],
    required: false,
  })
  role?: 'guest' | 'user' | 'admin';

  @ApiProperty({
    description: 'Error message if validation failed',
    example: 'Invitation has expired',
    required: false,
  })
  error?: string;
}
