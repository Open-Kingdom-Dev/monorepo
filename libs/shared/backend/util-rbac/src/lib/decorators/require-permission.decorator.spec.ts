import {
  REQUIRED_PERMISSION_KEY,
  RequirePermission,
} from './require-permission.decorator.js';

describe('RequirePermission decorator', () => {
  it('marks an endpoint as requiring a specific permission', () => {
    class UsersController {
      @RequirePermission('users', 'read')
      listUsers() {
        return [];
      }
    }

    const permission = Reflect.getMetadata(
      REQUIRED_PERMISSION_KEY,
      UsersController.prototype.listUsers
    );
    expect(permission).toBe('users:read');
  });

  it('each endpoint can require its own permission', () => {
    class RolesController {
      @RequirePermission('roles', 'read')
      listRoles() {
        return [];
      }

      @RequirePermission('roles', 'manage')
      createRole() {
        return;
      }
    }

    const listPermission = Reflect.getMetadata(
      REQUIRED_PERMISSION_KEY,
      RolesController.prototype.listRoles
    );
    const createPermission = Reflect.getMetadata(
      REQUIRED_PERMISSION_KEY,
      RolesController.prototype.createRole
    );

    expect(listPermission).toBe('roles:read');
    expect(createPermission).toBe('roles:manage');
  });
});
