import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'admin@admin.com',
    format: 'email',
  })
  email = '';

  @ApiProperty({
    description: 'User password',
    example: 'admin',
    minLength: 1,
  })
  password = '';
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token!: string;
}

export class ProfileResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  id!: number;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    nullable: true,
  })
  firstName!: string | null;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    nullable: true,
  })
  lastName!: string | null;

  @ApiProperty({
    description: 'User email address',
    example: 'john@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'ID of user who invited this user',
    example: null,
    nullable: true,
  })
  invitee!: number | null;

  @ApiProperty({
    description: 'User role',
    example: 'user',
    enum: ['guest', 'user', 'admin'],
  })
  role!: 'guest' | 'user' | 'admin';
}
