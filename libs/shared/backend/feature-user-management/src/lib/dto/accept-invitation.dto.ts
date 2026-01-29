import { ApiProperty } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiProperty({
    description: 'Invitation token from the invite link',
    example: 'abc123def456',
  })
  token!: string;

  @ApiProperty({
    description: 'Password for the new account',
    example: 'securePassword123',
    minLength: 8,
  })
  password!: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    required: false,
  })
  firstName?: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    required: false,
  })
  lastName?: string;
}
