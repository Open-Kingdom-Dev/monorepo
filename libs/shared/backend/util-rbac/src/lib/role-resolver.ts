export const ROLE_RESOLVER = 'ROLE_RESOLVER';

export interface RoleResolver {
  findPrimaryRole(userId: number): Promise<string | null>;
  findPermissions(userId: number): Promise<string[]>;
}
