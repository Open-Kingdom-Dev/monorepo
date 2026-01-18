import { vi } from 'vitest';

// Provide jest compatibility for vitest 4.x
// @ts-expect-error - jest shim for backward compatibility
globalThis.jest = vi;
