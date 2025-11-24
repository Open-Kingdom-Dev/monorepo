export * from './lib';
// Ensure endpoints are injected by importing the generated API
import './lib/demo-scaffold-backend/api';
export { baseApi, ApiKey, apiReducer, apiMiddleware, configureApiClient } from './lib/baseApi';
export * from './lib/adapters';
export type { AuthAdapter } from './lib/adapters/adapters.types';
