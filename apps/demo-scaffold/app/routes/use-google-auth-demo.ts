import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import axios from 'axios';
import { ApiLogEntry } from '../components/google-auth-demo/google-auth-api-inspector';

export interface GoogleEmulatorStatus {
  running: boolean;
  healthy: boolean;
  port: number;
  url?: string;
}

export interface GoogleUserProfile {
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
  hd?: string;
}

export interface GoogleOAuthTokens {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface GoogleOAuthResult {
  tokens: GoogleOAuthTokens;
  userProfile: GoogleUserProfile;
  apiLogs: ApiLogEntry[];
}

export default function useGoogleAuthDemo() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [status, setStatus] = useState<GoogleEmulatorStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [oauthResult, setOauthResult] = useState<GoogleOAuthResult | null>(
    null
  );
  const [authenticating, setAuthenticating] = useState(false);
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get<GoogleEmulatorStatus>(
        '/api/google-auth-emulate/status'
      );
      setStatus(res.data);
    } catch {
      setStatus({ running: false, healthy: false, port: 9015 });
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  // Fetch captured logs & last OAuth result
  const fetchLogsAndResult = useCallback(async () => {
    try {
      const [logsRes, resultRes] = await Promise.all([
        axios.get<ApiLogEntry[]>('/api/google-auth-emulate/logs'),
        axios.get<GoogleOAuthResult | null>(
          '/api/google-auth-emulate/last-result'
        ),
      ]);
      setApiLogs(logsRes.data || []);
      if (resultRes.data) {
        setOauthResult(resultRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch logs and OAuth result', err);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchLogsAndResult();

    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchLogsAndResult]);

  // Handle URL query parameters when returning from OAuth callback
  useEffect(() => {
    const authState = searchParams.get('auth');
    if (authState === 'success') {
      fetchLogsAndResult();
      setAuthError(null);
      // Clean query params from URL
      setSearchParams({}, { replace: true });
    } else if (authState === 'error') {
      const msg = searchParams.get('message') || 'Google authentication failed';
      setAuthError(msg);
      fetchLogsAndResult();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, fetchLogsAndResult]);

  // Actions
  const handleStart = async () => {
    setStarting(true);
    try {
      await axios.post('/api/google-auth-emulate/start');
      await fetchStatus();
    } catch (err) {
      console.error('Failed to start Google emulator', err);
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      await axios.post('/api/google-auth-emulate/stop');
      await fetchStatus();
    } catch (err) {
      console.error('Failed to stop Google emulator', err);
    } finally {
      setStopping(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await axios.post('/api/google-auth-emulate/reset');
      setOauthResult(null);
      setApiLogs([]);
      setAuthError(null);
      await fetchStatus();
    } catch (err) {
      console.error('Failed to reset Google emulator', err);
    } finally {
      setResetting(false);
    }
  };

  const handleSignIn = async () => {
    setAuthenticating(true);
    setAuthError(null);
    try {
      const res = await axios.get<{ authUrl: string }>(
        '/api/google-auth-emulate/login-url'
      );
      if (res.data?.authUrl) {
        window.location.href = res.data.authUrl;
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : String(err));
      setAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/google-auth-emulate/logout');
      setOauthResult(null);
      setAuthError(null);
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

  const handleClearLogs = async () => {
    setApiLogs([]);
  };

  return {
    status,
    loadingStatus,
    starting,
    stopping,
    resetting,
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
