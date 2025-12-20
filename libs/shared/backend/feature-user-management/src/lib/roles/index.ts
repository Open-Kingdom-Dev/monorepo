// Module
export { RolesModule } from './roles.module.js';

// Service
export { RolesService } from './roles.service.js';

// DTOs
export {
  CreateRoleDto,
  CustomRoleResponseDto,
  DeleteRoleResponseDto,
} from './dto/index.js';

// Entities
export {
  customRoles,
  CustomRolesTableName,
  type CustomRole,
  type NewCustomRole,
} from './entities/index.js';
