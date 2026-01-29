import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'admin@admin.com',
    format: 'email',
    type: 'string',
  })
  email: string | undefined;

  @ApiProperty({
    description: 'User password',
    example: 'admin',
    type: 'string',
    minLength: 1,
  })
  password: string | undefined;
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
    type: 'string',
    nullable: true,
  })
  firstName!: string | null;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    type: 'string',
    nullable: true,
  })
  lastName!: string | null;

  @ApiProperty({
    description: 'User email address',
    example: 'john@example.com',
  })
  email!: string;
}
