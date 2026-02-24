import { Injectable, BadRequestException } from '@nestjs/common';
import { ProjectsClient } from '@google-cloud/resource-manager';

export interface GcpProjectSummary {
  name: string;
  projectId: string;
  displayName?: string;
  state?: unknown;
}

export interface CreateProjectRequest {
  projectId: string;
  displayName?: string;
  parent: string;
}

@Injectable()
export class GcpProjectsService {
  private readonly projectsClient = new ProjectsClient();

  /**
   * List all projects under a GCP organization or folder.
   * @param parent - Parent resource: `folders/{folder_id}` or `organizations/{org_id}`
   */
  async listProjectsByParent(parent: string): Promise<GcpProjectSummary[]> {
    const results: GcpProjectSummary[] = [];
    const iterable = this.projectsClient.listProjectsAsync({ parent });
    for await (const project of iterable) {
      results.push({
        name: project.name ?? '',
        projectId: project.name?.split('/').pop() ?? '',
        displayName: project.displayName ?? undefined,
        state: project.state ?? undefined,
      });
    }
    return results;
  }

  /**
   * Create a new GCP project.
   * Note: Projects are created at the organization level. To place in a folder,
   * use the moveProject operation after creation.
   * @param request - Project creation details
   */
  async createProject(
    request: CreateProjectRequest
  ): Promise<GcpProjectSummary> {
    const { projectId, displayName } = request;

    if (!projectId?.trim()) {
      throw new BadRequestException('Project ID is required');
    }

    // Validate project ID format (lowercase letters, numbers, hyphens, max 30 chars)
    const trimmedId = projectId.trim();
    if (!/^[a-z0-9-]+$/.test(trimmedId)) {
      throw new BadRequestException(
        'Project ID must contain only lowercase letters, numbers, and hyphens'
      );
    }
    if (trimmedId.length > 30) {
      throw new BadRequestException('Project ID must be 30 characters or less');
    }

    try {
      const [operation] = await this.projectsClient.createProject({
        project: {
          projectId: trimmedId,
          displayName: displayName?.trim() || trimmedId,
        },
      });

      // Wait for the operation to complete
      const [project] = await operation.promise();

      return {
        name: project.name ?? '',
        projectId: project.name?.split('/').pop() ?? trimmedId,
        displayName: project.displayName ?? displayName,
        state: project.state ?? undefined,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to create project: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
