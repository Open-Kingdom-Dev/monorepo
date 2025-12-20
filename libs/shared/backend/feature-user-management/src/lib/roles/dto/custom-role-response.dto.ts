import { ApiProperty } from '@nestjs/swagger';

export class CustomRoleResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false })
  description!: string | null;

  @ApiProperty({ required: false })
  permissions!: string | null;

  @ApiProperty()
  createdAt!: number;

  @ApiProperty()
  createdBy!: number;
}
