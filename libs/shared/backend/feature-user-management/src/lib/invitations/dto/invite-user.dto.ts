import { ApiProperty } from '@nestjs/swagger';

export class InviteUserDto {
  @ApiProperty({
    description: 'Email address to send invitation to',
    example: 'user@example.com',
    format: 'email',
    type: 'string',
  })
  email!: string;

  @ApiProperty({
    description: 'Role to assign to the invited user',
    enum: ['guest', 'user', 'admin'],
    default: 'user',
    required: false,
  })
  role?: 'guest' | 'user' | 'admin';
}

export class InviteUserResponseDto {
  @ApiProperty({
    description: 'Whether the invitation was sent successfully',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Message describing the result',
    example: 'Invitation sent successfully',
  })
  message!: string;
}
