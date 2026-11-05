import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LeasedPortDto {
  @ApiProperty({ description: 'Env var the service reads', example: 'PORT' })
  name?: string;

  @ApiProperty({ description: 'Slot-0 (historical) port', example: 3000 })
  base?: number;

  @ApiProperty({ description: 'Port this worktree would get', example: 3065 })
  leased?: number;

  @ApiProperty({
    description: 'Whether something is listening on the leased port',
    example: false,
  })
  busy?: boolean;
}

export class LeasedSlotDto {
  @ApiProperty({ example: 1 })
  slot?: number;

  @ApiProperty({ example: '/Users/me/code/ok-monorepo-feature' })
  path?: string;

  @ApiProperty({ example: 'feature-branch' })
  branch?: string;

  @ApiProperty({ description: 'Whether this is the worktree serving the API' })
  current?: boolean;
}

export class PortLeaseStatusDto {
  @ApiProperty({ example: 0 })
  slot?: number;

  @ApiProperty({ enum: ['registry', 'cache', 'degraded'], example: 'registry' })
  source?: 'registry' | 'cache' | 'degraded';

  @ApiProperty({ description: 'True for the clone’s primary worktree' })
  isPrimary?: boolean;

  @ApiPropertyOptional({ nullable: true, type: String })
  worktreePath?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  branch?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  registryPath?: string | null;

  @ApiProperty({ description: 'Stride between slots', example: 65 })
  width?: number;

  @ApiProperty({ description: 'Slots the width is collision-free across' })
  maxSlots?: number;

  @ApiProperty({
    description: 'Port this backend is actually listening on',
    example: 3000,
  })
  backendPort?: number;

  @ApiProperty({ type: [LeasedPortDto] })
  ports?: LeasedPortDto[];

  @ApiProperty({ type: [LeasedSlotDto] })
  registry?: LeasedSlotDto[];

  @ApiProperty({ type: [String], description: 'Non-fatal lease diagnostics' })
  warnings?: string[];
}
