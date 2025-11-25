export * from './lib/data-access-api-client';
export * from './lib';
// Ensure endpoints are injected by importing the generated API
import './lib/demo-scaffold-backend/api';
export { baseApi, ApiKey, apiReducer, apiMiddleware } from './lib/baseApi';
