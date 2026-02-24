import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { GcpProjectsService } from './gcp-projects.service.js';
import {
  GcpProjectSummaryDto,
  CreateProjectDto,
  CreateProjectResponseDto,
} from './gcp-projects.dto.js';

@ApiTags('GCP Resources')
@Controller('gcp')
export class GcpProjectsController {
  constructor(private readonly gcpProjectsService: GcpProjectsService) {}

  @Get('projects')
  @ApiOperation({
    summary: 'List GCP projects in org or folder',
    description:
      'List all projects under a GCP organization or folder. Parent must be `folders/{folder_id}` or `organizations/{org_id}`.',
  })
  @ApiQuery({
    name: 'parent',
    required: true,
    description:
      'Parent resource: folders/{folder_id} or organizations/{org_id}',
    example: 'folders/123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'List of projects',
    type: [GcpProjectSummaryDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Missing or invalid parent parameter',
  })
  async listProjects(
    @Query('parent') parent: string
  ): Promise<GcpProjectSummaryDto[]> {
    if (!parent?.trim()) {
      throw new BadRequestException(
        'Query parameter "parent" is required (e.g. folders/123 or organizations/456)'
      );
    }
    return this.gcpProjectsService.listProjectsByParent(parent.trim());
  }

  @Post('projects')
  @ApiOperation({
    summary: 'Create a new GCP project',
    description:
      'Create a new project in GCP. The project will be created under the specified parent (folder or organization).',
  })
  @ApiBody({
    type: CreateProjectDto,
    description: 'Project creation details',
    examples: {
      example: {
        summary: 'Create a new project',
        value: {
          projectId: 'my-new-project',
          displayName: 'My New Project',
          parent: 'folders/123456789',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Project created successfully',
    type: CreateProjectResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid request - missing required fields or invalid project ID',
  })
  async createProject(
    @Body() createProjectDto: CreateProjectDto
  ): Promise<CreateProjectResponseDto> {
    return this.gcpProjectsService.createProject(createProjectDto);
  }
}
