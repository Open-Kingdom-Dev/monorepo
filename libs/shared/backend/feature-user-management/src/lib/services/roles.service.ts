import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';

import { DB_TAG, SCHEMA_TAG } from '@open-kingdom/shared-poly-util-constants';
import type { UserManagementSchema } from '../schemas';
import type { Role, NewRole } from '../schemas/roles.schema';

@Injectable()
export class RolesService {
  // Tables come from the host-composed schema (SCHEMA_TAG) rather than the
  // module-scope singletons, so a prefixed schema (embedded mode) works
  // transparently.
  private readonly roles: UserManagementSchema['roles'];
  private readonly userRoles: UserManagementSchema['userRoles'];

  constructor(
    @Inject(DB_TAG)
    private readonly db: BetterSQLite3Database<UserManagementSchema>,
    @Inject(SCHEMA_TAG) schema: UserManagementSchema
  ) {
    this.roles = schema.roles;
    this.userRoles = schema.userRoles;
  }

  async findAll(): Promise<Role[]> {
    return this.db.query.roles.findMany();
  }

  async findById(id: number): Promise<Role> {
    const role = await this.db.query.roles.findFirst({
      where: eq(this.roles.id, id),
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async findByName(name: string): Promise<Role | undefined> {
    return this.db.query.roles.findFirst({
      where: eq(this.roles.name, name),
    });
  }

  async create(
    name: string,
    description: string | null,
    isSystem = 0
  ): Promise<Role> {
    const existing = await this.findByName(name);

    if (existing) {
      throw new BadRequestException(`Role '${name}' already exists`);
    }

    await this.db.insert(this.roles).values({ name, description, isSystem });

    const created = await this.findByName(name);

    if (!created) {
      throw new BadRequestException('Failed to retrieve created role');
    }

    return created;
  }

  async update(
    id: number,
    data: Partial<Pick<NewRole, 'name' | 'description'>>
  ): Promise<Role> {
    const role = await this.findById(id);

    if (role.isSystem && data.name && data.name !== role.name) {
      throw new BadRequestException('Cannot rename a system role');
    }

    await this.db.update(this.roles).set(data).where(eq(this.roles.id, id));

    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    const role = await this.findById(id);

    if (role.isSystem) {
      throw new BadRequestException('Cannot delete a system role');
    }

    const assigned = await this.db.query.userRoles.findFirst({
      where: eq(this.userRoles.roleId, id),
    });

    if (assigned) {
      throw new BadRequestException(
        'Cannot delete a role that is assigned to users'
      );
    }

    await this.db.delete(this.roles).where(eq(this.roles.id, id));
  }
}
