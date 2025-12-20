import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { DB_TAG } from '@open-kingdom/shared-poly-util-constants';
import {
  customRoles,
  CustomRolesTableName,
  type CustomRole,
} from './entities/index.js';
import type { CreateRoleDto, CustomRoleResponseDto } from './dto/index.js';

type Schema = { [CustomRolesTableName]: typeof customRoles };

@Injectable()
export class RolesService {
  constructor(
    @Inject(DB_TAG) private readonly db: BetterSQLite3Database<Schema>
  ) {}

  async list(): Promise<CustomRoleResponseDto[]> {
    const roles = await this.db.select().from(customRoles);
    return roles.map(this.toResponseDto);
  }

  async create(
    dto: CreateRoleDto,
    creatorId: number
  ): Promise<CustomRoleResponseDto> {
    await this.ensureNameNotTaken(dto.name);

    const [role] = await this.db
      .insert(customRoles)
      .values({
        name: dto.name,
        description: dto.description ?? null,
        permissions: dto.permissions ?? null,
        createdAt: this.now(),
        createdBy: creatorId,
      })
      .returning();

    return this.toResponseDto(role);
  }

  async delete(roleId: number): Promise<void> {
    await this.ensureRoleExists(roleId);
    await this.db.delete(customRoles).where(eq(customRoles.id, roleId));
  }

  // Private helpers

  private async findById(id: number): Promise<CustomRole | undefined> {
    const [role] = await this.db
      .select()
      .from(customRoles)
      .where(eq(customRoles.id, id));
    return role;
  }

  private async ensureRoleExists(id: number): Promise<void> {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
  }

  private async ensureNameNotTaken(name: string): Promise<void> {
    const existing = await this.findByName(name);
    if (existing) {
      throw new ConflictException('Role with this name already exists');
    }
  }

  private async findByName(name: string): Promise<CustomRole | undefined> {
    const [role] = await this.db
      .select()
      .from(customRoles)
      .where(eq(customRoles.name, name));
    return role;
  }

  private toResponseDto(role: CustomRole): CustomRoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      createdAt: role.createdAt,
      createdBy: role.createdBy,
    };
  }

  private now(): number {
    return Math.floor(Date.now() / 1000);
  }
}
