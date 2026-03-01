import { ApiProperty } from '@nestjs/swagger';

export class InviteUserDto {
  @ApiProperty({
    description: 'Email address of the user to invite',
    example: 'newuser@example.com',
    format: 'email',
  })
  email!: string;

  @ApiProperty({
    description: 'Role name to assign to the invited user',
    example: 'guest',
    default: 'guest',
    required: false,
  })
  role?: string;
}
