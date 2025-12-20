import { ApiProperty } from '@nestjs/swagger';

export class InviteUserDto {
  @ApiProperty({ description: 'Email address of the user to invite' })
  email!: string;

  @ApiProperty({ description: 'First name', required: false })
  firstName?: string;

  @ApiProperty({ description: 'Last name', required: false })
  lastName?: string;

  @ApiProperty({
    description: 'Role to assign',
    enum: ['guest', 'user', 'admin'],
    default: 'user',
    required: false,
  })
  role?: 'guest' | 'user' | 'admin';

  @ApiProperty({ description: 'Custom role ID', required: false })
  customRoleId?: number;
}
