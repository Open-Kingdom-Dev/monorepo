import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useDispatch } from 'react-redux';
import {
  showErrorNotification,
} from '@open-kingdom/shared-frontend-data-access-notifications';
import { logError } from '@open-kingdom/shared-frontend-data-access-logger';
import {
  useGoogleAuthEmulateControllerGetStatusQuery,
  useGoogleAuthEmulateControllerStartMutation,
  useGoogleAuthEmulateControllerStopMutation,
  useGoogleAuthEmulateControllerResetMutation,
  useGoogleAuthEmulateControllerGetLoginUrlQuery,
  useGoogleAuthEmulateControllerGetLogsQuery,
  useGoogleAuthEmulateControllerGetLastResultQuery,
  useGoogleAuthEmulateControllerLogoutMutation,
} from '@open-kingdom/shared-frontend-data-access-api-client';

export default function useGoogleAuthDemo() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // RTK Query status polling
  const {
    data: status,
    isLoading: loadingStatus,
    refetch: fetchStatus,
  } = useGoogleAuthEmulateControllerGetStatusQuery(undefined, {
    pollingInterval: 4000,
  });

  const [startEmulator, { isLoading: starting }] =
    useGoogleAuthEmulateControllerStartMutation();
  const [stopEmulator, { isLoading: stopping }] =
    useGoogleAuthEmulateControllerStopMutation();
  const [resetEmulator, { isLoading: resetting }] =
    useGoogleAuthEmulateControllerResetMutation();
  const [logout, { isLoading: loggingOut }] =
    useGoogleAuthEmulateControllerLogoutMutation();

  // Fetch captured logs & last OAuth result whenever status reports healthy.
  const {
    data: oauthResult,
    refetch: refetchLogsAndResult,
  } = useGoogleAuthEmulateControllerGetLastResultQuery(undefined, {
    skip: !status?.running || !status?.healthy,
  });
  const { data: apiLogs = [] } = useGoogleAuthEmulateControllerGetLogsQuery(
    undefined,
    {
      skip: !status?.running || !status?.healthy,
    }
  );

  const [triggerLoginUrl] = useGoogleAuthEmulateControllerGetLoginUrlQuery(
    undefined,
    { skip: true }
  );

  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Refetch logs + result when returning from the OAuth callback or after
  // a sign-in, so the inspector populates without waiting for a poll.
  useEffect(() => {
    const authState = searchParams.get('auth');
    if (authState === 'success' || authState === 'error') {
      if (status?.running && status?.healthy) {
        refetchLogsAndResult();
      }
      if (authState === 'success') {
        setAuthError(null);
      } else {
        const msg =
          searchParams.get('message') || 'Google authentication failed';
        setAuthError(msg);
      }
      // Clean query params from URL
      setSearchParams({}, { replace: true });
    }
  }, [
    searchParams,
    setSearchParams,
    status?.running,
    status?.healthy,
    refetchLogsAndResult,
  ]);

  // Actions
  const handleStart = async () => {
    try {
      await startEmulator().unwrap();
      fetchStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      dispatch(logError('Failed to start Google emulator: ' + message));
      dispatch(showErrorNotification('Failed to start Google emulator'));
    }
  };

  const handleStop = async () => {
    try {
      await stopEmulator().unwrap();
      fetchStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      dispatch(logError('Failed to stop Google emulator: ' + message));
      dispatch(showErrorNotification('Failed to stop Google emulator'));
    }
  };

  const handleReset = async () => {
    try {
      await resetEmulator().unwrap();
      setAuthError(null);
      refetchLogsAndResult();
      fetchStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      dispatch(logError('Failed to reset Google emulator: ' + message));
      dispatch(showErrorNotification('Failed to reset Google emulator'));
    }
  };

  const handleSignIn = async () => {
    setAuthenticating(true);
    setAuthError(null);
    try {
      const res = await triggerLoginUrl().unwrap();
      if (res?.authUrl) {
        window.location.href = res.authUrl;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setAuthError(message);
      dispatch(logError('Failed to get Google auth URL: ' + message));
      dispatch(showErrorNotification('Failed to get Google auth URL'));
      setAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      refetchLogsAndResult();
      setAuthError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      dispatch(logError('Failed to log out: ' + message));
      dispatch(showErrorNotification('Failed to log out'));
    }
  };

  const handleClearLogs = () => {
    // Local-only: the inspector list is driven by the RTK Query cache, which
    // is refetched on the next status poll. Persisted logs live server-side.
  };

  return {
    status,
    loadingStatus,
    starting,
    stopping,
    resetting,
    loggingOut,
    oauthResult,
    authenticating,
    apiLogs,
    authError,
    handleStart,
    handleStop,
    handleReset,
    handleSignIn,
    handleLogout,
    handleClearLogs,
  };
}
