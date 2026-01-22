import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  id!: number;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false,
  })
  firstName?: string | null;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false,
  })
  lastName?: string | null;

  @ApiProperty({
    description: 'User role',
    enum: ['guest', 'user', 'admin'],
    example: 'user',
  })
  role!: 'guest' | 'user' | 'admin';
}

export class DeleteUserResponseDto {
  @ApiProperty({
    description: 'Whether the user was deleted successfully',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Message describing the result',
    example: 'User deleted successfully',
  })
  message!: string;
}
