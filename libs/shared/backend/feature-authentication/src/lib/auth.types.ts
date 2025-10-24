import { User } from '@open-kingdom/shared-backend-data-access-users';
import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: Omit<User, 'password'>;
  logout: () => void;
}
