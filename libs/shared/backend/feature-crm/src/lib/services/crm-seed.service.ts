import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  Optional,
} from '@nestjs/common';

import { ConfigurableLookupsService } from '@open-kingdom/shared-backend-data-access-configurable-lookups';
import {
  PermissionsService,
  RolesService,
} from '@open-kingdom/shared-backend-feature-user-management';

import { DEFAULT_CRM_LOOKUPS } from '../constants/default-lookups';
import { CRM_ROLE_PERMISSIONS } from '../constants/crm-permissions';
import {
  CRM_FEATURE_OPTIONS,
  CrmFeatureOptions,
} from '../crm-feature.options';

@Injectable()
export class CrmSeedService implements OnModuleInit {
  private readonly logger = new Logger(CrmSeedService.name);

  constructor(
    private readonly lookups: ConfigurableLookupsService,
    private readonly permissions: PermissionsService,
    private readonly roles: RolesService,
    @Optional()
    @Inject(CRM_FEATURE_OPTIONS)
    private readonly options: CrmFeatureOptions | null = null
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.options?.seedDefaults === false) {
      this.logger.log('CRM default seeding disabled via forRoot options');
      return;
    }
    await this.seedLookups();
    await this.mapRolePermissions();
  }

  private async seedLookups(): Promise<void> {
    await this.lookups.seedDefaults(DEFAULT_CRM_LOOKUPS);
    this.logger.log(
      `Seeded ${DEFAULT_CRM_LOOKUPS.length} default CRM lookup entries`
    );
  }

  private async mapRolePermissions(): Promise<void> {
    for (const [roleName, perms] of Object.entries(CRM_ROLE_PERMISSIONS)) {
      const role = await this.roles.findByName(roleName);
      if (!role) {
        this.logger.warn(
          `Role '${roleName}' not found; skipping CRM permission mapping`
        );
        continue;
      }
      const existingPermissionIds = (await this.permissions.findByRole(role.id)).map(
        (p) => p.id
      );
      const mergedIds = new Set<number>(existingPermissionIds);
      for (const perm of perms) {
        const existing = await this.permissions.findByResourceAction(
          perm.resource,
          perm.action
        );
        if (existing) {
          mergedIds.add(existing.id);
        } else {
          const created = await this.permissions.create(
            perm.resource,
            perm.action,
            'Auto-seeded CRM permission'
          );
          mergedIds.add(created.id);
        }
      }
      if (mergedIds.size > existingPermissionIds.length) {
        await this.permissions.setRolePermissions(role.id, Array.from(mergedIds));
        this.logger.log(
          `Mapped ${mergedIds.size - existingPermissionIds.length} new CRM permissions to role: ${roleName}`
        );
      }
    }
  }
}
