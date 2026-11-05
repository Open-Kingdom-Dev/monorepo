export {
  leaseSlot,
  DEFAULT_REGISTRY_FILE_NAME,
  DEFAULT_SLOT_CACHE_ENV_VAR,
} from './lib/lease.js';
export type { LeaseOptions, PortLease } from './lib/lease.js';

export {
  portForSlot,
  portsForSlot,
  envForSlot,
  resolveUrlTemplates,
  recommendWidth,
  findPortCollisions,
  findDuplicateBases,
  portFromEnv,
  portsFromEnv,
} from './lib/port-math.js';
export type {
  PortMap,
  BandOptions,
  PortCollision,
  DuplicateBase,
  RecommendWidthOptions,
  PortFromEnvOptions,
} from './lib/port-math.js';

export {
  ENV_FILE_HEADER,
  renderEnvFile,
  writeEnvFile,
  parseEnvFile,
} from './lib/env-file.js';
export type {
  RenderEnvFileOptions,
  WriteEnvFileOptions,
  WriteEnvFileResult,
  EnvFileAction,
} from './lib/env-file.js';

export {
  EMPTY_REGISTRY,
  normalizeWorktreePath,
  parseWorktreePorcelain,
  parseRegistry,
  serializeRegistry,
  pruneRegistry,
  selectSlot,
  lowestFreeSlot,
} from './lib/registry.js';
export type {
  Registry,
  SlotRecord,
  SelectSlotInput,
  SelectSlotResult,
} from './lib/registry.js';

export { isPortFree, findBusyPorts } from './lib/bind-check.js';
export type { BindCheckOptions } from './lib/bind-check.js';
