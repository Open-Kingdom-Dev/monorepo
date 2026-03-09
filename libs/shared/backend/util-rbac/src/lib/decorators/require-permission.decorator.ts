import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSION_KEY = 'requiredPermission';

export const RequirePermission = (resource: string, action: string) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, `${resource}:${action}`);
