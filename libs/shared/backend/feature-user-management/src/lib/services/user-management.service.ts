import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import {
  UsersService,
  User,
} from '@open-kingdom/shared-backend-data-access-users';
import { UserRolesService } from './user-roles.service';

export type UserWithoutPassword = Omit<User, 'password'>;
export type UserWithRole = UserWithoutPassword & { role: string | null };

@Injectable()
export class UserManagementService {
  constructor(
    private readonly usersService: UsersService,
    private readonly userRolesService: UserRolesService
  ) {}

  async findAll(): Promise<UserWithRole[]> {
    const users = await this.usersService.findAll();
    return Promise.all(users.map((user) => this.enrichWithRole(user)));
  }

  async findById(id: number): Promise<UserWithRole> {
    const user = await this.usersService.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.enrichWithRole(user);
  }

  async delete(id: number, requesterId: number): Promise<void> {
    if (id === requesterId) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersService.delete(id);
  }

  private async enrichWithRole(user: User): Promise<UserWithRole> {
    const { password: _password, ...userWithoutPassword } = user;
    const role = await this.userRolesService.findPrimaryRole(user.id);

    return { ...userWithoutPassword, role };
  }
}
