export type Role = 'guest' | 'user' | 'admin';

export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
}
