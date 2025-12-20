import { useState, useCallback } from 'react';
import { getErrorMessage } from '../../../utils';
import type { AcceptInvitationFormData } from '../../../schemas';
import type { AcceptInvitationInjectedApi } from './useValidateInvitation.hook';

type NotifyFn = (type: 'success' | 'error', message: string) => void;

interface UseAcceptInvitationApiOptions {
  injectedApi: AcceptInvitationInjectedApi;
  token: string;
  loginUrl?: string;
  onSuccess?: () => void;
  onNotify?: NotifyFn;
  onNavigate?: (url: string) => void;
}

const defaultNavigate = (url: string) => {
  window.location.href = url;
};

export function useAcceptInvitationApi({
  injectedApi,
  token,
  loginUrl = '/login',
  onSuccess,
  onNotify,
  onNavigate = defaultNavigate,
}: UseAcceptInvitationApiOptions) {
  const [success, setSuccess] = useState(false);
  const [acceptInvitationMutation, { isLoading: isAccepting }] =
    injectedApi.useAcceptInvitationMutation();

  const acceptInvitation = useCallback(
    async (data: AcceptInvitationFormData) => {
      const result = await acceptInvitationMutation({
        token,
        password: data.password,
        firstName: data.firstName?.trim() || undefined,
        lastName: data.lastName?.trim() || undefined,
      });

      if ('data' in result) {
        setSuccess(true);
        onNotify?.('success', 'Account activated successfully!');
        onSuccess?.();

        setTimeout(() => {
          onNavigate(loginUrl);
        }, 2000);
      } else if ('error' in result) {
        onNotify?.(
          'error',
          getErrorMessage(result.error, 'Failed to activate account')
        );
      }
    },
    [token, acceptInvitationMutation, onSuccess, onNotify, loginUrl, onNavigate]
  );

  return {
    acceptInvitation,
    isAccepting,
    success,
  };
}
