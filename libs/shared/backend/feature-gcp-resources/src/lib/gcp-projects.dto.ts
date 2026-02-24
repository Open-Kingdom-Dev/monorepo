import { ApiProperty } from '@nestjs/swagger';

export class GcpProjectSummaryDto {
  @ApiProperty({
    description: 'Full resource name (e.g. projects/123)',
    example: 'projects/my-project-id',
  })
  name!: string;

  @ApiProperty({
    description: 'Project ID',
    example: 'my-project-id',
  })
  projectId!: string;

  @ApiProperty({
    description: 'Display name',
    example: 'My Project',
    required: false,
  })
  displayName?: string;

  @ApiProperty({
    description: 'Project lifecycle state (e.g. ACTIVE, DELETE_REQUESTED)',
    example: 'ACTIVE',
    required: false,
  })
  state?: unknown;
}

export class CreateProjectDto {
  @ApiProperty({
    description:
      'Project ID (must be unique, lowercase letters, numbers, and hyphens)',
    example: 'my-new-project',
  })
  projectId!: string;

  @ApiProperty({
    description: 'Display name for the project',
    example: 'My New Project',
    required: false,
  })
  displayName?: string;

  @ApiProperty({
    description:
      'Parent resource: folders/{folder_id} or organizations/{org_id}',
    example: 'folders/123456789',
  })
  parent!: string;
}

export class CreateProjectResponseDto {
  @ApiProperty({
    description: 'Full resource name (e.g. projects/123)',
    example: 'projects/my-new-project',
  })
  name!: string;

  @ApiProperty({
    description: 'Project ID',
    example: 'my-new-project',
  })
  projectId!: string;

  @ApiProperty({
    description: 'Display name',
    example: 'My New Project',
    required: false,
  })
  displayName?: string;

  @ApiProperty({
    description: 'Project lifecycle state',
    example: 'ACTIVE',
    required: false,
  })
  state?: unknown;
}
