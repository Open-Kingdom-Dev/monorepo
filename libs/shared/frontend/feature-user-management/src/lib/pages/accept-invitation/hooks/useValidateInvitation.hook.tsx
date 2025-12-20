type MutationResult = { data: { success: boolean } } | { error: unknown };

export interface AcceptInvitationInjectedApi {
  useValidateInvitationQuery: (token: string) => {
    data:
      | {
          valid: boolean;
          email?: string;
          firstName?: string;
          lastName?: string;
          error?: string;
        }
      | undefined;
    isLoading: boolean;
    error: unknown;
  };
  useAcceptInvitationMutation: () => [
    (data: {
      token: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => Promise<MutationResult>,
    { isLoading: boolean }
  ];
}

interface UseValidateInvitationOptions {
  injectedApi: AcceptInvitationInjectedApi;
  token: string;
}

export function useValidateInvitation({
  injectedApi,
  token,
}: UseValidateInvitationOptions) {
  const {
    data: validation,
    isLoading,
    error,
  } = injectedApi.useValidateInvitationQuery(token);

  return {
    validation,
    isValidating: isLoading,
    validationError: error,
  };
}
