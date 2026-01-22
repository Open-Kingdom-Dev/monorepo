import { ApiProperty } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiProperty({
    description: 'The invitation token received via email',
    example: 'eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJleHBpcmVzQXQiOjE3MDk4MjQwMDB9',
    type: 'string',
  })
  token!: string;

  @ApiProperty({
    description: 'Password for the new account',
    example: 'securePassword123',
    type: 'string',
    minLength: 8,
  })
  password!: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    required: false,
    type: 'string',
  })
  firstName?: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    required: false,
    type: 'string',
  })
  lastName?: string;
}

export class AcceptInvitationResponseDto {
  @ApiProperty({
    description: 'Whether the account was created successfully',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Message describing the result',
    example: 'Account created successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Email of the created user',
    example: 'user@example.com',
    required: false,
  })
  email?: string;
}
