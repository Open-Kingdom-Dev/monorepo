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
  resolveSeedMode,
} from '../crm-feature.options';

@Injectable()
export class CrmSeedService implements OnModuleInit {
  private readonly logger = new Logger(CrmSeedService.name);

  // RolesService/PermissionsService come from FeatureUserManagementModule,
  // which embedded hosts (bring-your-own identity) don't register — both are
  // optional so the module still boots; permission mapping is skipped then.
  // The explicit @Inject tokens are required: the `| null` union erases the
  // emitted design:paramtypes metadata Nest would otherwise resolve by.
  constructor(
    private readonly lookups: ConfigurableLookupsService,
    @Optional()
    @Inject(PermissionsService)
    private readonly permissions: PermissionsService | null,
    @Optional()
    @Inject(RolesService)
    private readonly roles: RolesService | null,
    @Optional()
    @Inject(CRM_FEATURE_OPTIONS)
    private readonly options: CrmFeatureOptions | null = null
  ) {}

  async onModuleInit(): Promise<void> {
    const mode = resolveSeedMode(this.options);
    if (mode === 'none') {
      this.logger.log('CRM default seeding disabled via forRoot options');
      return;
    }
    await this.seedLookups();
    if (mode !== 'full') return;
    if (!this.roles || !this.permissions) {
      this.logger.warn(
        'FeatureUserManagementModule is not registered — skipping CRM ' +
          "role-permission mapping (use seed: 'lookups' to silence this)"
      );
      return;
    }
    await this.mapRolePermissions();
  }

  private async seedLookups(): Promise<void> {
    await this.lookups.seedDefaults(DEFAULT_CRM_LOOKUPS);
    this.logger.log(
      `Seeded ${DEFAULT_CRM_LOOKUPS.length} default CRM lookup entries`
    );
  }

  private async mapRolePermissions(): Promise<void> {
    const roles = this.roles;
    const permissions = this.permissions;
    if (!roles || !permissions) return; // guarded by the caller; narrows types
    for (const [roleName, perms] of Object.entries(CRM_ROLE_PERMISSIONS)) {
      const role = await roles.findByName(roleName);
      if (!role) {
        this.logger.warn(
          `Role '${roleName}' not found; skipping CRM permission mapping`
        );
        continue;
      }
      const existingPermissionIds = (await permissions.findByRole(role.id)).map(
        (p) => p.id
      );
      const mergedIds = new Set<number>(existingPermissionIds);
      for (const perm of perms) {
        const existing = await permissions.findByResourceAction(
          perm.resource,
          perm.action
        );
        if (existing) {
          mergedIds.add(existing.id);
        } else {
          const created = await permissions.create(
            perm.resource,
            perm.action,
            'Auto-seeded CRM permission'
          );
          mergedIds.add(created.id);
        }
      }
      if (mergedIds.size > existingPermissionIds.length) {
        await permissions.setRolePermissions(role.id, Array.from(mergedIds));
        this.logger.log(
          `Mapped ${
            mergedIds.size - existingPermissionIds.length
          } new CRM permissions to role: ${roleName}`
        );
      }
    }
  }
}
