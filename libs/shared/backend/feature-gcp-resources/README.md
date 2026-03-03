# `@open-kingdom/shared-backend-feature-gcp-resources`

A NestJS module exposing Google Cloud Platform project management via the Cloud Resource Manager API. Provides `GET /gcp/projects` for listing and `POST /gcp/projects` for creating GCP projects under a given organization or folder.

---

## Exports

| Export                      | Kind        | Description                                                                    |
| --------------------------- | ----------- | ------------------------------------------------------------------------------ |
| `FeatureGcpResourcesModule` | `class`     | Standard NestJS module (no dynamic configuration). Import directly.            |
| `GcpProjectsController`     | `class`     | REST controller. Registers `GET /gcp/projects` and `POST /gcp/projects`.       |
| `GcpProjectsService`        | `class`     | Injectable service wrapping `@google-cloud/resource-manager` `ProjectsClient`. |
| `GcpProjectSummaryDto`      | `class`     | Response DTO for a single GCP project.                                         |
| `CreateProjectDto`          | `class`     | Request DTO for project creation.                                              |
| `CreateProjectResponseDto`  | `class`     | Response DTO returned after project creation.                                  |
| `GcpProjectSummary`         | `interface` | Internal interface matching `GcpProjectSummaryDto`.                            |
| `CreateProjectRequest`      | `interface` | Internal interface matching `CreateProjectDto`.                                |

---

## Type Definitions

### `GcpProjectSummary` / `GcpProjectSummaryDto`

Both the internal `GcpProjectSummary` interface and the `GcpProjectSummaryDto` response class share the same shape:

| Property      | Type                   | Description                                          |
| ------------- | ---------------------- | ---------------------------------------------------- |
| `name`        | `string`               | Full resource name, e.g. `'projects/my-project-id'`. |
| `projectId`   | `string`               | Short project ID, e.g. `'my-project-id'`.            |
| `displayName` | `string \| undefined`  | Human-readable name.                                 |
| `state`       | `unknown \| undefined` | GCP project lifecycle state, e.g. `'ACTIVE'`.        |

### `CreateProjectRequest` / `CreateProjectDto`

Both the internal `CreateProjectRequest` interface and the `CreateProjectDto` request class share the same shape:

| Property      | Type     | Required | Description                                                                                              |
| ------------- | -------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `projectId`   | `string` | Yes      | Lowercase letters, numbers, and hyphens only. Maximum 30 characters. Must be globally unique within GCP. |
| `displayName` | `string` | No       | Human-readable label for the project.                                                                    |
| `parent`      | `string` | Yes      | Parent resource in the form `'folders/{folder_id}'` or `'organizations/{org_id}'`.                       |

### `CreateProjectResponseDto`

The creation response has the same shape as `GcpProjectSummaryDto`: `name`, `projectId`, `displayName`, and `state`.

---

## Module Registration

`FeatureGcpResourcesModule` is a standard (non-dynamic) NestJS module. No `register()` or `forRoot()` call is required.

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { FeatureGcpResourcesModule } from '@open-kingdom/shared-backend-feature-gcp-resources';

@Module({
  imports: [FeatureGcpResourcesModule],
})
export class AppModule {}
```

`GcpProjectsService` is exported from the module and can be injected by any module that imports `FeatureGcpResourcesModule`.

---

## Configuration

No module-level configuration options. Authentication is entirely managed by the Google Cloud client library via **Application Default Credentials (ADC)**.

### Authentication Setup

The `ProjectsClient` from `@google-cloud/resource-manager` resolves credentials automatically using the ADC chain:

1. `GOOGLE_APPLICATION_CREDENTIALS` environment variable — path to a service account JSON key file.
2. Metadata server — when running on GCP (GCE, GKE, Cloud Run, App Engine, etc.), the instance's attached service account is used automatically.

```bash
# Local development
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Or authenticate via gcloud CLI
gcloud auth application-default login
```

The service account must have the `resourcemanager.projects.list` permission to list projects and `resourcemanager.projects.create` to create projects.

---

## GcpProjectsService API

| Method                 | Parameters                      | Returns                        | Description                                                                                                                                                                                                                                  |
| ---------------------- | ------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listProjectsByParent` | `parent: string`                | `Promise<GcpProjectSummary[]>` | Lists all GCP projects under a parent organization or folder. The `parent` string must be in the form `'folders/{folder_id}'` or `'organizations/{org_id}'`. Uses an async iterable to page through all results.                             |
| `createProject`        | `request: CreateProjectRequest` | `Promise<GcpProjectSummary>`   | Creates a new GCP project. Validates that `projectId` matches `/^[a-z0-9-]+$/` and is no longer than 30 characters. Awaits the long-running operation before returning. Throws `BadRequestException` on validation failure or GCP API error. |

---

## REST Endpoints

### `GET /gcp/projects`

Lists all GCP projects accessible to the authenticated service account under the specified parent resource.

**Query parameters:**

| Parameter | Type     | Required | Description                                                         |
| --------- | -------- | -------- | ------------------------------------------------------------------- |
| `parent`  | `string` | Yes      | Parent resource: `folders/{folder_id}` or `organizations/{org_id}`. |

On success (`200 OK`) the response is an array of project summary objects, each containing `name`, `projectId`, `displayName`, and `state`. Returns `400 Bad Request` if the `parent` query parameter is missing or empty.

Example requests: `GET /gcp/projects?parent=folders/123456789` or `GET /gcp/projects?parent=organizations/987654321`.

### `POST /gcp/projects`

Creates a new GCP project. This is a long-running operation — the endpoint awaits completion before responding.

The request body must contain `projectId` and `parent` (both required), and optionally `displayName`. The `projectId` must match the pattern `/^[a-z0-9-]+$/` (lowercase letters, numbers, and hyphens only), be no longer than 30 characters, and be globally unique within GCP.

On success (`201 Created`) the response contains the created project's `name`, `projectId`, `displayName`, and `state`. Returns `400 Bad Request` for validation failures or GCP API errors.

---

## Injecting GcpProjectsService

```typescript
import { Module, Injectable } from '@nestjs/common';
import { FeatureGcpResourcesModule, GcpProjectsService, GcpProjectSummary } from '@open-kingdom/shared-backend-feature-gcp-resources';

@Injectable()
export class InfrastructureService {
  constructor(private gcpProjectsService: GcpProjectsService) {}

  async listProjectsInFolder(folderId: string): Promise<GcpProjectSummary[]> {
    return this.gcpProjectsService.listProjectsByParent(`folders/${folderId}`);
  }

  async provisionProject(projectId: string, folderId: string): Promise<GcpProjectSummary> {
    return this.gcpProjectsService.createProject({
      projectId,
      displayName: projectId,
      parent: `folders/${folderId}`,
    });
  }
}

@Module({
  imports: [FeatureGcpResourcesModule],
  providers: [InfrastructureService],
  exports: [InfrastructureService],
})
export class InfrastructureModule {}
```

---

## Testing

```bash
nx test @open-kingdom/shared-backend-feature-gcp-resources
```
