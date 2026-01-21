import { User } from '@open-kingdom/shared-backend-data-access-database-setup';
import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: Omit<User, 'password'>;
  logout: () => void;
}
