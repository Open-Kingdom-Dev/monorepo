export * from './lib';
// Ensure endpoints are injected by importing the generated API
import './lib/demo-scaffold-backend/api';
import './lib/api-enhancements';
export { baseApi, ApiKey, apiReducer, apiMiddleware } from './lib/baseApi';
export * from './lib/adapters';
export type { AuthAdapter } from './lib/adapters/adapters.types';
export * from './lib/auth.slice';
export * from './lib/auth.listener';
export * from './lib/persistence';
