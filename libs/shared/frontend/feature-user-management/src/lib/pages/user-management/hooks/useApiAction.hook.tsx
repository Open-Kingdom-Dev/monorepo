import { useCallback } from 'react';
import { getErrorMessage } from '../../../utils';

type NotifyFn = (
  type: 'success' | 'error' | 'warning',
  message: string
) => void;

type ConfirmFn = (message: string) => boolean;

type MutationResult<T> = { data: T } | { error: unknown };

const defaultConfirm: ConfirmFn = (message) => window.confirm(message);

export function useApiAction(
  onNotify?: NotifyFn,
  confirm: ConfirmFn = defaultConfirm
) {
  return useCallback(
    async <T,>(
      action: () => Promise<MutationResult<T>>,
      onSuccess: () => void,
      successMsg: string,
      errorMsg: string,
      confirmMsg?: string
    ) => {
      if (confirmMsg !== undefined && !confirm(confirmMsg)) {
        return;
      }

      const result = await action();

      if ('data' in result) {
        onSuccess();
        onNotify?.('success', successMsg);
        return;
      }

      if ('error' in result) {
        onNotify?.('error', getErrorMessage(result.error, errorMsg));
      }
    },
    [onNotify, confirm]
  );
}
