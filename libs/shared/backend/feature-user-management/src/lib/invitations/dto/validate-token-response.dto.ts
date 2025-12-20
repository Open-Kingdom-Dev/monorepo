import { ApiProperty } from '@nestjs/swagger';

export class ValidateTokenResponseDto {
  @ApiProperty({ description: 'Whether the token is valid' })
  valid!: boolean;

  @ApiProperty({ description: 'Email from the invitation', required: false })
  email?: string;

  @ApiProperty({
    description: 'First name from the invitation',
    required: false,
    nullable: true,
  })
  firstName?: string | null;

  @ApiProperty({
    description: 'Last name from the invitation',
    required: false,
    nullable: true,
  })
  lastName?: string | null;

  @ApiProperty({
    description: 'Role from the invitation',
    required: false,
    nullable: true,
  })
  role?: 'guest' | 'user' | 'admin' | null;

  @ApiProperty({ description: 'Error message if invalid', required: false })
  error?: string;
}
