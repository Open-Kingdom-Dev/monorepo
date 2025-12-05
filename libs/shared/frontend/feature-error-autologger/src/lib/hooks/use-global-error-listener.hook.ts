import { useEffect } from 'react';
import type { ErrorListenerConfig } from '../error-autologger.types';
import { GlobalErrorListener } from '../listeners';

// React hook for global error listeners.
// Automatically cleans up on unmount.
export function useGlobalErrorListener(config: ErrorListenerConfig = {}): void {
  useEffect(() => {
    const listener = new GlobalErrorListener(config);
    return listener.attach();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.logger,
    config.notificationHandler,
    config.notify,
    config.log,
    config.defaultMessage,
  ]);
}
