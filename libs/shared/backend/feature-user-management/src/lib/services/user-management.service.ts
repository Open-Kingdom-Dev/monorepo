import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import {
  UsersService,
  User,
} from '@open-kingdom/shared-backend-data-access-users';

export type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UserManagementService {
  constructor(private readonly usersService: UsersService) {}

  async findAll(): Promise<UserWithoutPassword[]> {
    const users = await this.usersService.findAll();
    return users.map((user) => this.excludePassword(user));
  }

  async findById(id: number): Promise<UserWithoutPassword> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.excludePassword(user);
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

  private excludePassword(user: User): UserWithoutPassword {
    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
